# AIService (`ctx.ai`)

[English](ai-service.md) | 中文

`AIService` 封装大模型运行时，管理当前可用的大模型列表，并允许插件通过 `this.ctx.effect()` 动态注册自定义或原生 Provider（插件卸载时自动注销）。

## API 接口

### `ctx.ai.getModels(): readonly Model<Api>[]`
返回所有已加载的大语言模型。

### `ctx.ai.getModel(provider: string, modelId: string): Model<Api> | undefined`
通过 Provider 与 Model ID 检索特定模型。

### `ctx.ai.switchModel(model: Model<Api>): void`
切换当前活跃模型并广播 `pi/model-change` 事件。

### `ctx.ai.registerProvider(name: string, config: CustomProviderConfig): () => void`
动态注册自定义 OpenAI 兼容 Provider。返回注销句柄，在 Fiber 卸载时自动注销。

### `ctx.ai.registerNativeProvider(provider: Provider<any>): () => void`
动态注册原生 Provider。返回注销句柄。

## 触发事件

- `pi/model-change`：`(model: Model<any>)`
- `pi/provider-registered`：`{ name: string, config?: CustomProviderConfig }`
- `pi/provider-unregistered`：`(name: string)`
