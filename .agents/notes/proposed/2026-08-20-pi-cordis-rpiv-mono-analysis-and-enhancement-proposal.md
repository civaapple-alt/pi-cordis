# Agent Note: Pi-Cordis rpiv-mono Lean Feature Absorption Proposal

Status: proposed
Created: 2026-08-20

English | [中文](2026-08-20-pi-cordis-rpiv-mono-analysis-and-enhancement-proposal.zh.md)

## Executive Summary

Guided by the **Minimalist Philosophy & Anti-Fragmentation Principles**, this architecture proposal deconstructs the official Pi community benchmark repository [`juicesharp/rpiv-mono`](https://github.com/juicesharp/rpiv-mono) (15 packages) and distills its most valuable interaction features.

This proposal explicitly **rejects the "plugin fragmentation" anti-pattern (creating new separate npm packages for 15-line utilities)**. Instead, it adopts an **in-place absorption strategy** within existing core services and plugins:
1. **Built-in `/btw` Command**: Mounts ephemeral side-channel questions directly into the CLI/commands layer without creating an extra package;
2. **In-Place Upgrade to `@pi-cordis/plugin-ask-question`**: Adds side-by-side Markdown/Diff previews and note attachments;
3. **In-Place Upgrade to `@pi-cordis/plugin-todo-tracker`**: Adds a persistent floating overlay above the input box and dependency cycle checks;
4. **EventBus OSC 777 Terminal Notifications**: Adds a 15-line listener in `ExtensionService` emitting native OS toasts to Warp/Ghostty/iTerm2.

---

## 1. Minimalist Scrutiny: Rejecting Plugin Fragmentation

```text
┌────────────────────────────────────────────────────────────────────────┐
│             Minimalist Philosophy vs. Plugin Fragmentation             │
├────────────────────────────────────────────────────────────────────────┤
│ ❌ Fragmentation Trap : Creating new npm packages for every minor       │
│    utility (e.g. a 15-line OSC 777 listener or a single /btw command). │
│                                                                        │
│ ✅ The Lean Solution   : 1. Polish existing plugins in-place;           │
│    2. Integrate `/btw` directly into the core command layer;           │
│    3. Attach OSC 777 notifications directly to the central EventBus.   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Lean Evolution Blueprint

### 1. Built-in `/btw` Side-Question Command
- **Objective**: Allows asking side questions without polluting the main conversation history or wasting context tokens;
- **Implementation**: Registers `/btw <question>` in `packages/coding-agent/src/core/cordis/`:
  - Derives an ephemeral read-only fiber via `ctx.extend()`;
  - Queries `ctx.ai` and displays the answer in a bottom floating panel;
  - Disposes the fiber immediately, leaving zero traces in the main transcript.

---

### 2. In-Place Upgrade for `@pi-cordis/plugin-ask-question` (Markdown Previews)
- **Objective**: Visual comparison of diffs or architecture options;
- **Implementation**: Adds `preview?: string` to option parameters, rendering a bordered Markdown preview pane to the right of the options list.

---

### 3. In-Place Upgrade for `@pi-cordis/plugin-todo-tracker` (Floating Overlay)
- **Implementation**:
  - Mounts a clean `Todos (done/total)` overlay above the input box;
  - Performs topological sort on `dependsOn` to reject cyclic or invalid dependencies.

---

### 4. Native `OSC 777` Terminal Notifications
- **Implementation**: A 15-line listener in `ExtensionService`:
  - Listens to `pi/tool-call` (emits "Waiting for Answer" on `ask_question`);
  - Listens to `pi/session-turn-end` (emits "Turn Completed");
  - Writes `\x1b]777;notify;title;body\x07` to `stdout` in supported terminals (Warp, Ghostty, iTerm2).

---

## 3. Consequences & Benefits

1. **Zero Package Bloat**: Avoids adding redundant npm packages to the workspace;
2. **Instant Out-of-the-Box Value**: OSC 777, `/btw`, and previews work seamlessly with zero setup;
3. **Lowest Maintenance Overhead**: Captures the top 4 interaction benefits of `rpiv-mono` in under 100 lines of total code.
