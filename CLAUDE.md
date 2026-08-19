# AGENTS.md — Pi-Cordis 开发与架构规范

[English](AGENTS.md) | 中文

**Pi-Cordis (🥧)** 是基于 **Cordis (v4.0.1)** 微内核与“**Everything is a plugin**”设计哲学重构的 AI 编码智能体工程，100% 保持 [`earendil-works/pi`](https://github.com/earendil-works/pi) 的原生编码能力、交互式终端 UI（TUI）与扩展市场生态，同时仅依赖本地 Vendored Cordis 元框架内核。

---

## 一、 核心架构原则

1. **Everything is a Plugin（一切皆插件）**：
   - 系统的配置管理、鉴权凭据、模型驱动、工具注册中心、会话存储、技能系统、提示词模板、扩展机制与智能体推理循环全部解耦为自治的 Cordis 服务（`Service`）与插件（`Plugin`）。
2. **严格依赖隔离（Zero DSH Plugins）**：
   - 零引入 `deepseek-harness` 专属业务插件（`@deepseek-ai/dsh-*`），系统完全独立自洽。
3. **纯净 Vendored Cordis 元框架内核**：
   - 仅依赖 `vendor/` 目录下的 Cordis 核心套件（`@deepseek-ai/cordis`、`@deepseek-ai/cosmokit`、`@deepseek-ai/schemastery` 等），享有独立可审计、可定制的微内核基础。
4. **强类型 Context 声明合并与生命周期事件总线**：
   - 通过 TypeScript 声明合并扩充 Cordis `Context`（`ctx.settings`, `ctx.auth`, `ctx.ai`, `ctx.tools`, `ctx.session`, `ctx.skills`, `ctx.prompts`, `ctx.extensions`, `ctx.packageManager`, `ctx.agent`）；
   - 定义标准的生命周期事件集（`pi/session-start`、`pi/session-before`、`pi/session-after`、`pi/tool-call`、`pi/tool-result`、`pi/model-change`、`pi/prompt-transform`）。
5. **100% 保持 Pi 的功能与 TUI 体验**：
   - 交互式终端 UI（Canvas、差异化渲染、分支树选择器、Diff 对比、Markdown 流式渲染、状态栏）；
   - 7 大核心内置工具（`read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`）；
   - 1307+ 个模型提供商支持（OpenAI, Anthropic, Gemini, DeepSeek, Mistral, Ollama, Bedrock 等）；
   - 完整支持 CLI 参数、Slash Commands（`/help`, `/model`, `/session`, `/clear`, `/compact`, `/tree` 等）。
6. **全面支持 Pi 原生插件生态 (`https://pi.dev/packages`)**：
   - 内置 `ExtensionService` 完整桥接 Pi 的 `ExtensionAPI` 至 Cordis 事件总线与服务容器；
   - 内置 `PackageManagerService` 支持从 `pi.dev`、npm、git 和本地路径一键安装管理插件。

---

## 二、 仓库结构与目录说明

```text
pi-cordis/
├── vendor/                           # Vendored Cordis 框架源码 (独立审计与维护)
│   ├── cordis/                       # @deepseek-ai/cordis (4.0.1)
│   ├── cosmokit/                     # @deepseek-ai/cosmokit (1.8.1)
│   ├── schemastery/                  # @deepseek-ai/schemastery (3.18.0)
│   ├── loader/                       # @deepseek-ai/cordis-plugin-loader
│   ├── include/                      # @deepseek-ai/cordis-plugin-include
│   ├── group/                        # @deepseek-ai/cordis-plugin-group
│   ├── timer/                        # @deepseek-ai/cordis-plugin-timer
│   ├── hmr/                          # @deepseek-ai/cordis-plugin-hmr
│   └── logger-console/               # @deepseek-ai/cordis-plugin-logger-console
│
├── packages/                         # Monorepo 子包工作区
│   ├── coding-agent/                 # 编码智能体应用主包 (CLI 入口、模式调度、交互式 TUI)
│   │   └── src/core/cordis/          # Cordis 微内核整合中枢与 10 大核心服务实现
│   │       ├── bootstrap.ts          # createPiContext 应用级微内核引导器
│   │       ├── types.ts              # Context 与 Events 声明合并
│   │       └── services/             # 核心服务 (settings, auth, ai, tools, session, etc.)
│   ├── ai/                           # 统一多模型引擎与提供商目录 (1307+ 模型定义)
│   ├── agent/                        # 智能体核心推理循环与状态管理
│   ├── tui/                          # 终端 UI 渲染引擎 (Canvas, 差异化重绘, 终端组件)
│   ├── session-backends/sqlite-node/ # SQLite 会话持久化驱动
│   ├── protocol/                     # JSON-RPC 协议模式
│   ├── client/                       # RPC 客户端
│   ├── server/                       # RPC 服务端
│   ├── telemetry/                    # 遥测与链路追踪
│   └── evals/                        # 评估与基准测试
│
├── .agents/notes/                    # 架构决策记录 (Agent Notes & ADR)
│   ├── implemented/architecture/     # 已实施的技术架构与生态集成记录
│   ├── README.md                     # 英文索引
│   └── README.zh.md                  # 中文索引
│
├── CHANGELOG.md                      # 中文更新日志 (Keep a Changelog)
├── package.json                      # 根工作区配置
├── pnpm-workspace.yaml               # pnpm 工作区关联
├── tsconfig.base.json                # 基础 TypeScript 配置
├── tsconfig.json                     # 统一 TypeScript 路径映射配置
└── README.md                         # 项目主页与快速入门
```

---

## 三、 微内核服务矩阵

| 服务类 | 挂载键 | 核心职责 |
|---|---|---|
| `SettingsService` | `ctx.settings` | 全局 (`~/.pi/agent/settings.json`) 与项目级 (`.pi/settings.json`) 配置管理 |
| `AuthService` | `ctx.auth` | API 密钥、OAuth 令牌与安全凭据管理 |
| `AIService` | `ctx.ai` | 封装 `ModelRuntime`，管理 1307+ 模型定义、流式交互与 Token 统计 |
| `ToolRegistryService` | `ctx.tools` | 统一管理 7 大内置工具与动态扩展工具注册中心 |
| `SessionService` | `ctx.session` | SQLite 与内存会话存储、多分支树管理与会话导出 |
| `SkillsService` | `ctx.skills` | 自动扫描、解析并提供提示词与目录技能 |
| `PromptsService` | `ctx.prompts` | 提示词模板引擎与参数变量插值 |
| `ExtensionService` | `ctx.extensions` | 加载 Pi 扩展并透明桥接 `ExtensionAPI` 至 Cordis 事件 |
| `PackageManagerService` | `ctx.packageManager` | 跨 `pi.dev`、npm、git 与本地来源的插件包安装管理 |
| `AgentService` | `ctx.agent` | 智能体多轮会话推理循环调度 |

---

## 四、 常用开发与运行指令

```bash
# 1. 安装依赖
pnpm install

# 2. 启动交互式 TUI
pnpm pi

# 3. 单任务非交互式执行
pnpm pi -p "检查当前项目结构"

# 4. 列出可用模型
pnpm pi --list-models

# 5. 运行微内核单元测试
pnpm test

# 6. TypeScript 类型检查
pnpm run check

# 7. 安装 pi 扩展市场插件
pnpm pi install npm:@foo/pi-extension
```

---

## 五、 编码与 Git 规范

1. **ESM 原生模块化**：项目全面采用 `"type": "module"`，导入路径遵循显式 `.ts` 扩展名。
2. **严格类型安全**：开启 `strict: true`，严禁无理由使用 `any`。
3. **Cordis 服务约定**：所有服务类必须继承 `Service` 并显式声明 `static provide = '...'`。
4. **提交与更新日志**：
   - 每次关键特性或架构变更必须及时进行 `git commit`；
   - 同步在 [CHANGELOG.md](CHANGELOG.md) 中以中文清晰记录新增（Added）、变更（Changed）或修复（Fixed）。
