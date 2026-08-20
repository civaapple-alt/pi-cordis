# ExtensionService (`ctx.extensions`)

English | [中文](extension-service.zh.md)

`ExtensionService` is the extension loading and runtime bridging service in Pi-Cordis. It loads TypeScript extensions from local paths or installed npm/git packages and bridges Pi's `ExtensionAPI` to the Cordis EventBus and 7 TUI interaction slots, emitting `pi/extension-loaded` events.

---

## 7 TUI Interaction Slots

`ExtensionService` enables extensions to drive terminal UI components:
1. **Select Modal**: Interactive keyboard-driven dropdowns and selection menus;
2. **Confirm Dialog**: Blocking `[Y/n]` confirmation modals before high-risk operations;
3. **Header / Footer Banners**: Dynamic custom status banners at the top or bottom of the terminal;
4. **Toast Notifications**: Lightweight toast alerts in the terminal;
5. **Custom Tool Renderers**: Bespoke ANSI/canvas visualizations during tool execution;
6. **Message Renderers**: Collapsible outputs and rich media cards;
7. **Status Bar Indicators**: Live metrics in the footer (e.g. token counts, git branch).

---

## API Reference

### 1. `ctx.extensions.load(options?): Promise<any>`
Scans and loads all configured extensions from local paths and installed packages. Emits `pi/extension-loaded`.

### 2. `ctx.extensions.getLoadedExtensions(): any[]`
Returns all currently loaded extension descriptors.

### 3. `ctx.extensions.getLoadedTools(): any[]`
Returns all tools contributed by loaded extensions.

---

## Events Emitted

- **`pi/extension-loaded`**: `(result: any)`

---

## Extension Implementation Example

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function myExtension(pi: ExtensionAPI) {
    pi.registerCommand("hello", {
        description: "Prints a greeting message",
        handler: async (args, ctx) => {
            if (ctx.hasUI) {
                ctx.ui.notify(`Hello, ${args || "world"}!`, "info");
            }
        }
    });

    pi.on("session_start", async (_event, ctx) => {
        console.log("Session started");
    });
}
```
