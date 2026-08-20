# SettingsService (`ctx.settings`)

[English](settings-service.md) | 中文

`SettingsService` 负责智能体运行时的全局与项目级配置管理。支持响应式更新、键级存取，并在配置发生变更时向 Cordis 事件总线广播 `pi/settings-updated` 事件。

## API 接口

### `ctx.settings.get(): Settings`
获取全局配置对象。

### `ctx.settings.getEffective(): Settings`
获取合并后的生效配置（全局配置 + 项目级覆盖）。

### `ctx.settings.getSetting<K>(key: K): Settings[K]`
读取指定配置项的值。

### `ctx.settings.setSetting<K>(key: K, value: Settings[K]): void`
设置并持久化指定配置项，自动广播 `pi/settings-updated`。

### `ctx.settings.update(partialSettings: Partial<Settings>): void`
应用部分配置更新，持久化变更并广播 `pi/settings-updated`。

## 触发事件

- `pi/settings-updated`：`{ settings: Settings, changedKeys: string[] }`
