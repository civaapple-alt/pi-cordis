# ExtensionService (`ctx.extensions`)

English | [中文](extension-service.zh.md)

`ExtensionService` manages Pi extension bundles, loading extensions from paths and broadcasting `pi/extension-loaded` events.

## API Reference

### `ctx.extensions.load(options?): Promise<LoadExtensionsResult>`
Loads all configured extensions from local files or installed packages. Emits `pi/extension-loaded`.

### `ctx.extensions.getLoadedExtensions(): Extension[]`
Returns all currently loaded extension descriptors.

### `ctx.extensions.getLoadedTools(): ToolDefinition[]`
Returns all tools contributed by loaded extensions.

## Events Emitted

- `pi/extension-loaded`: `(result: LoadExtensionsResult)`
