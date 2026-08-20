# Agent Note: Pi-Cordis Bidirectional Tool Bridge Hub, Dynamic Tool Masking, and Interactive Terminal UI Specification

Status: implemented
Created: 2026-08-20

English | [中文](2026-08-20-pi-cordis-bidirectional-tool-bridge-and-interactive-ui.zh.md)

## Executive Summary

This Architectural Decision Record (ADR) documents the design and implementation of **Pi-Cordis Bidirectional Tool Bridging, Dynamic Tool Masking & Active Tool Synchronization on Profile Switch, and Interactive Terminal UI Integration**:

1. **Full Tool Visibility & Bidirectional Bridging**: Eliminates upstream CLI `--tools` allowlist filtering issues that previously suppressed plugin tools, establishing `ExtensionService` as the single bridge hub for both built-in search tools and custom plugin tools;
2. **Dynamic Tool Masking & Synchronization on Profile Switch**: Implements clean plugin Fiber unloading (`ctx.registry.delete`) during profile transitions and calls `pi.setActiveTools()` via `ExtensionService.syncActiveTools()`, dynamically updating the tools exposed to the LLM API (e.g. masking raw file/bash tools in PTC mode to expose only `run_code` and management tools);
3. **Bidirectional Terminal UI Context Specification**: Resolves `@pi-cordis/plugin-ask-question` interactive prompt issues by establishing standard access patterns for Command UI (`cmdCtx.ui`) and Tool UI (`execContext.ctx.ui`), guaranteeing blocking terminal interaction while gracefully falling back in non-interactive/CI environments.

---

## 1. LLM API Tool Visibility & Bridge Architecture

### 1. Upstream Pi `--tools` Whitelist Analysis
In upstream `@earendil-works/pi-coding-agent`'s `AgentSession`, tool filtering is defined as:
```typescript
const isAllowedTool = (name: string): boolean =>
    (!allowedToolNames || allowedToolNames.has(name)) && !excludedToolNames?.has(name);
```
- When CLI passes `--tools read,bash,edit,write,grep,find,ls`, `allowedToolNames` becomes a strict Set;
- Any extension tool (such as `ask_question`, `todo_write`, `subagent`) is stripped during `isAllowedTool` filtering, hiding plugin tools from the LLM API schema;
- When CLI leaves `--tools` omitted (`undefined`), upstream's `includeAllExtensionTools: true` strategy accepts all extension tools.

### 2. Bridge Hub Implementation
To guarantee all search tools (`grep`, `find`, `ls`) and custom plugin tools are accessible to the model:
1. **Omit CLI `--tools` injection**: Leaves `allowedToolNames` as `undefined`;
2. **Unified Bridge in `ExtensionService`**: Converts custom plugin tools from `ctx.tools.getCustomTools()` and built-in search tools into standard `ToolDefinition`s and registers them via `pi.registerTool()`;
3. **Reactive Tool Registration & Event Reflection**: Listens to `pi/tool-registered` for runtime hot registration and forwards `tool_call` and `tool_result` events back to the Cordis EventBus.

---

## 2. Dynamic Tool Masking & Active Tool Synchronization

### 1. Scene-Based Tool Masking
In the "Default is Best" preset architecture:
- **`default` Preset**: Exposes all 7 built-in tools + 10 plugin tools (17 tools total);
- **`ptc` Preset**: Masks raw `read`, `write`, `edit`, `bash`, `grep`, `find`, `ls` tools, requiring the LLM to batch operations through `run_code` and the TypeScript SDK;
- **`plan` Preset**: Blocks modifying operations during planning.

### 2. Lifecycle Unloading & Dynamic Sync Pipeline
When switching profiles (e.g. `/profile ptc` or `/profile default`):

```text
User executes /profile ptc in terminal
        │
        ▼
1. applyProfile(ctx, "ptc")
        │
        ├─► Calls ctx.registry.delete(plugin) to unload previous plugin Fibers
        │   (Automatically unregisters old tools, filters, and event hooks)
        ├─► Yields for microtask completion (await new Promise(r => setTimeout(r, 0)))
        ├─► Mounts new Profile plugins (e.g. code-mode registers run_code & filter)
        │
        ▼
2. ExtensionService.syncActiveTools()
        │
        ├─► Computes ctx.tools.getExportedToolNames() (applying active filters)
        ├─► Calls this.activePi.setActiveTools(exportedToolNames)
        │
        ▼
3. Upstream Pi AgentSession Runtime Updates
        │
        └─► agent.state.tools refreshed, LLM API tools dynamically switched
```

---

## 3. Bidirectional Terminal UI Context Specification

### 1. Context Access Guidelines
Microkernel components access UI capabilities through two distinct channels:

| Interaction Type | Trigger Source | Context Access Path | Purpose |
| :--- | :--- | :--- | :--- |
| **Command UI** | User executes slash command (e.g. `/profile`, `/btw`) | `cmdCtx.ui` in `handler(args, cmdCtx)` | Select profile, show ephemeral Toast notifications |
| **Tool UI** | LLM executes `tool_call` (e.g. `ask_question`) | `execContext.ctx.ui` in `execute(args, execContext)` | Terminal selection modal (`ui.select`), text prompt (`ui.input`), confirmation (`ui.confirm`) |

### 2. Core Rules for Plugin Developers
1. **Never access `ctx.ui` directly on Cordis `Context`**: Cordis context proxies intercept undeclared dependencies with `cannot get property "ui" without inject`; access `ui` only via `cmdCtx.ui` or `execContext.ctx.ui`;
2. **Always support non-interactive fallback**: Guard with `Boolean(execContext?.ctx?.hasUI && ui?.select)` and provide safe defaults in CI/headless/automated test environments.

---

## 4. Built-in Plugins Interaction Matrix

| Plugin Name | Interaction Type | UI Interface | Mechanism |
| :--- | :--- | :--- | :--- |
| `@pi-cordis/profiles` | Terminal Command | `cmdCtx.ui.select`<br>`cmdCtx.ui.notify` | Interactive preset picker and switch toast |
| `@pi-cordis/plugin-btw` | Terminal Command | `cmdCtx.ui.notify` | Side-channel single-turn inference toast |
| `@pi-cordis/plugin-ask-question` | Tool Call | `execContext.ctx.ui.select`<br>`execContext.ctx.ui.input` | Blocking terminal select modal and custom input dialog |
| `@pi-cordis/plugin-code-mode` | Tool Call | `renderCall`<br>`renderResult` | Worker thread batch runner with ANSI card renderer |
| `@pi-cordis/plugin-todo-tracker` | Tool Call | `renderCall`<br>`renderResult` | State machine tracking with ANSI status card |
| `@pi-cordis/plugin-plan-mode` | Tool Call | `renderCall`<br>`renderResult` | Step progression tracking and write blocker |
| `@pi-cordis/plugin-git-guard` | Tool Call | `renderCall`<br>`renderResult` | Git snapshot and rollback |
| `@pi-cordis/plugin-safety-gate` | Event Interceptor | `pi/tool-call` hook | Pattern-matching security blocker |
| `@pi-cordis/plugin-terminal-notifier`| Event Listener | `OSC 777` protocol | Desktop notifications for Warp / Ghostty / iTerm2 |

---

## 5. Verification and Quality Gates

1. **Profile Hot Switching Test**: Validated in `cordis-plugins-and-profiles.test.ts` that switching to `ptc` activates `run_code` and masks underlying tools, and switching back to `default` restores all tools;
2. **Interactive UI Selection Test**: Validated in `cordis-ten-plugins.test.ts` covering `ui.select`, `ui.input`, and non-interactive fallbacks;
3. **Static & Runtime Quality**: 37 unit tests pass 100%, `tsc --noEmit` reports 0 errors.
