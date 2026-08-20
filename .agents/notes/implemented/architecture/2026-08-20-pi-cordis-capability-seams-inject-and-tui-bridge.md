# Agent Note: Pi-Cordis Capability Seams, Explicit Dependency Injection (inject), and TUI Interaction Bridge Architecture

Status: implemented
Created: 2026-08-20

English | [中文](2026-08-20-pi-cordis-capability-seams-inject-and-tui-bridge.zh.md)

## Executive Summary

This Architecture Decision Record (ADR) documents **Pi-Cordis's alignment with the DeepSeek Harness (DSH) Capability Seam specification**, provides an in-depth analysis of **Cordis v4 explicit dependency injection (`export const inject = [...]`)**, and explains the end-to-end data and rendering pipeline from the **microkernel control plane to the `pi-tui` double-buffered terminal canvas**.

Through this architecture, Pi-Cordis achieves clean decoupling between capability definitions, provider drivers, business consumers, and terminal presentation layers.

---

## 1. DSH Capability Seams Tripartite Mapping in Pi-Cordis

DSH enforces the division of every capability into **3 orthogonal roles**. Pi-Cordis fully adopts this design philosophy:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Service Definition Layer (Contract)                                │
│    • packages/.../cordis/types.ts                                      │
│    • Context strongly-typed augmentation (ctx.tools, ctx.ai, etc.)     │
│    • Lifecycle event specifications (pi/tool-call, pi/prompt-transform)│
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Inversion of Control / Container
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 2. Service Provider Layer (Drivers & Implementations)                  │
│    • SettingsService (Local disk & config driver)                      │
│    • AIService (1307+ model runtime driver)                            │
│    • ToolRegistryService (Tool registry storage & dispatcher)          │
│    • SessionService (SQLite / in-memory persistence)                   │
│    • ExtensionService (TUI interaction bridge driver)                  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Declarative Dependency Injection (inject)
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 3. Consumer Layer (Business Plugins & Tools)                           │
│    • @pi-cordis/plugin-safety-gate (Consumes tool-call events)         │
│    • @pi-cordis/plugin-todo-tracker (Consumes ctx.tools for todo_write)│
│    • @pi-cordis/plugin-rules-injector (Consumes prompt-transform)      │
│    • @pi-cordis/plugin-git-guard (Consumes ctx.settings for checkpoint)│
└────────────────────────────────────────────────────────────────────────┘
```

1. **Service Definition**: Module augmentations in `types.ts` declare methods and event payload contracts;
2. **Service Provider**: Concrete driver classes in `services/*.ts` inheriting `Service` and providing `static provide = 'key'`;
3. **Consumer**: Autonomous plugins in `packages/plugins/*` declaring `inject = [...]` without coupling to underlying driver details.

---

## 2. Microkernel Mechanics of Explicit Dependency Injection (`inject`)

In Cordis v4.0.1, `export const inject = [...]` serves **3 primary governance functions**:

### 1. Strict Property Access Control
Cordis wraps `Context` with Proxies to enforce access boundaries:
- Accessing undeclared services (e.g. `ctx.settings`) without declaring `inject = ['settings']` triggers a runtime error: `Error: cannot get property "settings" without inject`;
- Eliminates undeclared implicit dependencies.

### 2. Out-of-Order Lifecycle Resolution
- Plugins do not rely on fixed physical load sequences;
- If a required service is not yet available, Cordis marks the plugin Fiber as `PENDING` and activates it automatically once the provider is registered.

### 3. Cascading Safe Disposal
- When an underlying provider is unloaded or hot-reloaded, dependent plugins are gracefully suspended or disposed of, preventing memory leaks and stale references.

---

## 3. End-to-End Flow: From Control Plane to `pi-tui` Terminal Rendering

```text
┌───────────────────────────────────────────────────────────────┐
│ 1. Plugin Control Plane (@pi-cordis/plugin-todo-tracker)      │
│    • Declares inject = ['tools', 'extensions']                │
│    • ctx.tools.register({ name: "todo_write", ... })          │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│ 2. Tool Registry Service (ToolRegistryService: ctx.tools)     │
│    • Aggregates tools and generates LLM Function Schemas      │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│ 3. Agent Inference & Event Bus (AgentService / Session Events)│
│    • Model issues Tool Call: todo_write(action="add", ...)    │
│    • Fires lifecycle events: tool_execution_start / end       │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│ 4. Terminal UI Engine (@earendil-works/pi-tui)                │
│    • Catches tool events and dispatches to tool renderers     │
│    • Default renderer draws collapsible Tool Cards in canvas  │
│    • Displays: ⚡ todo_write (...) / ✔ Added task [todo_1]    │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│ 5. Prompt Transformation Loop (ctx.on('pi/prompt-transform')) │
│    • Injects active tasks into subsequent System Prompts      │
│    • Model streams markdown progress formatted by pi-tui      │
└───────────────────────────────────────────────────────────────┘
```

---

## 4. `ExtensionService` and 7 TUI Customization Slots

`ExtensionService` (`ctx.extensions`) exposes Pi's `ExtensionAPI` to Cordis plugins, providing **7 interactive TUI slots**:

| TUI Slot | Code Invocation | Visual Presentation in Terminal |
| :--- | :--- | :--- |
| **1. Interactive Select Modal** | `await ctx.ui.select("Title", items)` | Interactive arrow-navigated dropdown popup (e.g. `/profile` menu) |
| **2. Confirmation Dialog** | `await ctx.ui.confirm("Are you sure?")` | `[Y/n]` modal blocking unconfirmed destructive actions |
| **3. Header / Footer Widgets** | `ctx.ui.setHeader(...)` / `setFooter(...)` | Persistent status banners at top/bottom of the canvas |
| **4. Toast Notifications** | `ctx.ui.notify("Task added", "info")` | Colored transient notification badges in terminal corner |
| **5. Custom Tool Renderers** | `pi.registerToolRenderer("todo_write", fn)`| Custom graphical renderers (e.g. checkboxes `[✓]`) |
| **6. Message / Entry Renderers** | `pi.registerMessageRenderer(fn)` | Custom reasoning/thinking fold and stream animations |
| **7. Status Bar Widgets** | `ctx.ui.setStatus("tasks", "3 pending")` | Live metric counters in the footer status row |

---

## 5. Concrete Code Example: Interactive Cordis Plugin

```typescript
import type { Context } from "@deepseek-ai/cordis";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export const name = "interactive-todo";
export const inject = ["tools", "extensions"];

export function apply(ctx: Context) {
  // 1. Register LLM Tool (Consumer of ctx.tools)
  ctx.tools.register({
    name: "todo_write",
    description: "Add or update task in todo list",
    parameters: { ... },
    execute: async (args) => { ... },
  });

  // 2. Register Interactive TUI Command (Consumer of ctx.extensions)
  ctx.extensions.register((pi: ExtensionAPI) => {
    pi.registerCommand("todos", {
      description: "Interactively view and switch tasks in TUI",
      handler: async (args, sessionCtx) => {
        if (sessionCtx.hasUI) {
          const chosen = await sessionCtx.ui.select("Active Tasks", [
            "1. [▶] Refactor Auth Module",
            "2. [ ] Write Integration Tests",
          ]);
          sessionCtx.ui.notify(`Selected: ${chosen}`, "info");
        }
      },
    });
  });
}
```

---

## Consequences

1. **Strict Capability Isolation**: Aligned with DSH Capability Seams and Cordis explicit injection standards;
2. **Zero Terminal Pollution**: All user interactions are double-buffered in `pi-tui`, eliminating terminal screen flickering;
3. **Ecosystem Extensibility**: Cordis plugins declaring `inject = ["tools", "extensions"]` achieve both LLM tool capability and interactive UI presentation.
