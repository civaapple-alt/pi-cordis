# ToolRegistryService (`ctx.tools`)

[English](tool-registry-service.md) | 中文

`ToolRegistryService` 管理智能体的内置工具（`read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`）以及插件注册的自定义工具。支持大模型侧工具屏蔽过滤机制与具备前/后置拦截钩子的 `executeTool` 执行管道。

## API 接口

### `ctx.tools.registerCustomTool(tool: ToolDef): () => void`
注册自定义工具。返回注销句柄并在卸载时自动注销，广播 `pi/tool-registered` 与 `pi/tool-unregistered`。

### `ctx.tools.addFilter(filterFn: (tool: ToolDef) => boolean): () => void`
注册工具展示过滤器（例如 PTC / Code Mode 模式下的底层工具屏蔽）。插件卸载时自动移除过滤。

### `ctx.tools.getExportedToolDefinitions(cwd?: string): ToolDef[]`
获取经过当前所有过滤器过滤后、真正导出给大模型的工具定义清单。

### `ctx.tools.executeTool(toolName: string, args: Record<string, unknown>, ...rest: any[]): Promise<any>`
通过完整的生命周期管道执行工具：
1. 触发 `pi/tool-call` 串行前置校验拦截；
2. 执行底层工具逻辑；
3. 触发 `pi/tool-result` 并行后置处理拦截；
4. 返回执行结果。

## 触发事件

- `pi/tool-registered`：`(tool: ToolDef)`
- `pi/tool-unregistered`：`(name: string)`
- `pi/tool-call`：`{ toolName?: string, name?: string, args: Record<string, unknown> }`
- `pi/tool-result`：`{ toolName?: string, name?: string, args?: Record<string, unknown>, result: unknown }`
