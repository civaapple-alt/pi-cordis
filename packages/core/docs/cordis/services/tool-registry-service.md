# ToolRegistryService (`ctx.tools`)

English | [中文](tool-registry-service.zh.md)

`ToolRegistryService` manages the registry of built-in tools (`read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`) and dynamic custom tools registered by plugins. It features presentation masking filters and a hooked `executeTool` pipeline.

## API Reference

### `ctx.tools.registerCustomTool(tool: ToolDef): () => void`
Registers a custom tool. Returns a disposer function that unregisters the tool upon disposal. Emits `pi/tool-registered` and `pi/tool-unregistered`.

### `ctx.tools.addFilter(filterFn: (tool: ToolDef) => boolean): () => void`
Adds a presentation masking filter (e.g. for PTC / Code Mode). Disposing the registering plugin removes the filter automatically.

### `ctx.tools.getExportedToolDefinitions(cwd?: string): ToolDef[]`
Returns tool definitions visible to the LLM model after applying all active filters.

### `ctx.tools.executeTool(toolName: string, args: Record<string, unknown>, ...rest: any[]): Promise<any>`
Executes a tool through the lifecycle pipeline:
1. Calls pre-execution hook `pi/tool-call` via `ctx.serial`.
2. Executes the tool implementation.
3. Calls post-execution hook `pi/tool-result` via `ctx.parallel`.
4. Returns the result.

## Events Emitted

- `pi/tool-registered`: `(tool: ToolDef)`
- `pi/tool-unregistered`: `(name: string)`
- `pi/tool-call`: `{ toolName?: string, name?: string, args: Record<string, unknown> }`
- `pi/tool-result`: `{ toolName?: string, name?: string, args?: Record<string, unknown>, result: unknown }`
