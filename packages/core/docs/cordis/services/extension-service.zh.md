# ExtensionService (`ctx.extensions`)

[English](extension-service.md) | 中文

`ExtensionService` 负责 Pi 扩展包的加载与运行时生命周期管理，从路径加载扩展并广播 `pi/extension-loaded` 事件。

## API 接口

### `ctx.extensions.load(options?): Promise<LoadExtensionsResult>`
从本地路径或已安装包中加载所有配置的扩展。广播 `pi/extension-loaded`。

### `ctx.extensions.getLoadedExtensions(): Extension[]`
返回当前所有已加载的扩展描述符。

### `ctx.extensions.getLoadedTools(): ToolDefinition[]`
返回由当前已加载扩展所贡献的所有工具。

## 触发事件

- `pi/extension-loaded`：`(result: LoadExtensionsResult)`
