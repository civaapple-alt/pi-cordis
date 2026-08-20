# AGENTS.md — Pi-Cordis 开发者与智能体工程规范

> **Repository**: [https://github.com/civaapple-alt/pi-cordis](https://github.com/civaapple-alt/pi-cordis)  
> **License**: MIT  
> **Core Foundation**: Cordis v4.0.1 Microkernel + Pi Terminal Agent + Native Plugins Workspace

[English](AGENTS.md) | 中文

**Pi-Cordis** 是基于 **Cordis (v4.0.1)** 微内核与“**Everything is a plugin**”设计哲学重构的 AI 编码智能体工程，100% 保持 [`earendil-works/pi`](https://github.com/earendil-works/pi) 的原生编码能力、交互式终端 UI（TUI）与扩展市场生态，同时引入模块化 `packages/plugins/*` 插件子包与声明式 `presets/` 预设目录体系。

---

## 📖 渐进式规范导航 (Progressive Navigation)

- [一、核心架构原则与 The 5 Pillars](#一核心架构原则与-the-5-pillars)
- [二、控制面与数据面分层架构](#二控制面与数据面分层架构)
- [三、仓库目录与工作区规范](#三仓库目录与工作区规范)
- [四、Cordis 10 大核心服务矩阵](#四cordis-10-大核心服务矩阵)
- [五、15 个内置插件与 3 大场景预设开发规范](#五15-个内置插件与-3-大场景预设开发规范)
- [六、防御性编程与防双轨制反模式](#六防御性编程与防双轨制反模式)
- [七、质量门禁与测试指令](#七质量门禁与测试指令)
- [八、架构决策记录 (ADR) 演进规范](#八架构决策记录-adr-演进规范)
- [九、代码风格与 Git 提交规范](#九代码风格与-git-提交规范)

---

## 一、核心架构原则与 The 5 Pillars

Pi-Cordis 的所有服务、插件与预设全面遵循 **DSH 5 大核心架构准则 (The 5 Pillars)**：

1. **能力接缝 (Capability Seams)**：
   - 严格的三位一体 Seam 设计：服务定义（`types.ts`）、服务提供者（`services/*.ts`）与消费者插件（`packages/plugins/*`），通过 `export const inject = [...]` 实现访问权限沙箱。
2. **可逆销毁 (Reversibility & Fiber Teardown)**：
   - “注册即副作用，副作用必可逆”：所有动态注册（工具、技能、模板、Provider）均包装在 `this.ctx.effect()` 中，返回标准的 `Disposer` 销毁函数，在 Fiber 卸载或预设切换时零残留清理。
3. **响应式事件总线 (Reactive Event Bus)**：
   - 在中央 Cordis 事件总线上广播细粒度类型化事件流（`pi/settings-updated`、`pi/tool-call`、`pi/tool-result`、`pi/session-created`、`pi/model-change` 等）。
4. **瀑布与串行拦截链 (Waterfall & Interceptor Chains)**：
   - 内置 `executeTool` 拦截管道（`pi/tool-call` 串行前置安全校验 + `pi/tool-result` 并行后置处理）。
5. **作用域隔离 (Context Isolation)**：
   - 通过 `ctx.extend()` 为子智能体（Subagent）与临时沙箱派生隔离的 Fiber 作用域，杜绝跨会话状态污染。

---

## 二、控制面与数据面分层架构

Pi-Cordis 采用经典的**绞杀者模式（Strangler Fig Pattern）**：

```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │         Cordis 微内核控制面 (Control Plane: packages/.../src/core/cordis)│
  │  Context 容器 / static provide / 生命周期事件 / 插件与 Presets 扫描     │
  └──────────────────┬──────────────────────────────────┬──────────────────┘
                     │                                  │
      ┌──────────────▼─────────────┐      ┌─────────────▼──────────────┐
      │  10 大 Core Service 服务层 │      │  ExtensionAPI 桥接适配器   │
      │  (Settings, AI, Tools...)  │      │  (pi.on <-> ctx.on)        │
      └──────────────┬─────────────┘      └─────────────┬──────────────┘
                     │                                  │
  ┌──────────────────▼──────────────────────────────────▼──────────────────┐
  │         Pi 底层数据与算法面 (Data Plane: 原生 packages/* 核心算法)     │
  │  LLM Token 流处理 / Agent 状态树 / SQLite 存储 / TUI 双缓冲字符渲染    │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 三、仓库目录与工作区规范

```text
pi-cordis/
├── vendor/                           # Vendored Cordis (v4.0.1) 微内核源码
│   ├── cordis/                       # @deepseek-ai/cordis
│   ├── cosmokit/                     # @deepseek-ai/cosmokit
│   └── schemastery/                  # @deepseek-ai/schemastery
│
├── presets/                          # 🌟 3 大场景化 Agent 运行预设
│   ├── README.md                     # Presets 规范与扩展指南
│   ├── default/                      # preset.yml + cordis.yml (默认即最佳)
│   ├── plan/                         # preset.yml + cordis.yml (规划与审计)
│   └── ptc/                          # preset.yml + cordis.yml (编程调用模式)
│
├── packages/                         # Monorepo 子包工作区
│   ├── coding-agent/                 # 编码智能体主包 (CLI 入口、TUI 界面与 Cordis 引导器)
│   │   ├── docs/cordis/services/     # 10 大核心服务详细文档与 API 契约
│   │   └── src/core/cordis/          # 10 大核心服务源码 + createPiContext
│   └── plugins/                      # 🌟 15 个原生 Cordis 插件工作区
│       ├── safety-gate/              # @pi-cordis/plugin-safety-gate (命令与路径安全)
│       ├── git-guard/                # @pi-cordis/plugin-git-guard (Git 检查点与快照)
│       ├── todo-tracker/             # @pi-cordis/plugin-todo-tracker (四态任务管理)
│       ├── rules-injector/           # @pi-cordis/plugin-rules-injector (规则自动发现)
│       ├── code-mode/                # @pi-cordis/plugin-code-mode (PTC 编程调用)
│       ├── ask-question/             # @pi-cordis/plugin-ask-question (人机交互问答)
│       ├── plan-mode/                # @pi-cordis/plugin-plan-mode (只读规划模式)
│       ├── output-truncator/         # @pi-cordis/plugin-output-truncator (输出防爆与 Spill)
│       ├── context-compactor/        # @pi-cordis/plugin-context-compactor (结构化会话压缩)
│       ├── subagent/                 # @pi-cordis/plugin-subagent (子智能体协同)
│       ├── session-handoff/          # @pi-cordis/plugin-session-handoff (交接信封)
│       ├── git-automation/           # @pi-cordis/plugin-git-automation (Conventional Commit)
│       ├── ssh-delegator/            # @pi-cordis/plugin-ssh-delegator (远程 SSH 代理)
│       ├── tools-manager/            # @pi-cordis/plugin-tools-manager (工具可见性管理)
│       └── profiles/                 # @pi-cordis/profiles (YAML & Presets 装配中枢)
│
├── .agents/notes/                    # 架构决策记录 (Agent Notes & ADR)
│   ├── implemented/architecture/     # 已实施的技术架构与生态集成记录
│   ├── implemented/simplification/   # 仓库精简与依赖解耦决策记录
│   ├── archived/architecture/        # 历史归档快照
│   └── README.zh.md                  # 中文决策索引与演进方法论
│
├── CHANGELOG.md                      # 中文更新日志 (Keep a Changelog)
├── pnpm-workspace.yaml               # pnpm 工作区关联
├── tsconfig.json                     # 统一 TypeScript 路径映射配置
└── README.md                         # 项目主页与快速入门
```

---

## 四、Cordis 10 大核心服务矩阵

详细文档见 [`packages/coding-agent/docs/cordis/services/`](packages/coding-agent/docs/cordis/services/README.zh.md)：

| 服务类 | 挂载键 | 核心职责与响应式事件 |
|---|---|---|
| `SettingsService` | `ctx.settings` | 全局 (`~/.pi/agent/settings.json`) 与项目级 (`.pi/settings.json`) 配置管理；广播 `pi/settings-updated` |
| `AuthService` | `ctx.auth` | API 密钥、OAuth 令牌与安全凭据管理；广播 `pi/auth-updated` |
| `AIService` | `ctx.ai` | 封装 `ModelRuntime`，管理 1307+ 模型定义、动态 Provider 注册；广播 `pi/model-change` |
| `ToolRegistryService` | `ctx.tools` | 统一管理 7 大内置工具与动态扩展工具、执行拦截管道；广播 `pi/tool-registered`/`unregistered` |
| `SessionService` | `ctx.session` | SQLite 与内存会话存储、活跃会话池追踪；广播 `pi/session-created`/`forked`/`closed` |
| `SkillsService` | `ctx.skills` | 自动扫描、解析并提供技能注册；广播 `pi/skill-registered` |
| `PromptsService` | `ctx.prompts` | 提示词模板引擎与动态模板注册；广播 `pi/prompt-registered` |
| `ExtensionService` | `ctx.extensions` | 加载 Pi 扩展并桥接 `ExtensionAPI` 至 Cordis 事件与 7 大 TUI 槽位 |
| `PackageManagerService` | `ctx.packageManager` | 跨 `pi.dev`、npm、git 与本地来源的插件包安装管理；广播 `pi/package-progress` |
| `AgentService` | `ctx.agent` | 智能体多轮会话推理循环调度与生命周期映射 |

---

## 五、15 个内置插件与 3 大场景预设开发规范

### 1. 3 大核心场景预设 (Presets)
- **`default` (标准开发模式)**：**Default is Best**。全量激活安全守门、Git 检查点、规则自动注入、待办追踪、输出防爆、多智能体协同与人机问答。
- **`plan` (规划与审计模式)**：强制开启严格只读保护（`safety-gate: { readOnly: true }`），写操作强制拦截，待方案拆解审批后再行执行。
- **`ptc` (编程调用模式)**：通过 `@pi-cordis/plugin-code-mode` 动态生成强类型 TypeScript SDK，在独立 `worker_threads` 线程中单轮批量执行复合工具操作。

### 2. 新增原生 Cordis 插件规范
- 每个插件为一个独立的 npm workspace package；
- 遵循 Cordis v4.0.1 插件协议，使用 `export const inject = [...]` 显式声明依赖的服务；
- 插件贡献需注册为可逆副作用：
  ```typescript
  import type { Context } from "@deepseek-ai/cordis";

  export const name = "my-custom-plugin";
  export const inject = ["tools", "settings"];

  export function apply(ctx: Context, config: MyConfig = {}) {
    // 动态注册返回 Disposer 句柄
    const unregister = ctx.tools.registerCustomTool({ ... });
    ctx.effect(() => () => unregister());
  }
  export default { name, inject, apply };
  ```

---

## 六、防御性编程与防双轨制反模式

为了维护微内核的架构纯洁性，所有开发者与 AI 助手必须遵守以下**防御性编程准则**：

1. **严禁绕过微内核私自实例化核心类（Anti-Bypass Rule）**：
   - ❌ 严禁在业务逻辑中直接 `import { Agent } from "@earendil-works/pi-agent-core"` 并 `new Agent()`；
   - ✅ 必须通过 `ctx.agent` 或 `createPiContext()` 统一获取与驱动智能体。
2. **显式声明服务提供者键（`static provide`）与注入依赖（`inject`）**：
   - 所有继承 `Service` 的类必须显式声明 `static provide = 'keyName'`；
   - 访问 `ctx.<service>` 的插件必须显式声明 `export const inject = ['keyName']`。
3. **注册即副作用（Registrations are Effects）**：
   - 所有插件贡献必须通过 `ctx.effect()` 或 `ctx.on()` 注册，并返回标准的 `Disposer` 销毁函数，确保可逆卸载。
4. **跨平台兼容性防范**：
   - Windows 路径必须使用 `pathToFileURL(p).href` 进行 ESM 动态导入；
   - 软链接创建需在 Windows 非特权环境下安全降级为 Junction 或优雅捕获 `EPERM`；
   - POSIX 专属测试（如 Unix Domain Socket 绑定）必须标记 `describe.skipIf(process.platform === "win32")`。

---

## 七、质量门禁与测试指令

```bash
# 1. 运行 Cordis 微内核引导与全套原生插件/预设专属测试
npx vitest run packages/coding-agent/test/cordis-plugins-and-profiles.test.ts packages/coding-agent/test/cordis-bootstrap.test.ts packages/coding-agent/test/cordis-ten-plugins.test.ts

# 2. TypeScript 严格类型检查
pnpm run check

# 3. 启动交互式 TUI 实机体验
pnpm pi

# 4. 在 TUI 中切换预设
/profile plan
/profile ptc
```

---

## 八、架构决策记录 (ADR) 演进规范

任何重大的架构调整、抽象层变更或设计权衡，必须在 [`.agents/notes/`](.agents/notes/README.zh.md) 中记录为正式的 ADR 笔记：
- 采用路径编码命名规范：`{lifecycle}/{class}/yyyy-mm-dd-topic-title.md` 与 `.zh.md`；
- 遵循统一正文骨架：`## Problem`、`## Decision`、`## Alternatives considered`、`## Consequences`；
- 按照状态流转方法推进：提案落地推进至 `implemented/{class}/`，过时/被完全吸收的旧决策转移至 `archived/{class}/` 并永久冻结。

---

## 九、代码风格与 Git 提交规范

1. **ESM 原生模块化**：全仓使用 `"type": "module"`，导入语句使用显式 `.ts` 扩展名。
2. **严格类型约束**：`strict: true`，严禁无理由使用 `any`。
3. **阶段性提交与更新日志**：
   - 每次关键功能、测试修复或文档完善必须及时执行 `git commit`；
   - 在 [`CHANGELOG.md`](CHANGELOG.md) 中同步记录新增（Added）、变更（Changed）或修复（Fixed）。
