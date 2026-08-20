# ExtensionService (`ctx.extensions`)

English | [中文](extension-service.zh.md)

`ExtensionService` is the extension loading and bidirectional command/UI bridging service in Pi-Cordis. It loads TypeScript extensions from local paths or installed npm/git packages and bridges Slash Commands registered by Cordis plugins and Pi's native `ExtensionAPI` to the 7 TUI interaction slots, emitting `pi/extension-loaded`, `pi/command-registered`, and `pi/command-unregistered` events.

---

## Core Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                 ExtensionService Bridge Hub                 │
├─────────────────────────────────────────────────────────────┤
│  Cordis Plugin Layer (@pi-cordis/profiles, @pi-cordis/btw)  │
│         │                                                   │
│         ▼ ctx.extensions.registerCommand("btw", ...)        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │    ExtensionService Registry (commands Map + Disposer)│  │
│  └───────────────────────────────────────────────────────┘  │
│         │                                                   │
│         ▼ createBridgeExtensionFactory()                    │
│  Upstream TUI Main Loop (pi.registerCommand -> ctx.ui)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 7 TUI Interaction Slots

`ExtensionService` enables extensions to drive terminal UI components:
1. **Select Modal**: Interactive keyboard-driven dropdowns and selection menus;
2. **Confirm Dialog**: Blocking `[Y/n]` confirmation modals before high-risk operations;
3. **Header / Footer Banners**: Dynamic custom status banners at the top or bottom of the terminal;
4. **Toast Notifications**: Lightweight toast alerts in the terminal (`ctx.ui.notify`);
5. **Custom Tool Renderers**: Bespoke ANSI/canvas visualizations during tool execution;
6. **Message Renderers**: Collapsible outputs and rich media cards;
7. **Status Bar Indicators**: Live metrics in the footer (e.g. token counts, git branch).

---

## API Reference

### 1. `ctx.extensions.registerCommand(name: string, definition: ExtensionCommandDefinition): () => void`
Allows any Cordis plugin to declaratively register a terminal slash command via Cordis Fiber. Returns a reversible `Disposer` function that unregisters the command upon plugin unloading.
```typescript
export interface ExtensionCommandDefinition {
    description: string;
    getArgumentCompletions?: (prefix: string) => Array<{ value: string; label?: string }> | null;
    handler: (args: string, cmdCtx: any) => Promise<void> | void;
}
```

### 2. `ctx.extensions.getRegisteredCommands(): ReadonlyMap<string, ExtensionCommandDefinition>`
Returns all slash commands currently registered across all Cordis plugins.

### 3. `ctx.extensions.createBridgeExtensionFactory(): { name: string; factory: Function; hidden: boolean }`
Creates a hidden inline extension factory passed to upstream `main({ extensionFactories })` during CLI boot, automatically registering all microkernel commands to the TUI.

### 4. `ctx.extensions.load(options?): Promise<any>`
Scans and loads all configured extensions from local paths and installed packages. Emits `pi/extension-loaded`.

### 5. `ctx.extensions.getLoadedExtensions(): any[]`
Returns all currently loaded extension descriptors.

### 6. `ctx.extensions.getLoadedTools(): any[]`
Returns all tools contributed by loaded extensions.

---

## Events Emitted

- **`pi/extension-loaded`**: `(result: any)`
- **`pi/command-registered`**: `(event: { name: string; definition: any })`
- **`pi/command-unregistered`**: `(name: string)`

---

## Cordis Plugin Command Registration Example

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "my-command-plugin";
export const inject = ["extensions"];

export function apply(ctx: Context) {
    ctx.extensions.registerCommand("hello", {
        description: "Prints a greeting message",
        handler: async (args, cmdCtx) => {
            if (cmdCtx.hasUI) {
                cmdCtx.ui.notify(`Hello, ${args || "world"}!`, "info");
            }
        },
    });
}
```
