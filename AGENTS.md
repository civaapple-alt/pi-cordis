# AGENTS.md — Pi-Cordis 开发者与智能体工程规范

> **Repository**: [https://github.com/civaapple-alt/pi-cordis](https://github.com/civaapple-alt/pi-cordis)  
> **License**: MIT  
> **Core Foundation**: Cordis v4.0.1 Microkernel + Pi Terminal Agent

[English](AGENTS.md) | 中文

**Pi-Cordis** 是基于 **Cordis (v4.0.1)** 微内核与“**Everything is a plugin**”设计哲学重构的 AI 编码智能体工程，100% 保持 [`earendil-works/pi`](https://github.com/earendil-works/pi) 的原生编码能力、交互式终端 UI（TUI）与扩展市场生态，同时仅依赖本地 Vendored Cordis 元框架内核。

---

## 📖 渐进式规范导航 (Progressive Navigation)

- [一、核心架构原则与设计哲学](#一核心架构原则与设计哲学)
- [二、控制面与数据面分层架构](#二控制面与数据面分层架构)
- [三、仓库目录与工作区规范](#三仓库目录与工作区规范)
- [四、Cordis 10 大核心服务矩阵](#四cordis-10-大核心服务矩阵)
- [五、防御性编程与防双轨制反模式](#五防御性编程与防双轨制反模式)
- [六、质量门禁与测试指令](#六质量门禁与测试指令)
- [七、架构决策记录 (ADR) 演进规范](#七架构决策记录-adr-演进规范)
- [八、代码风格与 Git 提交规范](#八代码风格与-git-提交规范)

---

## 一、核心架构原则与设计哲学

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
   - 7 大核心内置工具（4 核心：`read`, `write`, `edit`, `bash` + 3 可选：`grep`, `find`, `ls`）；
   - 1307+ 个模型提供商支持（OpenAI, Anthropic, Gemini, DeepSeek, Mistral, Ollama, Bedrock 等）；
   - 完整支持 CLI 参数、Slash Commands（`/help`, `/model`, `/session`, `/clear`, `/compact`, `/tree` 等）。
6. **全面支持 Pi 原生插件生态 (`https://pi.dev/packages`)**：
   - 内置 `ExtensionService` 完整桥接 Pi 的 `ExtensionAPI` 至 Cordis 事件总线与服务容器；
   - 内置 `PackageManagerService` 支持从 `pi.dev`、npm、git 和本地路径一键安装管理插件。

---

## 二、控制面与数据面分层架构

Pi-Cordis 采用经典的**绞杀者模式（Strangler Fig Pattern）**：

```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │         Cordis 微内核控制面 (Control Plane: packages/.../src/core/cordis)│
  │  Context 容器 / static provide / 生命周期事件 / 服务发现 / 依赖注入    │
  └──────────────────┬──────────────────────────────────┬──────────────────┘
                     │                                  │
      ┌──────────────▼─────────────┐      ┌─────────────▼──────────────┐
      │  Service 插件适配包装层    │      │  ExtensionAPI 桥接适配器   │
      │  (Settings, AI, Tools...)  │      │  (pi.on <-> ctx.on)        │
      └──────────────┬─────────────┘      └─────────────┬──────────────┘
                     │                                  │
  ┌──────────────────▼──────────────────────────────────▼──────────────────┐
  │         Pi 底层数据与算法面 (Data Plane: 原生 packages/* 核心算法)     │
  │  LLM Token 流处理 / Agent 状态树 / SQLite 存储 / TUI 双缓冲字符渲染    │
  └────────────────────────────────────────────────────────────────────────┘
```

- **数据与算法面**：`packages/ai`、`packages/tui` 等子包作为纯粹的算法和数据处理资产，保持独立高内聚；
- **控制面**：`packages/coding-agent/src/core/cordis/` 负责全系统能力的生命周期管理、装配与插件事件路由。

---

## 三、仓库目录与工作区规范

```text
pi-cordis/
├── vendor/                           # Vendored Cordis 框架源码 (独立审计与维护)
│   ├── cordis/                       # @deepseek-ai/cordis (4.0.1)
│   ├── cosmokit/                     # @deepseek-ai/cosmokit (1.8.1)
│   ├── schemastery/                  # @deepseek-ai/schemastery (3.18.0)
│   └── ...                           # 辅助插件
│
├── packages/                         # Monorepo 子包工作区
│   ├── coding-agent/                 # 编码智能体应用主包 (CLI 入口、模式调度、交互式 TUI)
│   │   └── src/core/cordis/          # Cordis 微内核整合中枢与 10 大核心服务实现
│   │       ├── bootstrap.ts          # createPiContext 应用级微内核引导器
│   │       ├── types.ts              # Context 与 Events 声明合并
│   │       └── services/             # 核心服务实现
│   ├── ai/                           # 统一多模型引擎 (1307+ 模型定义)
│   ├── agent/                        # 智能体核心推理循环与状态管理
│   ├── tui/                          # 终端 UI 渲染引擎 (Canvas, 差异化重绘)
│   ├── session-backends/sqlite-node/ # SQLite 会话持久化驱动
│   ├── protocol/                     # JSON-RPC 协议模式
│   ├── client/                       # RPC 客户端
│   ├── server/                       # RPC 服务端
│   └── telemetry/                    # 遥测与链路追踪
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

## 四、Cordis 10 大核心服务矩阵

| 服务类 | 挂载键 | 核心职责 |
|---|---|---|
| `SettingsService` | `ctx.settings` | 全局 (`~/.pi/agent/settings.json`) 与项目级 (`.pi/settings.json`) 配置管理 |
| `AuthService` | `ctx.auth` | API 密钥、OAuth 令牌与安全凭据管理 |
| `AIService` | `ctx.ai` | 封装 `ModelRuntime`，管理 1307+ 模型定义、流式交互与 Token 统计 |
| `ToolRegistryService` | `ctx.tools` | 统一管理 4 核心 + 3 可选内置工具与动态扩展工具注册中心 |
| `SessionService` | `ctx.session` | SQLite 与内存会话存储、多分支树管理与会话导出 |
| `SkillsService` | `ctx.skills` | 自动扫描、解析并提供提示词与目录技能 |
| `PromptsService` | `ctx.prompts` | 提示词模板引擎与参数变量插值 |
| `ExtensionService` | `ctx.extensions` | 加载 Pi 扩展并透明桥接 `ExtensionAPI` 至 Cordis 事件 |
| `PackageManagerService` | `ctx.packageManager` | 跨 `pi.dev`、npm、git 与本地来源的插件包安装管理 |
| `AgentService` | `ctx.agent` | 智能体多轮会话推理循环调度 |

---

## 五、防御性编程与防双轨制反模式

为了维护微内核的架构纯洁性，所有开发者与 AI 助手必须遵守以下**防御性编程准则**：

1. **严禁绕过微内核私自实例化核心类（Anti-Bypass Rule）**：
   - ❌ 严禁在业务逻辑中直接 `import { Agent } from "@earendil-works/pi-agent-core"` 并 `new Agent()`；
   - ✅ 必须通过 `ctx.agent` 或 `createPiContext()` 统一获取与驱动智能体。
2. **显式声明服务提供者键（`static provide`）**：
   - 所有继承 `Service` 的类必须显式声明 `static provide = 'keyName'`，以便 Cordis 运行时自动完成依赖注入与微任务 Fiber 激活。
3. **注册即副作用（Registrations are Effects）**：
   - 所有插件贡献必须通过 `ctx.effect()` 或 `ctx.on()` 注册，并返回标准的 `Disposer` 销毁函数，确保可逆卸载。
4. **跨平台兼容性防范**：
   - Windows 路径必须使用 `pathToFileURL(p).href` 进行 ESM 动态导入；
   - 软链接创建需在 Windows 非特权环境下安全降级为 Junction 或优雅捕获 `EPERM`；
   - POSIX 专属测试（如 Unix Domain Socket 绑定）必须标记 `describe.skipIf(process.platform === "win32")`。

---

## 六、质量门禁与测试指令

```bash
# 1. 运行全工作区单元测试 (3500+ 测试)
pnpm test

# 2. 运行 Cordis 微内核引导专属测试
npx vitest run packages/coding-agent/test/cordis-bootstrap.test.ts

# 3. 运行单个子包测试
pnpm --filter=@earendil-works/pi-ai test
pnpm --filter=@earendil-works/pi-tui test

# 4. TypeScript 严格类型检查
pnpm run check

# 5. 启动交互式 TUI 实机体验
pnpm pi

# 6. 安装与验证社区扩展
pnpm pi install npm:@juicesharp/rpiv-todo
```

---

## 七、架构决策记录 (ADR) 演进规范

任何重大的架构调整、抽象层变更或设计权衡，必须在 [`.agents/notes/`](.agents/notes/README.zh.md) 中记录为正式的 ADR 笔记：
- 采用中英双语格式（`YYYY-MM-DD-title.md` 与 `.zh.md`）；
- 结构包含：**Problem（问题背景）**、**Decision（决策与方案）**、**Trade-offs（代价与权衡）**、**Consequences（影响与后果）**。

---

## 八、代码风格与 Git 提交规范

1. **ESM 原生模块化**：全仓使用 `"type": "module"`，导入语句使用显式 `.ts` 扩展名。
2. **严格类型约束**：`strict: true`，严禁无理由使用 `any`。
3. **阶段性提交与更新日志**：
   - 每次关键功能、测试修复或文档完善必须及时执行 `git commit`；
   - 在 [`CHANGELOG.md`](CHANGELOG.md) 中同步记录新增（Added）、变更（Changed）或修复（Fixed）。
