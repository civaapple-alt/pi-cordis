# @pi-cordis/core 核心文档中心

[English](README.md) | 中文

欢迎来到 `@pi-cordis/core` 核心架构与技术文档中心。本工作区作为 Pi-Cordis 的微内核控制面，通过 npm 直接消费官方 `@earendil-works/pi-coding-agent: ^0.84.2`，将其底层能力封装为 10 大响应式 Cordis 核心服务，并提供零冲突的 `picds` 命令行入口。

---

## 📖 文档导航

### 1. 核心服务接口与契约 ([`cordis/services/`](cordis/services/README.zh.md))
- [SettingsService (`ctx.settings`)](cordis/services/settings-service.zh.md) — 全局与项目级配置管理、响应式更新与 `pi/settings-updated`
- [AuthService (`ctx.auth`)](cordis/services/auth-service.zh.md) — 安全凭证存储、API Key 管理与 `pi/auth-updated`
- [AIService (`ctx.ai`)](cordis/services/ai-service.zh.md) — 上游 Pi 多模型运行时、动态 Provider 注册与 `pi/model-change`
- [ToolRegistryService (`ctx.tools`)](cordis/services/tool-registry-service.zh.md) — 7 大内置工具、表现层工具遮蔽与 `executeTool` 拦截管道
- [SessionService (`ctx.session`)](cordis/services/session-service.zh.md) — SQLite 与内存会话存储、分支树管理与 `inMemory` 隔离会话
- [SkillsService (`ctx.skills`)](cordis/services/skills-service.zh.md) — Markdown 技能自动发现与动态可逆注册
- [PromptsService (`ctx.prompts`)](cordis/services/prompts-service.zh.md) — 提示词模板引擎、变量插值与动态注册
- [ExtensionService (`ctx.extensions`)](cordis/services/extension-service.zh.md) — Pi 扩展加载器、Cordis 事件桥接与 7 大 TUI 交互槽位
- [PackageManagerService (`ctx.packageManager`)](cordis/services/package-manager-service.zh.md) — 插件包安装/更新/卸载与实时进度广播
- [AgentService (`ctx.agent`)](cordis/services/agent-service.zh.md) — `AgentSession` 实例编排与多轮推理事件映射

### 2. 微内核与插件开发指南 ([`cordis/`](cordis/))
- [Cordis 微内核架构深度剖析](cordis/architecture.zh.md) — IoC 容器、Fiber 作用域、Disposer 模式与事件总线
- [原生 Cordis 插件开发教程](cordis/plugin-development.zh.md) — 编写 `@pi-cordis/plugin-*` 插件、显式 `inject` 依赖与可逆副作用
- [场景预设与 YAML 组合指南](cordis/profiles-and-presets.zh.md) — `default`/`ptc` 能力 Profile、独立 Plan 状态、`cordis.yml` 与双轨 HMR
