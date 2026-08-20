# SettingsService (`ctx.settings`)

English | [中文](settings-service.zh.md)

`SettingsService` is the core configuration management service in Pi-Cordis. It wraps `@earendil-works/pi-coding-agent`'s `SettingsManager`, providing hierarchical settings merging (project over global), reactive updates, schema validation, and event emission over the Cordis EventBus (`pi/settings-updated`).

---

## File Locations & Scopes

Pi-Cordis utilizes an isolated user directory strategy:

| Scope | Path | Description |
|---|---|---|
| **Global Settings** | `~/.picds/agent/settings.json` | Applies across all projects and sessions |
| **Project Settings** | `<cwd>/.picds/settings.json` | Project-specific overrides (preferred) |
| **Project Fallback** | `<cwd>/.pi/settings.json` | Backward-compatible fallback if `.picds/` is absent |

---

## API Reference

### 1. `ctx.settings.get(): Settings`
Returns the global settings object.

### 2. `ctx.settings.getEffective(): Settings`
Returns the merged effective settings (project overrides taking precedence over global settings).

### 3. `ctx.settings.getSetting<K extends keyof Settings>(key: K): Settings[K]`
Reads the value of a specific setting key.
```typescript
const theme = ctx.settings.getSetting("theme"); // "dark" | "light"
const quiet = ctx.settings.getSetting("quietStartup"); // boolean
```

### 4. `ctx.settings.setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void`
Sets and persists a specific setting key, automatically emitting `pi/settings-updated`.

### 5. `ctx.settings.update(partialSettings: Partial<Settings>): void`
Applies a partial update to settings, persists changes, and emits `pi/settings-updated`.
```typescript
ctx.settings.update({
    theme: "dark",
    quietStartup: true,
    defaultThinkingLevel: "medium"
});
```

### 6. `ctx.settings.getCwd(): string`
Returns the current working directory absolute path.

### 7. `ctx.settings.getAgentDir(): string`
Returns the global agent data directory path (default `~/.picds/agent`).

### 8. `ctx.settings.drainErrors(): any[]`
Retrieves and flushes any warnings or errors recorded during configuration loading.

---

## Common Settings Keys

| Key | Type | Default | Description |
|---|---|---|---|
| `defaultProvider` | `string` | - | Default model provider (e.g., `"deepseek"`, `"anthropic"`, `"openai"`) |
| `defaultModel` | `string` | - | Default model ID (e.g., `"deepseek-chat"`, `"claude-3-7-sonnet"`) |
| `defaultThinkingLevel`| `string` | - | Thinking level: `"off"`, `"minimal"`, `"low"`, `"medium"`, `"high"`, `"max"` |
| `theme` | `string` | `"dark"` | TUI theme (`"dark"`, `"light"`, or custom theme name) |
| `quietStartup` | `boolean`| `false`| Hides the ASCII header and startup banner |
| `shellPath` | `string` | Auto | Shell interpreter path used by the `bash` tool |
| `thinkingBudgets` | `object` | - | Custom token budgets mapped per thinking level |

---

## Events Emitted

- **`pi/settings-updated`**: Emitted whenever settings are modified.
  - **Payload**: `{ settings: Settings, changedKeys: string[] }`
  - **Listener Example**:
    ```typescript
    ctx.on("pi/settings-updated", ({ settings, changedKeys }) => {
        if (changedKeys.includes("theme")) {
            console.log(`Theme changed to: ${settings.theme}`);
        }
    });
    ```

---

## Plugin Integration Example

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "theme-guard";
export const inject = ["settings"];

export function apply(ctx: Context) {
    const currentTheme = ctx.settings.getSetting("theme");

    ctx.on("pi/settings-updated", ({ settings, changedKeys }) => {
        if (changedKeys.includes("theme")) {
            // React to theme change
        }
    });
}
```
