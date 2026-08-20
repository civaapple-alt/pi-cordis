# AIService (`ctx.ai`)

English | [中文](ai-service.zh.md)

`AIService` wraps the AI model runtime, manages available LLM models, and enables plugins to dynamically register custom or native providers with automatic `this.ctx.effect()` lifecycle teardown.

## API Reference

### `ctx.ai.getModels(): readonly Model<Api>[]`
Returns all loaded AI models.

### `ctx.ai.getModel(provider: string, modelId: string): Model<Api> | undefined`
Retrieves a specific model by provider and model identifier.

### `ctx.ai.switchModel(model: Model<Api>): void`
Switches the active model and emits `pi/model-change`.

### `ctx.ai.registerProvider(name: string, config: any): () => void`
Registers a custom OpenAI-compatible provider. Returns a disposer function that unregisters the provider upon disposal.

### `ctx.ai.registerNativeProvider(provider: Provider<any>): () => void`
Registers a native custom provider. Returns a disposer function.

## Events Emitted

- `pi/model-change`: `(model: Model<any>)`
- `pi/provider-registered`: `{ name: string, config?: any }`
- `pi/provider-unregistered`: `(name: string)`
