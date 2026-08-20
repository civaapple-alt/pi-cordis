# SettingsService (`ctx.settings`)

English | [中文](settings-service.zh.md)

`SettingsService` manages global and project-specific settings for the agent runtime. It supports reactive updates, key-level accessors, and emits `pi/settings-updated` events.

## API Reference

### `ctx.settings.get(): Settings`
Returns the global settings object.

### `ctx.settings.getEffective(): Settings`
Returns the merged effective settings (global + project overrides).

### `ctx.settings.getSetting<K>(key: K): Settings[K]`
Gets the value of a specific setting key.

### `ctx.settings.setSetting<K>(key: K, value: Settings[K]): void`
Sets and persists a specific setting key, broadcasting `pi/settings-updated`.

### `ctx.settings.update(partialSettings: Partial<Settings>): void`
Applies a partial settings update, persists changes, and emits `pi/settings-updated`.

## Events Emitted

- `pi/settings-updated`: `{ settings: Settings, changedKeys: string[] }`
