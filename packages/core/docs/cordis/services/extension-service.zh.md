# ExtensionService (`ctx.extensions`)

[English](extension-service.md) | 中文

`ExtensionService` 是 Pi-Cordis 的扩展加载与双向命令/工具/UI 桥接中枢。它负责从本地路径或已安装的 npm/git 包中加载 TypeScript 扩展，并将 Cordis 插件注册的斜杠命令（Slash Commands）以及插件自定义工具（Plugin Tools）双向桥接至 Pi 原生的 `ExtensionAPI` 与 7 大 TUI 交互槽位，同时广播 `pi/extension-loaded`、`pi/command-registered`、`pi/tools-changed` 等核心生命周期事件。

---

## 核心职责与架构

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ExtensionService 统一双向桥接中心                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Cordis 插件层 (@pi-cordis/profiles, @pi-cordis/plugin-ask-question 等)       │
│         │                                                                   │
│         ├─► ctx.extensions.registerCommand("profile", ...)                  │
│         └─► ctx.tools.register({ name: "ask_question", execute(...) })      │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │     ExtensionService 注册表 (commands Map + Tool Adapter + Disposer)  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼ createBridgeExtensionFactory()                                    │
│  上游 TUI 主循环 (pi.registerCommand / pi.registerTool / pi.setActiveTools) │
│         │                                                                   │
│         ▼ 终端交互上下文透传 (ExtensionContext.ui)                           │
│  [cmdCtx.ui / execContext.ctx.ui] ──► select() / input() / confirm() / notify()│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7 大 TUI 交互槽位与 UI 交互机制

`ExtensionService` 允许扩展与插件通过统一接口驱动终端 UI 交互：

1. **Select 交互选择** (`ui.select`)：在全屏终端中弹出带键盘上下导航、回车确认、Esc 取消的下拉单选/多选菜单；
2. **Input 文本输入** (`ui.input`)：弹出单行交互式文本输入框，支持占位符提示与自定义答案录入；
3. **Confirm 确认弹窗** (`ui.confirm`)：高危操作执行前向用户发起 `[Y/n]` 阻塞式确认；
4. **Toast 轻量提示** (`ui.notify`)：在终端右下角弹出渐变式通知（`info` / `warning` / `error`）；
5. **Header / Footer 状态条** (`ui.setHeader` / `ui.setFooter`)：在终端顶部或底部动态渲染自定义状态信息与指标；
6. **自定义工具渲染器 (Custom Tool Renderer)** (`renderCall` / `renderResult`)：为工具执行过程定制 ANSI/字符图表渲染；
7. **消息折叠渲染器 (Message Renderer)**：折叠长文本输出或渲染多媒体卡片。

---

## 插件 UI 交互接入最佳实践

### 1. 斜杠命令中的 UI 交互 (`cmdCtx.ui`)
当用户在终端输入斜杠命令（如 `/profile`、`/btw`）时，`handler` 的第 2 个参数为 `cmdCtx`：
```typescript
ctx.extensions.registerCommand("my_command", {
    description: "示例命令",
    handler: async (args, cmdCtx) => {
        if (cmdCtx.hasUI && cmdCtx.ui) {
            const chosen = await cmdCtx.ui.select("请选择操作模式", ["模式 A", "模式 B"]);
            cmdCtx.ui.notify(`已切换至: ${chosen}`, "info");
        }
    },
});
```

### 2. 工具执行中的 UI 交互 (`execContext.ctx.ui`)
当大模型发起 `tool_call`（如 `ask_question`、`safety-gate` 危险确认）时，`tool.execute` 的第 2 个参数为 `execContext`，其中封装了 Pi 原生 `ExtensionContext`：
```typescript
ctx.tools.register({
    name: "my_tool",
    description: "需要与用户交互的工具",
    parameters: { type: "object", properties: { prompt: { type: "string" } } },
    execute: async (args, execContext) => {
        const ui = execContext?.ctx?.ui;
        const hasUI = Boolean(execContext?.ctx?.hasUI && ui?.select);

        if (hasUI) {
            // 真实终端交互：阻塞等待用户键盘选择
            const selected = await ui.select(args.prompt, ["选项 1", "选项 2"]);
            return { selected };
        } else {
            // CI / Headless / 测试环境自动回退
            return { selected: "选项 1" };
        }
    },
});
```

> ⚠️ **关键注意**：
> 1. **避免在 Cordis `ctx` 上直接访问 `ctx.ui`**：Cordis 上下文代理会因未声明 `inject = ["ui"]` 抛出拦截异常，必须统一从 `cmdCtx.ui`（命令）或 `execContext.ctx.ui`（工具）中获取；
> 2. **必须实现非交互回退**：所有涉及 UI 交互的工具必须判断 `hasUI`，在无 UI 环境下平滑回退，防止测试或批处理挂起。

---

## API 接口参考

### 1. `ctx.extensions.registerCommand(name: string, definition: ExtensionCommandDefinition): () => void`
供任意 Cordis 插件通过 Cordis Fiber 声明式注册终端斜杠命令。返回可逆的 `Disposer` 函数，在插件卸载时自动注销命令。

### 2. `ctx.extensions.syncActiveTools(): void`
根据当前生效的工具过滤器（如 PTC `code-mode` 遮罩），将当前应暴露的工具名称集合实时同步给上游 Pi Agent 运行时与 LLM API。

### 3. `ctx.extensions.createBridgeExtensionFactory(): { name: string; factory: Function; hidden: boolean }`
创建隐式内联扩展工厂，供 CLI 启动时传递给上游 `main({ extensionFactories })`，自动将微内核所有命令与工具注册到 TUI。

### 4. `ctx.extensions.getRegisteredCommands(): ReadonlyMap<string, ExtensionCommandDefinition>`
获取当前所有 Cordis 插件注册的斜杠命令集合。

### 5. `ctx.extensions.load(options?): Promise<any>`
从配置的本地路径与已安装包中扫描并加载所有外部扩展。加载完成后触发 `pi/extension-loaded`。

---

## 广播事件 (Events)

- **`pi/extension-loaded`**：当外部扩展加载完成时触发 `(result: any)`。
- **`pi/command-registered`**：当插件注册斜杠命令时触发 `(event: { name: string; definition: any })`。
- **`pi/command-unregistered`**：当插件注销斜杠命令时触发 `(name: string)`。
- **`pi/tool-registered`**：当插件注册新工具时触发 `(tool: ToolDef)`。
- **`pi/tools-changed`**：当工具或工具过滤器发生变更时触发。

