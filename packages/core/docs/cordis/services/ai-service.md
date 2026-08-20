# AIService (`ctx.ai`)

English | [中文](ai-service.zh.md)

`AIService` wraps the LLM runtime and provider management in Pi-Cordis. Powered by `@earendil-works/pi-ai`'s `ModelRuntime` (with built-in definitions for 1307+ models), it enables model discovery, live switching, and dynamic provider registration with reversible `Disposer` teardowns upon plugin unload.

---

## Core Capabilities

- **1307+ Models Supported**: Built-in support for DeepSeek, OpenAI, Anthropic, Gemini, Mistral, Groq, Ollama, OpenRouter, and more;
- **Dynamic Provider Registration**: Plugins can inject OpenAI-compatible endpoints or native provider adapters;
- **Reversible Disposer Pattern**: Registrations return disposers that are automatically cleaned up when the owning Fiber unloads;
- **Reactive Model Switching**: Emits `pi/model-change` on the Cordis EventBus when active models change.

---

## API Reference

### 1. `ctx.ai.getModels(): readonly Model<Api>[]`
Returns all loaded model definitions.

### 2. `ctx.ai.getAvailableModels(): readonly Model<Api>[]`
Returns all models with valid configured credentials that can be invoked immediately.

### 3. `ctx.ai.getModel(provider: string, modelId: string): Model<Api> | undefined`
Retrieves a specific model definition by provider and model ID.
```typescript
const model = ctx.ai.getModel("deepseek", "deepseek-chat");
```

### 4. `ctx.ai.switchModel(model: Model<Api>): void`
Switches the active model for the session and emits `pi/model-change`.

### 5. `ctx.ai.registerProvider(name: string, config: any): () => void`
Dynamically registers a custom OpenAI-compatible provider. Returns a disposer function.
```typescript
const unregister = ctx.ai.registerProvider("my-custom-llm", {
    baseUrl: "https://api.my-llm.com/v1",
    apiKey: "sk-xxx",
    models: [
        { id: "custom-coder-v1", name: "Custom Coder V1", reasoning: true }
    ]
});
// Call unregister() on teardown
```

### 6. `ctx.ai.registerNativeProvider(provider: Provider<any>): () => void`
Registers a native custom `Provider` instance. Returns a disposer function.

---

## Events Emitted

- **`pi/model-change`**: Emitted when the active model is switched.
  - **Payload**: `(model: Model<any>)`
- **`pi/provider-registered`**: Emitted when a new provider is registered.
  - **Payload**: `{ name: string, config?: any }`
- **`pi/provider-unregistered`**: Emitted when a provider is removed.
  - **Payload**: `(name: string)`

---

## Plugin Integration Example

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "local-ollama-provider";
export const inject = ["ai"];

export function apply(ctx: Context) {
    const unregister = ctx.ai.registerProvider("ollama-local", {
        baseUrl: "http://localhost:11434/v1",
        apiKey: "ollama",
        models: [
            { id: "qwen2.5-coder:32b", name: "Qwen 2.5 Coder 32B" }
        ]
    });

    ctx.effect(() => () => unregister());
}
```
