# 更新日志 (Changelog)

本项目的全部重大架构变更与版本演进均记录于此。

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
