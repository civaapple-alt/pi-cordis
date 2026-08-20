# AuthService (`ctx.auth`)

[English](auth-service.md) | 中文

`AuthService` 是 Pi-Cordis 的安全凭据与 API Key 管理服务，负责安全读写存储在 `~/.picds/agent/auth.json` 中的各大模型供应商凭证，支持内存凭据覆盖、凭据存在性检测，并在凭据变更时向 Cordis 中央事件总线广播 `pi/auth-updated` 事件。

---

## 凭证存储与安全机制

- **存储路径**：`~/.picds/agent/auth.json`（与原生 `~/.pi/agent/auth.json` 物理隔离）；
- **格式规范**：JSON 键值对，Key 为 Provider 标识符（如 `"deepseek"`, `"openai"`, `"anthropic"`），Value 为包含 `apiKey` 与凭据类型的对象；
- **内存优先**：支持通过运行时传入内存凭据，优先于磁盘存储。

---

## API 接口参考

### 1. `ctx.auth.getApiKey(provider: string): Promise<string | undefined>`
异步获取指定 Provider 的有效 API Key。优先查找内存覆盖，其次读取磁盘 `auth.json`，最后读取对应的环境变量（如 `DEEPSEEK_API_KEY`）。
```typescript
const apiKey = await ctx.auth.getApiKey("deepseek");
```

### 2. `ctx.auth.setApiKey(provider: string, apiKey: string): Promise<void>`
设置并持久化指定 Provider 的 API Key 至 `auth.json`，自动触发 `pi/auth-updated` 事件。
```typescript
await ctx.auth.setApiKey("deepseek", "sk-xxx");
```

### 3. `ctx.auth.remove(provider: string): Promise<void>`
删除指定 Provider 的凭据记录，并广播 `pi/auth-updated` 事件。

### 4. `ctx.auth.has(provider: string): Promise<boolean>`
检查是否存在指定 Provider 的有效凭据（内存或磁盘中存在）。

### 5. `ctx.auth.list(): Promise<readonly CredentialInfo[]>`
列出所有已配置的 Provider 凭据元数据列表（包含 Provider ID 与认证类型）。

---

## 广播事件 (Events)

- **`pi/auth-updated`**：当凭据被添加、修改或删除时触发。
  - **Payload**: `{ provider?: string }`
  - **监听示例**：
    ```typescript
    ctx.on("pi/auth-updated", ({ provider }) => {
        console.log(`Provider [${provider}] 凭据已更新`);
    });
    ```

---

## 插件集成范例 (Plugin Example)

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "auth-preflight";
export const inject = ["auth"];

export function apply(ctx: Context) {
    // 检查必需的 Provider 凭据
    ctx.on("pi/session-start", async () => {
        const hasKey = await ctx.auth.has("deepseek");
        if (!hasKey) {
            console.warn("⚠️ 未检测到 DeepSeek API Key，请配置 .env 或执行 picds auth");
        }
    });
}
```
