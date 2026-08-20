# Agent Note: Pi-Cordis Native Subagent Plugin Lean Enhancement Proposal

Status: proposed
Created: 2026-08-20

English | [中文](2026-08-20-pi-cordis-subagent-plugin-deep-enhancement-proposal.zh.md)

## Executive Summary

Guided by the **Minimalist Philosophy & "Default is Best" Principles**, this proposal defines a lean, high-leverage enhancement strategy for `@pi-cordis/plugin-subagent`.

After a deep comparative audit of the official Pi community benchmark [`pi-subagents`](https://github.com/nicobailon/pi-subagents) (130+ source files), this proposal explicitly **rejects overengineering and avoids hand-rolling a massive monolithic framework (e.g. complex Git Worktree cloners, bespoke Intercom protocols) inside built-in plugins**. Instead, it focuses purely on the **two fundamental pain points** of multi-agent delegation through lean, in-place enhancements:
1. **Session-Scoped Isolation (`ctx.session.create()`)**: Child agents execute with independent session state trees and context windows, returning only distilled deliverables to protect the parent's context window;
2. **Lightweight Role-Based Tool Slicing**: Uses the native `ctx.tools` mechanism to restrict tool permissions for `scout` (read-only recon) vs. `worker` (implementation).

---

## 1. Minimalist Scrutiny: Avoiding Overengineering

```text
┌────────────────────────────────────────────────────────────────────────┐
│               Minimalist Philosophy vs. Monolithic Clones              │
├────────────────────────────────────────────────────────────────────────┤
│ ❌ Overengineering Trap : Re-implementing a 130+ file monolith with     │
│    custom worktree managers and bespoke IPC inside built-in plugins.   │
│                                                                        │
│ ✅ The Lean Solution   : 1. Let the market thrive: users needing heavy  │
│    fleets can install `npm:pi-subagents` seamlessly via ExtensionAPI;  │
│    2. Focus on essentials: add < 50 lines to packages/plugins/subagent │
│    to achieve true session isolation and role tool slicing.            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. In-Place Lean Enhancement Blueprint

### 1. Physical Session Isolation (`SessionManager` Binding)
- **Problem**: In-memory fiber branching via `ctx.extend()` lacks independent session management and state persistence;
- **Lean Implementation**:
  ```typescript
  // Inside packages/plugins/subagent/src/index.ts
  const subSession = ctx.session.create(cwd, { title: `Subagent: ${args.task}` });
  try {
    const result = await subSession.runTask(args.task, { allowedTools });
    return { success: true, summary: result.summary, deliverables: result.deliverables };
  } finally {
    ctx.session.close(subSession.id);
  }
  ```
- **Value**: Child session exploration logs and token consumption remain completely isolated, **saving 80%+ of parent context window tokens**.

---

### 2. Role-Based Tool Slicing
Without complex external Markdown DSL parsers, support the two highest-frequency workflows natively:
- **`scout` / `researcher` (Read-only Recon)**:
  - Restricted to read-only tools: `['read', 'grep', 'find', 'ls']`;
- **`worker` / `implementer` (Implementation)**:
  - Exposes standard coding tools: `['read', 'write', 'edit', 'bash']`.

---

## 3. Lean Tool Signature

```typescript
export interface SubagentParams {
  /** Task description (required) */
  task: string;
  /** Role persona: 'scout' (read-only) | 'worker' (implementation) | 'reviewer' (audit) */
  role?: "scout" | "worker" | "reviewer";
  /** Context and file path constraints */
  context?: string;
  /** Timeout in milliseconds (default: 60000ms) */
  timeoutMs?: number;
}
```

---

## 4. Consequences & Benefits

1. **Minimal Code Footprint (< 50 lines)**: Delivers core multi-agent delegation without bloating the plugin workspace;
2. **Zero Context Pollution**: Protects the primary conversation from large exploration logs;
3. **Ecosystem Harmony**: Complements heavy community packages like `pi-subagents` without duplicating code.
