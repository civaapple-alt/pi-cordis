# AIService (`ctx.ai`)

[English](ai-service.md) | 中文

`AIService` 持有一个供 Cordis 侧模型请求（如 `/btw`）使用的 Pi `ModelRuntime`。它直接消费 Pi 已安装的模型目录与凭据格式，Pi-Cordis 不复制 Provider Catalog。

- `getModels()`、`getAvailableModels()`、`getModel()` 查询该 Runtime；
- `switchModel()` 返回 `Promise<boolean>`。交互 CLI 中由 Extension Bridge 委托 Pi `setModel()`，并把 `model_select` 同步回 `ctx.ai.activeModel`；仅 SDK 使用时则更新 Cordis 侧选择；
- `registerProvider()` 与 `registerNativeProvider()` 使用可逆注册栈。活跃注册会同步到交互式 Pi Extension API，销毁后恢复仍存在的前一注册；
- `getRegisteredProviders()` 为 Bridge 重放提供当前动态注册。

事件：`pi/model-change`、`pi/provider-registered`、`pi/provider-unregistered`。

Cordis 侧 `ModelRuntime` 与 Pi 交互会话仍是两个独立运行时对象。Bridge 同步模型选择和动态 Provider 注册，但不替代 Pi Agent Loop。
