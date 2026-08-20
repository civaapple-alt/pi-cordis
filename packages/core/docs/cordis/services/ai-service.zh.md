# AIService (`ctx.ai`)

[English](ai-service.md) | 中文

`AIService` 是 Pi-Cordis 的大模型运行时与供应商服务，封装了 `@earendil-works/pi-ai` 的 `ModelRuntime`（内置 1307+ 主流大模型定义），支持运行时模型检索与切换，并允许插件通过 `this.ctx.effect()` 动态注册自定义 OpenAI 兼容 Provider 或原生 Provider，在插件卸载时自动可逆销毁。

---

## 核心特性与架构

- **多供应商运行时**：内置支持 DeepSeek、OpenAI、Anthropic、Gemini、Mistral、Groq、Ollama、OpenRouter 等 1307+ 个大语言模型；
- **动态 Provider 注册**：支持通过代码或插件动态注入私有模型、代理端点或兼容服务；
- **副作用可逆（Disposer 模式）**：所有注册返回注销句柄，在 Fiber 卸载时原子回收；
- **响应式模型切换**：切换活跃模型时在 EventBus 广播 `pi/model-change`。

---

## API 接口参考

### 1. `ctx.ai.getModels(): readonly Model<Api>[]`
获取运行时已加载的所有模型定义列表。

### 2. `ctx.ai.getAvailableModels(): readonly Model<Api>[]`
获取当前已配置有效凭据、可直接调用的可用模型列表。

### 3. `ctx.ai.getModel(provider: string, modelId: string): Model<Api> | undefined`
根据供应商与模型 ID 查找特定模型对象。
```typescript
const model = ctx.ai.getModel("deepseek", "deepseek-chat");
```

### 4. `ctx.ai.switchModel(model: Model<Api>): void`
切换当前会话的活跃大模型，并在事件总线上广播 `pi/model-change`。

### 5. `ctx.ai.registerProvider(name: string, config: any): () => void`
动态注册自定义 OpenAI 兼容的 Provider。返回一个 Disposer 销毁函数。
```typescript
const unregister = ctx.ai.registerProvider("my-custom-llm", {
    baseUrl: "https://api.my-llm.com/v1",
    apiKey: "sk-xxx",
    models: [
        { id: "custom-coder-v1", name: "Custom Coder V1", reasoning: true }
    ]
});
// 卸载时执行 unregister()
```

### 6. `ctx.ai.registerNativeProvider(provider: Provider<any>): () => void`
动态注册原生 `Provider` 实例。返回 Disposer 销毁函数。

---

## 广播事件 (Events)

- **`pi/model-change`**：当活跃模型被切换时触发。
  - **Payload**: `(model: Model<any>)`
- **`pi/provider-registered`**：当新 Provider 被注册时触发。
  - **Payload**: `{ name: string, config?: any }`
- **`pi/provider-unregistered`**：当 Provider 被注销时触发。
  - **Payload**: `(name: string)`

---

## 插件集成范例 (Plugin Example)

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "local-ollama-provider";
export const inject = ["ai"];

export function apply(ctx: Context) {
    // 动态注册本地 Ollama 兼容端点，返回 Disposer
    const unregister = ctx.ai.registerProvider("ollama-local", {
        baseUrl: "http://localhost:11434/v1",
        apiKey: "ollama",
        models: [
            { id: "qwen2.5-coder:32b", name: "Qwen 2.5 Coder 32B" }
        ]
    });

    // 绑定至当前插件的生命周期
    ctx.effect(() => () => unregister());
}
```
