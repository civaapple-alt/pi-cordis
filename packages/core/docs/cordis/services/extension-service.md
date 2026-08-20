# ExtensionService (`ctx.extensions`)

English | [中文](extension-service.zh.md)

`ExtensionService` is the extension loading and bidirectional command/tool/UI bridging service in Pi-Cordis. It loads TypeScript extensions from local paths or installed npm/git packages and bridges Slash Commands and Plugin Tools registered by Cordis plugins to Pi's native `ExtensionAPI` and 7 TUI interaction slots, emitting `pi/extension-loaded`, `pi/command-registered`, `pi/tools-changed` events.

---

## Core Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ExtensionService Bridge Hub                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Cordis Plugin Layer (@pi-cordis/profiles, @pi-cordis/plugin-ask-question)  │
│         │                                                                   │
│         ├─► ctx.extensions.registerCommand("profile", ...)                  │
│         └─► ctx.tools.register({ name: "ask_question", execute(...) })      │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │     ExtensionService Registry (commands Map + Tool Adapter + Disposer)│  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼ createBridgeExtensionFactory()                                    │
│  Upstream TUI Main Loop (pi.registerCommand / pi.registerTool / setActive)  │
│         │                                                                   │
│         ▼ Terminal UI Context Forwarding (ExtensionContext.ui)              │
│  [cmdCtx.ui / execContext.ctx.ui] ──► select() / input() / confirm() / notify()│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7 TUI Interaction Slots & UI Primitives

`ExtensionService` enables extensions and plugins to drive terminal UI components:

1. **Select Modal** (`ui.select`): Interactive keyboard-driven dropdowns and selection menus;
2. **Input Prompt** (`ui.input`): Interactive single-line text input modal for custom user answers;
3. **Confirm Dialog** (`ui.confirm`): Blocking `[Y/n]` confirmation modals before high-risk operations;
4. **Toast Notifications** (`ui.notify`): Lightweight toast alerts in the terminal (`info` / `warning` / `error`);
5. **Header / Footer Banners** (`ui.setHeader` / `ui.setFooter`): Dynamic custom status banners at the top or bottom of the terminal;
6. **Custom Tool Renderers** (`renderCall` / `renderResult`): Bespoke ANSI/canvas visualizations during tool execution;
7. **Message Renderers**: Collapsible outputs and rich media cards.

---

## Best Practices for Plugin UI Interaction

### 1. UI in Slash Commands (`cmdCtx.ui`)
When a user types a slash command (e.g. `/profile`, `/btw`), `cmdCtx` is provided as the 2nd argument:
```typescript
ctx.extensions.registerCommand("my_command", {
    description: "Example command",
    handler: async (args, cmdCtx) => {
        if (cmdCtx.hasUI && cmdCtx.ui) {
            const chosen = await cmdCtx.ui.select("Select mode", ["Mode A", "Mode B"]);
            cmdCtx.ui.notify(`Selected: ${chosen}`, "info");
        }
    },
});
```

### 2. UI in Tool Execution (`execContext.ctx.ui`)
When the LLM triggers a `tool_call` (e.g. `ask_question`), `tool.execute` receives `execContext` as the 2nd argument, containing the Pi native `ExtensionContext`:
```typescript
ctx.tools.register({
    name: "my_tool",
    description: "Interactive tool",
    parameters: { type: "object", properties: { prompt: { type: "string" } } },
    execute: async (args, execContext) => {
        const ui = execContext?.ctx?.ui;
        const hasUI = Boolean(execContext?.ctx?.hasUI && ui?.select);

        if (hasUI) {
            // Interactive terminal selection
            const selected = await ui.select(args.prompt, ["Option 1", "Option 2"]);
            return { selected };
        } else {
            // Non-interactive / CI / test fallback
            return { selected: "Option 1" };
        }
    },
});
```

---

## API Reference

### 1. `ctx.extensions.registerCommand(name: string, definition: ExtensionCommandDefinition): () => void`
Declaratively registers a terminal slash command via Cordis Fiber. Returns a reversible `Disposer` function.

### 2. `ctx.extensions.syncActiveTools(): void`
Synchronizes active tool schemas to upstream Pi Agent runtime based on active filters (such as PTC code-mode).

### 3. `ctx.extensions.createBridgeExtensionFactory(): { name: string; factory: Function; hidden: boolean }`
Creates a hidden inline extension factory passed to upstream `main({ extensionFactories })` during CLI boot.

### 4. `ctx.extensions.getRegisteredCommands(): ReadonlyMap<string, ExtensionCommandDefinition>`
Returns all registered slash commands.

### 5. `ctx.extensions.load(options?): Promise<any>`
Loads all configured extensions from local paths and installed packages. Emits `pi/extension-loaded`.

