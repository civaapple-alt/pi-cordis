# ToolRegistryService (`ctx.tools`)

English | [中文](tool-registry-service.zh.md)

`ToolRegistryService` manages tool registration, presentation filtering (masking), and pipeline interception in Pi-Cordis. It manages the 7 built-in coding tools (`read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`) and dynamic tools contributed by plugins, supports predicate-based **presentation tool masking**, and provides the hooked `executeTool` execution pipeline.

---

## Core Mechanisms

1. **Unified Tool Registry**: Aggregates built-in tools with dynamic tools registered by plugins. Same-name registrations use stack semantics, so disposing the newest registration restores the previous live definition;
2. **Presentation Tool Masking**:
   - Allows plugins (such as `@pi-cordis/plugin-code-mode` or `@pi-cordis/plugin-plan-mode`) to hide specific tools dynamically via `ctx.tools.addFilter()`, ensuring the model only perceives the tools relevant to the active mode;
3. **Hooked Execution Pipeline (`executeTool`)**:
   - Pre-execution: Emits `pi/tool-call` for security inspection plugins (e.g. `@pi-cordis/plugin-safety-gate`) to block destructive actions;
   - Post-execution: Runs a serial mutable `pi/tool-result` transformation chain. The final `event.result` is returned to Pi.

---

## API Reference

### 1. `ctx.tools.registerCustomTool(tool: ToolDef): () => void`
Registers a custom tool definition. Returns a disposer function that unregisters the tool upon teardown.
```typescript
const unregister = ctx.tools.registerCustomTool({
    name: "db_query",
    description: "Executes a read-only database query",
    parameters: {
        type: "object",
        properties: {
            sql: { type: "string", description: "SQL query string" }
        },
        required: ["sql"]
    },
    execute: async (args) => {
        return await runSql(args.sql);
    }
});
```

### 2. `ctx.tools.addFilter(filterFn: (tool: ToolDef) => boolean): () => void`
Registers a tool visibility filter. Returns a disposer function.
```typescript
// Example: Mask write tools in read-only mode
const removeFilter = ctx.tools.addFilter((tool) => {
    return !["write", "edit"].includes(tool.name);
});
```

### 3. `ctx.tools.getExportedToolDefinitions(cwd?: string): ToolDef[]`
Returns the list of tool definitions exported to the LLM after applying all active filters.

### 4. `ctx.tools.get(name: string, cwd?: string): ToolDef | undefined`
Retrieves a specific tool definition by name.

### 5. `ctx.tools.executeTool(toolName: string, args: Record<string, unknown>, ...rest: any[]): Promise<any>`
Executes a tool through the full lifecycle pipeline:
1. Emits `pi/tool-call` serial pre-check (execution aborts if an error is thrown);
2. Invokes the underlying `execute(args, ...)` function;
3. Emits a mutable `pi/tool-result` post-process event;
4. Returns the possibly transformed `event.result`.

---

## Events Emitted

- **`pi/tool-registered`**: `(tool: ToolDef)`
- **`pi/tool-unregistered`**: `(name: string)`
- **`pi/tool-call`**: `{ toolName: string, args: Record<string, unknown> }`
- **`pi/tool-result`**: `{ toolName: string, args: Record<string, unknown>, result: unknown }`

---

## Plugin Integration Example

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "audit-logger";
export const inject = ["tools"];

export function apply(ctx: Context) {
    ctx.on("pi/tool-call", ({ toolName, args }) => {
        console.log(`[AUDIT] About to invoke: ${toolName}`, args);
    });

    ctx.on("pi/tool-result", ({ toolName, result }) => {
        console.log(`[AUDIT] Tool ${toolName} finished execution`);
    });
}
```
