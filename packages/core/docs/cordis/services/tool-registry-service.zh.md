# ToolRegistryService (`ctx.tools`)

[English](tool-registry-service.md) | 中文

`ToolRegistryService` 是 Pi-Cordis 的核心工具注册、管理与执行拦截服务。它管理 7 大内置编码工具（`read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`）以及各插件注册的自定义工具，支持基于谓词的**工具动态遮蔽过滤（Presentation Masking）**，并通过带有生命周期拦截钩子的 `executeTool` 管道执行工具。

---

## 核心机制

1. **统一工具注册池**：聚合原生内置工具与第三方插件贡献的动态工具；同名注册采用栈语义，销毁最新注册后会恢复仍然存活的前一项；
   - 工具可声明 `sideEffect: "none" | "workspace" | "external"`，也可根据参数动态推导。策略插件优先使用该语义元数据，再回退到名称启发式；
2. **表现层工具遮蔽 (Tool Masking)**：
   - 允许插件（如 `@pi-cordis/plugin-code-mode` 或 `@pi-cordis/plugin-plan-mode`）通过 `ctx.tools.addFilter()` 动态隐藏特定工具，使大模型仅能感知并调用符合当前场景的受控工具集；
3. **带拦截钩子的执行管道 (Execution Pipeline)**：
   - 工具执行前：触发 `pi/tool-call` 串行前置事件，支持 Safety Gate、Plan 等策略插件阻断不允许的操作；Pi 提供执行上下文时会携带 session ID 与 `hasUI`，使策略按会话隔离、感知交互能力，并覆盖 PTC 嵌套调用；
   - 工具执行后：执行可变的 `pi/tool-result` 串行变换链；最终 `event.result` 会真实返回给 Pi。

---

## API 接口参考

### 1. `ctx.tools.registerCustomTool(tool: ToolDef): () => void`
注册自定义工具定义。返回 Disposer 销毁函数并在卸载时自动注销。
```typescript
const unregister = ctx.tools.registerCustomTool({
    name: "db_query",
    description: "执行只读数据库查询",
    sideEffect: "none",
    parameters: {
        type: "object",
        properties: {
            sql: { type: "string", description: "SQL 查询语句" }
        },
        required: ["sql"]
    },
    execute: async (args) => {
        return await runSql(args.sql);
    }
});
```

### 2. `ctx.tools.addFilter(filterFn: (tool: ToolDef) => boolean): () => void`
注册工具可见性过滤器。返回 Disposer 销毁函数。
```typescript
// 示例：在只读模式下隐藏所有写工具
const removeFilter = ctx.tools.addFilter((tool) => {
    return !["write", "edit"].includes(tool.name);
});
```

### 3. `ctx.tools.getExportedToolDefinitions(cwd?: string): ToolDef[]`
获取经过当前所有活跃过滤器过滤后、真正暴露给大模型的工具定义清单。

### 4. `ctx.tools.get(name: string, cwd?: string): ToolDef | undefined`
根据名称检索指定工具定义。

### 5. `ctx.tools.executeTool(toolName: string, args: Record<string, unknown>, ...rest: any[]): Promise<any>`
通过完整的生命周期管道执行工具：
1. 触发 `pi/tool-call` 串行事件（若监听器抛出异常或拦截，执行中断）；
2. 执行底层工具的 `execute(args, ...)` 逻辑；
3. 触发可变的 `pi/tool-result` 后置事件；
4. 返回可能已被变换的 `event.result`。

---

## 广播事件 (Events)

- **`pi/tool-registered`**：当新工具被注册时触发 `(tool: ToolDef)`；
- **`pi/tool-unregistered`**：当工具被注销时触发 `(name: string)`；
- **`pi/tool-call`**：工具执行前触发 `{ toolName: string, args: Record<string, unknown>, sessionId?: string, hasUI?: boolean }`；
- **`pi/tool-result`**：工具执行完成后触发 `{ toolName: string, args: Record<string, unknown>, result: unknown }`。

---

## 插件集成范例 (Plugin Example)

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "audit-logger";
export const inject = ["tools"];

export function apply(ctx: Context) {
    // 监听工具执行并记录审计日志
    ctx.on("pi/tool-call", ({ toolName, args }) => {
        console.log(`[AUDIT] 准备调用工具: ${toolName}`, args);
    });

    ctx.on("pi/tool-result", ({ toolName, result }) => {
        console.log(`[AUDIT] 工具 ${toolName} 执行完毕`);
    });
}
```
