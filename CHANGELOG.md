# 更新日志 (Changelog)

本项目的全部重大架构变更与版本演进均记录于此。

---

## [0.3.0] - 2026-08-20

### 🌟 终端斜杠命令与插件工具原生桥接 (Native Slash Commands & Plugin Tool Bridge)

- **`ExtensionService` 双向命令与工具桥接中枢**：
  - **声明式命令注册**：实现 `ctx.extensions.registerCommand(name, definition)`，支持任意 Cordis 原生插件通过 TypeScript 声明终端斜杠命令，返回 Fiber 级可逆销毁句柄（Disposer），并自动广播 `pi/command-registered` 与 `pi/command-unregistered`；
  - **动态插件工具与搜索工具自动桥接**：`createBridgeExtensionFactory()` 自动将 `ctx.tools.getCustomTools()` 以及 `grep, find, ls` 搜索工具转换为标准 `ToolDefinition` 并调用 `pi.registerTool()`，监听 `pi/tool-registered` 与 `pi/tools-changed` 支持运行时动态热注册与卸载工具，确保大模型从 LLM API 视角完整感知 7 大内置工具 + 当前 Profile 所有激活插件的工具 Schema；
  - **Profile 热切换动态工具遮罩与同步**：在切换预设（如 `/profile ptc`）时，`applyProfile` 自动卸载前序预设插件 Fiber，并通过 `ExtensionService.syncActiveTools()` 调用 `pi.setActiveTools()` 动态更新生效工具列表（例如在 PTC 模式下自动遮罩底层 `read/write/edit/bash/grep/find/ls` 原始工具，仅向 LLM 暴露 `run_code` 与上层工具）；
  - **避免 CLI `--tools` 过滤副作用**：CLI 启动器保持 `tools` 白名单为 `undefined`，避免因 CLI 显式指定 `--tools` 而导致上游 `AgentSession` 严格过滤并屏蔽掉插件自定义扩展工具；
  - **双向事件反射与拦截**：自动将上游 `tool_call` 与 `tool_result` 反射回 Cordis 中央事件总线与拦截管道；
  - **消除终端噪音**：内联扩展工厂标记 `hidden: true`，彻底消除 TUI 启动横幅中冗余的 `<inline:N>` 视觉噪音。

### 🧩 纯正 Cordis 插件化与极简预设体系重构

- **`@pi-cordis/profiles` 纯正插件化**：
  - 显式声明 `inject = ["extensions", "settings"]`，通过 `ctx.extensions.registerCommand("profile", ...)` 注册交互式预设查询与即时热重载命令。
- **新建 `@pi-cordis/plugin-btw`（真实 LLM 旁路问答）**：
  - 独立插件工作区（`packages/plugins/btw`），显式声明 `inject = ["extensions", "ai"]`；
  - 注册 `/btw` 指令，调用 `ctx.ai.getRuntime().completeSimple(...)` 进行真实单轮 LLM 流式推理并在终端展示，**100% 物理隔离不污染 SQLite / JSONL 会话日志，零上下文 Token 浪费**；
  - 触发 `pi/btw-query` 与 `pi/btw-response` 响应式事件。
- **新建 `@pi-cordis/plugin-terminal-notifier`（原生桌面通知）**：
  - 独立插件工作区（`packages/plugins/terminal-notifier`），监听智能体交互等待与轮次完成，向 Warp / Ghostty / iTerm2 发射 `OSC 777` 桌面弹窗通知。
- **`@pi-cordis/plugin-ask-question` 终端真实交互式弹窗 (Interactive Terminal UI Select & Input)**：
  - 深度集成 Pi 原生终端交互上下文 `ctx.ui.select()` 与 `ctx.ui.input()`，工具调用时在终端呈现交互式多选列表与自定义输入框，阻塞等待用户键盘上下移动与回车确认，彻底告别单选伪造；非交互/CI 模式平滑自动回退。
- **“Default is Best” 3 大场景化预设**：
  - 废除 5 大内部排列组合，收敛为 3 大极简场景预设：
    1. `default`（标准开发模式，内置安全守门、Git 检查点、规则注入、待办追踪、输出防爆、多智能体协同、旁路问答与桌面通知）；
    2. `plan`（规划与审计模式，只读探索、步骤状态机与写操作强制拦截）；
    3. `ptc`（编程化调用模式，动态 TypeScript SDK 与 Worker 线程沙箱 1 轮极速批处理）。

---

## [0.2.0] - 2026-08-20

### 🌟 核心架构与上游解耦 (Decoupling & 4-Layer Architecture)

- **核心层 `@pi-cordis/core` 终极上游解耦与 4 层架构重构**：
  - 将主包更名为 **`@pi-cordis/core`**（目录 `packages/core`），直接通过 npm 消费官方 `@earendil-works/pi-coding-agent: ^0.84.2`、`@earendil-works/pi-ai`、`@earendil-works/pi-agent-core`、`@earendil-works/pi-tui`；
  - 彻底清空数百个本地克隆的冗余上游源码文件与测试用例，实现一条 `pnpm update` 即可无感升级上游能力；
  - 确立清晰严谨的 **4 层架构金字塔**：Level 1（通用 Agent 底座）➔ Level 2（Coding 场景特化）➔ Level 3（Cordis 微内核控制面）➔ Level 4（场景预设与原生插件）。
- **两阶段 CLI 启动装配器 (`picds` / `picordis`)**：
  - **阶段 1（Cordis 微内核预热）**：解析 `--profile`，启动 Cordis IOC 容器并装载 10 大核心服务、终端通知器（OSC 777）与 `/profile`、`/btw` 扩展工厂；
  - **阶段 2（上游主循环驱动）**：将 Cordis 扩展工厂通过 `extensionFactories` 传递给 `@earendil-works/pi-coding-agent` 的 `main(args, options)`，无缝驱动原生终端 TUI。
- **命令行与用户数据物理隔离**：
  - 注册 `picds`（首选 5 字符极简命令）与 `picordis`（全称），废除 `pi` 命令以防止与本地全局安装的原生 Pi 发生 PATH 抢占冲突；
  - 全局用户目录使用 `~/.picds/agent/`（`settings.json`, `auth.json`, `sessions/`, `presets/`），与原生 `~/.pi/` 物理隔离，杜绝数据破坏；
  - 项目配置优先读取 `<cwd>/.picds/`，不存在时自动向下兼容 `<cwd>/.pi/`。
- **10 大原生 Cordis 核心服务全面升级**：
  - `ctx.settings` (`SettingsService`)：响应式配置管理与 `pi/settings-updated` 事件；
  - `ctx.auth` (`AuthService`)：基于 `readStoredCredential` 的凭据读写与 `pi/auth-updated` 事件；
  - `ctx.ai` (`AIService`)：多模型运行时、动态 Provider 注册与 Disposer 销毁，`pi/model-change` 事件；
  - `ctx.tools` (`ToolRegistryService`)：工具注册、Code Mode 过滤器与 `executeTool` 拦截管道（`pi/tool-call`, `pi/tool-result`）；
  - `ctx.session` (`SessionService`)：会话树持久化与快速不落盘的内存会话（`inMemory`）；
  - `ctx.skills` (`SkillsService`)：Markdown 技能动态发现与注入；
  - `ctx.prompts` (`PromptsService`)：提示词模板动态加载与注册；
  - `ctx.extensions` (`ExtensionService`)：TypeScript 扩展扫描与运行时桥接；
  - `ctx.packageManager` (`PackageManagerService`)：扩展包安装/卸载与 `pi/package-progress` 进度广播；
  - `ctx.agent` (`AgentService`)：智能体推理循环调度与多轮事件映射。
- **轻量特性与原生终端能力吸收**：
  - **OSC 777 原生终端通知**：在智能体等待提问或轮次完成时，向 Warp / Ghostty / iTerm2 发送系统级原生通知；
  - **`/btw` 侧信道问答**：支持轻量级旁支提问，不污染主会话上下文与历史日志。

---

## [0.1.0] - 2026-08-19

### 🌟 新增特性 (Added)

- **Cordis (v4.0.1) 微内核中枢体系**：
  - 完整集成 `vendor/` 下 vendored 的 Cordis 元框架内核（`@deepseek-ai/cordis`、`@deepseek-ai/cosmokit`、`@deepseek-ai/schemastery` 等）；
  - 实现强类型 `Context` 声明合并与生命周期事件映射（`pi/session-start`、`pi/session-before`、`pi/session-after`、`pi/tool-call`、`pi/tool-result`、`pi/model-change`、`pi/prompt-transform`）。
- **“Everything is a plugin” 服务解耦与重构**：
  - 将 Settings, Auth, AI, Tools, Session, Skills, Prompts, Extensions, PackageManager, Agent 封装为 Cordis 服务。
- **原生 Cordis 插件体系与 Profile 预设机制**：
  - 建立独立的 `packages/plugins/*` 工作区，收录 4 大开箱即用的原生 Cordis 插件（`safety-gate`, `git-guard`, `todo-tracker`, `rules-injector`）；
  - 推出 `@pi-cordis/profiles` 组合装配中心，支持 `default`, `safe`, `strict`, `full`, `minimal` 常用预设模式；
  - 支持声明式 YAML 配置 (`cordis.yml` / `profiles.yml`) 与在 TUI 中通过 `/profile` 动态查看与切换；
  - 支持 Presets 预设与插件源码级 HMR（热重载）。

### 🏗️ 架构与规范 (Architecture)

- **100% 保持 Pi 的功能与 TUI 体验**：保留终端渲染、分支树选择器、Diff 对比、Markdown 流式高亮、快捷键与 Slash Commands 纯正体验；
- **严格依赖隔离**：零依赖 `deepseek-harness` 专属插件，底层仅依赖 `vendor/` 内核；
- **完整生态支持**：全面支持 `https://pi.dev/packages` 原生插件生态；
- **架构决策记录 (Agent Notes)**：建立 `.agents/notes/` 目录规范，收录架构与演进中英文 ADR 决策；
- **TUI 微内核状态呈现**：在全屏交互式 TUI 欢迎界面呈现 `[Cordis Microkernel]` 10 大核心服务与插件状态；
- **开发与架构规范 (AGENTS.md)**：创建根目录 `AGENTS.md`，定义微内核设计哲学、服务矩阵、代码与 Git 提交规范。
