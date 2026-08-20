# AuthService (`ctx.auth`)

[English](auth-service.md) | 中文

`AuthService` 负责管理存储在 `auth.json` 中的各模型供应商凭据与 API Key。支持异步凭据存取并在修改时广播 `pi/auth-updated` 事件。

## API 接口

### `ctx.auth.getApiKey(provider: string): Promise<string | undefined>`
获取指定 Provider 的 API Key 字符串（例如 `'deepseek'`, `'openai'`）。

### `ctx.auth.setApiKey(provider: string, apiKey: string): Promise<void>`
设置并持久化指定 Provider 的 API Key，自动广播 `pi/auth-updated`。

### `ctx.auth.remove(provider: string): Promise<void>`
删除指定 Provider 的凭据，广播 `pi/auth-updated`。

### `ctx.auth.has(provider: string): Promise<boolean>`
检查是否存在指定 Provider 的有效凭据。

### `ctx.auth.list(): Promise<readonly CredentialInfo[]>`
列出所有已配置的 Provider 凭据元数据。

## 触发事件

- `pi/auth-updated`：`{ provider?: string }`
