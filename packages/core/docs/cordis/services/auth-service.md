# AuthService (`ctx.auth`)

English | [中文](auth-service.zh.md)

`AuthService` is the credential and API key management seam in Pi-Cordis. It reads and writes model provider credentials stored in `~/.picds/agent/auth.json`, keeps successful writes in memory, and emits `pi/auth-updated` events on the Cordis EventBus.

---

## Credential Storage & Security

- **Storage Path**: `~/.picds/agent/auth.json` (isolated from native `~/.pi/agent/auth.json`);
- **Format**: JSON key-value pairs where the key is the provider identifier (e.g., `"deepseek"`, `"openai"`, `"anthropic"`) and the value contains `apiKey` and credential metadata;
- **Write safety**: mutations are serialized within the process, written through a temporary file, and atomically renamed;
- **Permissions**: newly written credential files use owner-only mode (`0600`) on platforms that enforce POSIX modes;
- **Failure semantics**: malformed JSON and persistence errors reject the operation instead of silently replacing or losing credentials;
- **In-Memory Precedence**: successfully written credentials are cached in memory and take precedence over disk files.

This service prevents torn writes and same-process lost updates. It is not a multi-process credential database; avoid running concurrent credential-mutating Picds processes against the same file.

---

## API Reference

### 1. `ctx.auth.getApiKey(provider: string): Promise<string | undefined>`
Retrieves the stored API key for a specified provider. It checks the successful in-memory write cache first, then `auth.json`. Environment-based provider resolution remains owned by the upstream Pi runtime.
```typescript
const apiKey = await ctx.auth.getApiKey("deepseek");
```

### 2. `ctx.auth.setApiKey(provider: string, apiKey: string): Promise<void>`
Sets and persists the API key for a provider to `auth.json`, automatically emitting `pi/auth-updated`.
```typescript
await ctx.auth.setApiKey("deepseek", "sk-xxx");
```

### 3. `ctx.auth.remove(provider: string): Promise<void>`
Deletes the credential record for a provider and emits `pi/auth-updated`.

### 4. `ctx.auth.has(provider: string): Promise<boolean>`
Checks if a valid credential exists for the given provider.

### 5. `ctx.auth.list(): Promise<readonly CredentialInfo[]>`
Lists all configured provider credential metadata.

---

## Events Emitted

- **`pi/auth-updated`**: Emitted whenever a credential is added, modified, or removed.
  - **Payload**: `{ provider?: string }`
  - **Listener Example**:
    ```typescript
    ctx.on("pi/auth-updated", ({ provider }) => {
        console.log(`Credential updated for provider: ${provider}`);
    });
    ```

---

## Plugin Integration Example

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "auth-preflight";
export const inject = ["auth"];

export function apply(ctx: Context) {
    ctx.on("pi/session-start", async () => {
        const hasKey = await ctx.auth.has("deepseek");
        if (!hasKey) {
            console.warn("⚠️ DeepSeek API Key not found. Please set DEEPSEEK_API_KEY in .env");
        }
    });
}
```
