# AuthService (`ctx.auth`)

English | [中文](auth-service.zh.md)

`AuthService` manages provider credentials and API keys stored in `auth.json`. It provides async credential accessors and emits `pi/auth-updated` events on modification.

## API Reference

### `ctx.auth.getApiKey(provider: string): Promise<string | undefined>`
Retrieves the API key string for a given provider (e.g. `'deepseek'`, `'openai'`).

### `ctx.auth.setApiKey(provider: string, apiKey: string): Promise<void>`
Sets and persists the API key for a provider, broadcasting `pi/auth-updated`.

### `ctx.auth.remove(provider: string): Promise<void>`
Deletes a provider's credential, broadcasting `pi/auth-updated`.

### `ctx.auth.has(provider: string): Promise<boolean>`
Checks if credentials exist for the specified provider.

### `ctx.auth.list(): Promise<readonly CredentialInfo[]>`
Lists all configured provider credential metadata.

## Events Emitted

- `pi/auth-updated`: `{ provider?: string }`
