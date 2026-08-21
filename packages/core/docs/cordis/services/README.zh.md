# Cordis 核心服务架构与文档中心

[English](README.md) | 中文

本指南提供 Pi-Cordis 中 10 大原生 Cordis 核心服务的架构规范、API 契约与使用指南。

---

## 运行时基础

核心服务直接导入官方 npm 包：`@deepseek-ai/cordis@^4.0.1`、`@deepseek-ai/cosmokit@^1.8.2` 与 `@deepseek-ai/schemastery@^3.18.1`。仓库不保留本地框架源码副本，测试与生产运行时解析同一组公开包。

---

## 设计视角

Pi-Cordis 借鉴 DSH 的以下架构视角，但不依赖其应用运行时：
- **能力接缝 (Capability Seams)**：通过 `ctx.<service>` 暴露强类型的服务定义；
- **可逆销毁 (Reversibility)**：Pi-Cordis 自己拥有的注册在上游允许注销时返回 Fiber 作用域 Disposer；
- **响应式总线 (Reactive Bus)**：在中央 Cordis 事件总线上广播细粒度的类型化事件；
- **拦截管道 (Interceptors)**：支持前置校验、耗时统计与后置处理；
- **作用域组合 (Scoped Composition)**：插件挂载在 Cordis Fiber 中，Profile 保存并销毁精确挂载句柄。

这些是生命周期与组合性质，不是进程安全边界。各服务页面会明确它影响交互式 Pi 运行时，还是仅提供 SDK 侧 Cordis 目录。

---

## 核心服务索引

- [SettingsService (`ctx.settings`)](./settings-service.zh.md) - 配置管理与响应式更新。
- [AuthService (`ctx.auth`)](./auth-service.zh.md) - 凭证存储与 API Key 存取。
- [AIService (`ctx.ai`)](./ai-service.zh.md) - 模型运行时与动态 Provider 注册。
- [ToolRegistryService (`ctx.tools`)](./tool-registry-service.zh.md) - 工具注册、模型屏蔽与执行管道。
- [SessionService (`ctx.session`)](./session-service.zh.md) - 会话工厂、持久化与活跃池追踪。
- [SkillsService (`ctx.skills`)](./skills-service.zh.md) - 技能发现与动态注册。
- [PromptsService (`ctx.prompts`)](./prompts-service.zh.md) - 提示词模板发现与动态注册。
- [ExtensionService (`ctx.extensions`)](./extension-service.zh.md) - Cordis 到 Pi 的窄运行时桥。
- [PackageManagerService (`ctx.packageManager`)](./package-manager-service.zh.md) - 扩展包安装生命周期与进度广播。
- [AgentService (`ctx.agent`)](./agent-service.zh.md) - SDK 侧 AgentSession 所有权与事件映射。
