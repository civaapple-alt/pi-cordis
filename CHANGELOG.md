# 更新日志 (Changelog)

本项目的全部重大架构变更与版本演进均记录于此。

## [0.1.0] - 2026-08-19

### 🌟 新增特性 (Added)

- **Cordis (v4.0.1) 微内核中枢体系**：
  - 完整集成 `vendor/` 下 vendored 的 Cordis 元框架内核（`@deepseek-ai/cordis`、`@deepseek-ai/cosmokit`、`@deepseek-ai/schemastery` 等）；
  - 实现强类型 `Context` 声明合并与生命周期事件映射（`pi/session-start`、`pi/session-before`、`pi/session-after`、`pi/tool-call`、`pi/tool-result`、`pi/model-change`、`pi/prompt-transform`）。
- **“Everything is a plugin” 服务解耦与重构**：
  - `SettingsService` (`ctx.settings`)：统一管理用户全局配置与项目本地配置，提供 Schema 校验与文件监听；
  - `AuthService` (`ctx.auth`)：统一管理 API 密钥、OAuth 令牌与凭证安全存储；
  - `AIService` (`ctx.ai`)：统一封装多模型运行时，内置 1307+ 个主流模型定义与流式推理；
  - `ToolRegistryService` (`ctx.tools`)：统一注册 7 大核心内置工具（`read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`）与动态扩展工具；
  - `SessionService` (`ctx.session`)：统一管理 SQLite 与内存会话存储、多分支树切换与会话导出；
  - `SkillsService` (`ctx.skills`)：自动发现与解析技能目录与提示词技能；
  - `PromptsService` (`ctx.prompts`)：管理提示词模板与参数变量插值；
  - `ExtensionService` (`ctx.extensions`)：加载 Pi 原生扩展，无缝桥接 `ExtensionAPI` 至 Cordis 事件总线；
  - `PackageManagerService` (`ctx.packageManager`)：支持从 `pi.dev/packages` 插件市场、npm、git 与本地目录安装与管理插件包；
  - `AgentService` (`ctx.agent`)：协调多轮智能体推理循环与上下文装配。
- **微内核应用引导器 (`createPiContext`)**：
  - 一键实例化 Cordis 微内核并挂载全部服务插件；
  - 完美兼容 Pi 的交互式 TUI、批处理打印模式、JSON 事件流模式与 RPC 模式。

### 🏗️ 架构与规范 (Architecture)

- **100% 保持 Pi 的功能与 TUI 体验**：终端渲染、分支树选择器、Diff 对比、Markdown 流式高亮、快捷键与 Slash Commands 纯正体验；
- **严格依赖隔离**：零依赖 `deepseek-harness` 专属插件，底层仅依赖 `vendor/` 内核；
- **完整生态支持**：全面支持 `https://pi.dev/packages` 原生插件生态；实机验证通过 `pnpm pi install npm:@juicesharp/rpiv-todo` 社区插件安装与交互式 TUI 完整运行（包括模型创建 Todo、`/todos` 快捷斜杠命令查看交互）；
- **架构决策记录 (Agent Notes)**：建立 `.agents/notes/` 目录规范，收录微内核架构设计与服务/插件生态集成中英文架构决策记录（ADR）；
- **开发与架构规范 (AGENTS.md)**：创建根目录 `AGENTS.md`，定义微内核设计哲学、服务矩阵、代码与 Git 提交规范。


