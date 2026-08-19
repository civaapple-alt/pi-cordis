# Agent Note: Pi-Cordis 服务矩阵划分与扩展生态集成

Status: implemented

## Problem

Pi 拥有繁荣的扩展、技能、提示词模板和主题生态，广泛分发于 `https://pi.dev/packages` 插件市场、npm、git 仓库与本地文件系统中。在 Pi 的原生扩展体系中，扩展模块导出一个 `ExtensionFactory` 并接收包含 `registerTool`、`registerCommand`、`registerProvider` 以及生命周期钩子（`before_agent_start`, `session_start`, `tool_call` 等）的 `ExtensionAPI` 实例。

在向 Cordis 微内核重构的过程中，我们面临以下挑战：
1. 如何将内部全部子系统清晰解耦为高内聚、可复用的 Cordis 服务；
2. 如何在不要求作者重写现有 Pi 插件的前提下，提供完全向下兼容的扩展运行环境；
3. 如何将 Pi 扩展的生命周期调用与工具注册无缝桥接至 Cordis 的事件总线与服务容器。

## Decision

我们实现了十项核心 Cordis 服务矩阵与扩展桥接层：

1. **十项核心 Cordis 服务**：
   - **`SettingsService` (`ctx.settings`)**：管理全局 (`~/.pi/agent/settings.json`) 与项目级 (`.pi/settings.json`) 配置；
   - **`AuthService` (`ctx.auth`)**：管理 API Key、OAuth 令牌与凭据持久化；
   - **`AIService` (`ctx.ai`)**：封装 `ModelRuntime`，管理多提供商模型流式调用、思考推理参数与 Token 消耗统计；
   - **`ToolRegistryService` (`ctx.tools`)**：注册 7 大核心内置工具（`read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`）与动态扩展工具；
   - **`SessionService` (`ctx.session`)**：协调 SQLite 会话存储、多分支树切换、恢复与导出；
   - **`SkillsService` (`ctx.skills`)**：自动发现并加载提示词技能与目录技能；
   - **`PromptsService` (`ctx.prompts`)**：管理提示词模板与参数变量插值；
   - **`ExtensionService` (`ctx.extensions`)**：加载扩展脚本并驱动 `ExtensionRunner`；
   - **`PackageManagerService` (`ctx.packageManager`)**：实现跨 `pi.dev`、npm、git 与本地路径的 `install`、`remove`、`update`、`list` 管理；
   - **`AgentService` (`ctx.agent`)**：协调智能体推理循环与上下文装配。
2. **`pi.dev/packages` 插件生态兼容与事件桥接**：
   - `ExtensionService` 无感知地向扩展工厂传递标准 `ExtensionAPI`；
   - 扩展注册的工具（`api.registerTool`）自动路由至 `ctx.tools.registerCustomTool()`；
   - 扩展生命周期事件直接挂接至 Cordis 事件（`pi/session-start`, `pi/tool-call`, `pi/model-change` 等）。

## Alternatives considered

- **强制要求所有扩展必须重写为 Cordis 原生插件**：
  - *为什么不采用*：这会瞬间破坏 `pi.dev/packages` 市场的现有生态，给所有第三方开发者带来沉重迁移负担。通过在底层桥接 `ExtensionAPI`，既能使现有扩展开箱即用，又能支持新插件直接基于 Cordis `Context` 编写。
- **将包管理逻辑置于 Cordis 容器之外作为独立 CLI 脚本**：
  - *为什么不采用*：将包管理收敛为 `ctx.packageManager` 服务，使其他 Cordis 插件与不同 CLI 运行模式都能通过依赖注入编程式调用安装、更新与查询能力。

## Consequences

- **收益 (Benefits)**：
  - 完美兼容现有 `pi.dev/packages` 生态中的所有扩展与插件包；
  - 每个子系统均可作为独立的 Cordis 服务进行单独测试与观测；
  - 用户通过 `pi install npm:@foo/bar` 或 `pi install git:...` 安装插件的使用体验完全不受影响。
- **权衡 (Trade-offs)**：
  - 运行时需维护一层轻量的 `ExtensionAPI` 与 Cordis 事件转接层。
