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
- **原生 Cordis 插件体系与 Profile 预设机制**：
  - 建立独立的 `packages/plugins/*` 工作区，收录 4 大开箱即用的原生 Cordis 插件：
    - `@pi-cordis/plugin-safety-gate`：高危破坏性命令与受保护敏感文件拦截器；
    - `@pi-cordis/plugin-git-guard`：Git 工作区脏状态提示与关键会话轮次自动 Checkpoint 保护；
    - `@pi-cordis/plugin-todo-tracker`：注册 `todo_write`/`todo_read` 待办工具并自动将活跃任务注入提示词；
    - `@pi-cordis/plugin-rules-injector`：自动扫描项目规则文件（`AGENTS.md`, `.claude/rules/*.md`, `.cursorrules`）并注入系统提示词。
  - 推出 `@pi-cordis/profiles` 组合装配中心，支持 `default`, `safe`, `strict`, `full`, `minimal` 5 大常用预设模式，支持在 CLI 与代码中一键切换；
  - **支持声明式 YAML 配置 (`cordis.yml` / `profiles.yml`)**：自动级联加载项目级与用户全局级的 YAML 文件，用户可自由添加自定义 Profile 与调整插件参数；
  - **支持在 TUI 中通过 `/profile` 斜杠命令动态查看与切换当前 Profile 预设**，支持 Tab 键自动补全与无参数时的交互式下拉选择菜单；
  - **支持 Presets 预设与插件源码级 HMR（热重载）**：核心 10 大 Service 保持高速编程式加载，上层 `presets/` 与 `packages/plugins/*` 插件支持实时文件监听与免重启热重载。

### 🏗️ 架构与规范 (Architecture)

- **100% 保持 Pi 的功能与 TUI 体验**：终端渲染、分支树选择器、Diff 对比、Markdown 流式高亮、快捷键与 Slash Commands 纯正体验；
- **严格依赖隔离**：零依赖 `deepseek-harness` 专属插件，底层仅依赖 `vendor/` 内核；
- **完整生态支持**：全面支持 `https://pi.dev/packages` 原生插件生态；实机验证通过 `pnpm pi install npm:@juicesharp/rpiv-todo` 社区插件安装与交互式 TUI 完整运行（包括模型创建 Todo、`/todos` 快捷斜杠命令查看交互）；
- **架构决策记录 (Agent Notes)**：建立 `.agents/notes/` 目录规范，收录微内核架构设计、服务矩阵与插件生态集成、TUI 权衡与控制面重构深度分析、仓库精简与依赖解耦、Pi AgentHarness 工业级事务规格融合、双轨分层 HMR 架构设计、能力 Seams 与显式依赖注入（inject）、注册即副作用与副作用必可逆（Disposer 模式）、原生插件生态全景规划（P0-P3 演进矩阵）、编程化工具调用（PTC / Code Mode）提案，以及极简设计哲学与 “Default is Best” 预设体系重构提案等中英文架构决策记录（ADR）；
- **仓库架构重大精简**：移除 1200+ 未修改的克隆源码文件，转为直接消费官方 `@earendil-works/pi-*` 依赖，仓库体积缩减 85%+，开发安装仅需 1.8 秒，自动跟进上游升级；
- **TUI 微内核状态呈现**：在全屏交互式 TUI 欢迎界面优雅呈现 `[Cordis Microkernel]` 10 大核心服务与插件状态，兼顾终端纯净度与系统可观测性；
- **开发与架构规范 (AGENTS.md)**：创建根目录 `AGENTS.md`，定义微内核设计哲学、服务矩阵、代码与 Git 提交规范。


