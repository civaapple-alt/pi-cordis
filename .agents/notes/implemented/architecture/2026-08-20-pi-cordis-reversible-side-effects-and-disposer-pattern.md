# Agent Note: Pi-Cordis "Registrations are Effects, and Effects must be Reversible" and Disposer Pattern Philosophy

Status: implemented
Created: 2026-08-20

English | [中文](2026-08-20-pi-cordis-reversible-side-effects-and-disposer-pattern.zh.md)

## Executive Summary

This Architecture Decision Record (ADR) investigates the core axiom of the **Cordis microkernel: "Registrations are Effects, and Effects must be Reversible"** and its implementation and systemic value in `pi-cordis`.

It directly addresses the **causal relationship between reversible side effects and Hot Module Replacement (HMR)**: reversible side effects do not exist solely for HMR, but serve as the **foundational bedrock** of the entire microkernel platform. In addition to enabling live HMR, reversible side effects provide indispensable stability in **runtime profile switching, subagent sandboxing, plan-mode state transitions, and transactional rollback on plugin load failure**.

---

## 1. Core Philosophy and Causality

### Core Thesis:
> **It is not that HMR requires reversible side effects; rather, because the microkernel foundation guarantees that "all effects are reversible", the system effortlessly achieves HMR, zero-restart profile switching, and dynamic subagent sandboxing!**
> 
> **"Reversible side effects" is the foundation, while "HMR" is an application and a touchstone built on top of that foundation.**

```text
                                  ┌─── 1. Runtime Profile & Permission Switching (/profile safe -> full)
                                  │
                                  ├─── 2. Subagent Context Sandboxing & Clean Teardown
【Foundation: Reversible Effects】────┼─── 3. Plan-Mode (Read-only planning -> Execution mode transition)
                                  │
                                  ├─── 4. Transactional Atomic Rollback on Plugin Load Failure
                                  │
                                  └─── 5. Developer Experience: Code-Level HMR
```

---

## 2. Four Key Production Scenarios Requiring Reversibility Beyond HMR

In production environments without code changes or HMR, reversible effects remain vital:

### 1. Runtime Profile and Policy Elevation / Downgrade
- **Scenario**: A user inspects untrusted external code, switching to `/profile strict` (read-only audit, intercepting all writes and shell commands); once audited, switching back to `/profile default`.
- **Irreversible Consequence**: Strict interception listeners remain permanently in memory, blocking writes even after switching back, forcing a full CLI restart;
- **Reversible Microkernel**: `strict` plugin is disposed via `fork.dispose()`, cleanly unregistering interceptors and restoring permissions instantly.

### 2. Subagent Sandboxing and Teardown
- **Scenario**: The primary agent spawns a lightweight subagent to execute isolated tests or web research.
- **Irreversible Consequence**: Specialized tools and event listeners registered by the subagent leak into the main context, causing context pollution and tool confusion;
- **Reversible Microkernel**: The subagent runs inside an isolated `ctx.fork()` scope. Upon task completion, invoking `subagentScope.dispose()` atomically purges all temporary resources.

### 3. Plan-Mode vs Normal-Mode Transitions
- **Scenario**: The user toggles `/plan`, changing session-scoped policy while the root Plan Fiber and stable `exit_plan_mode` schema remain mounted.
- **Reversible Microkernel**: Upon plan approval, the plan plugin is disposed, immediately restoring standard coding tools with zero residue.

### 4. Transactional Atomic Rollback on Load Failure
- **Scenario**: A plugin registers 2 tools in `apply(ctx)`, but throws an unexpected exception while registering a 3rd tool.
- **Reversible Microkernel**: Cordis catches the exception and **executes the disposers of the first 2 tools in reverse order**, restoring system state to a clean pre-load condition.

---

## 3. Implementation of Reversible Side Effects in Pi-Cordis

### 1. Core Service Contract: Registrations Return Disposers
All underlying services return cleanup functions when registering resources:
```typescript
// ToolRegistryService: Registering returns a disposer
public register(tool: ToolDef): () => void {
  this.customTools.set(tool.name, tool);
  return () => {
    this.customTools.delete(tool.name);
  };
}

// Cordis EventBus: Event listener returns an unregister function
const disposer = ctx.on("pi/tool-call", handler);
```

### 2. Builtin Plugin Lifecycle Lifecycle
In [`packages/plugins/*`](file:///D:/gh-ws/dsh-ws/pi-cordis/packages/plugins/):
- **`safety-gate`**: Cleans up `pi/tool-call` listeners on disposal;
- **`todo-tracker`**: Removes `todo_write`/`todo_read` from `ctx.tools` and halts prompt injections on disposal;
- **`git-guard`**: Halts git stash checkpoint creation on disposal;
- **`rules-injector`**: Halts `AGENTS.md` prompt injections on disposal.

---

## 4. Architectural Comparison Matrix

| Architectural Dimension | Traditional Irreversible Scripts | Pi-Cordis Reversible Microkernel |
| :--- | :--- | :--- |
| **Profile / Preset Switching** | ❌ Cannot switch dynamically, requires full restart | ✅ `/profile` switches instantly with zero logic residue |
| **Subagent Delegation** | ❌ Global variable pollution, tool naming conflicts | ✅ `ctx.fork()` dedicated scope, disposed on completion |
| **Plugin Load Failures** | ❌ Leaves dirty half-initialized state | ✅ Automatically executes reverse disposers for atomic rollback |
| **Code Hot-Reloading (HMR)** | ❌ Impossible (accumulates duplicate tools & listeners) | ✅ Naturally enabled via `dispose()`, maintaining 1 live instance |
| **Long-Running Memory** | ❌ Memory steadily climbs due to leaked handlers | ✅ Garbage collector cleanly frees unreferenced objects |

---

## Consequences

1. **Defines the Microkernel Baseline**: All new services and plugins in `pi-cordis` must provide complete reverse teardown logic;
2. **Eliminates State Pollution**: Prevents zombie listeners, duplicate tool calls, and memory leaks;
3. **Paves the Way for Deep Multi-Agent Hierarchies**: Enables spawning arbitrary subagent trees and safely collecting them upon completion.
