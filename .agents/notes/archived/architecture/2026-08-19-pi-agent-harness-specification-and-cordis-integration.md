# Agent Note: Pi AgentHarness Specification and Cordis Microkernel Integration

Status: implemented
Archived: 2026-08-20
Created: 2026-08-19

English | [中文](2026-08-19-pi-agent-harness-specification-and-cordis-integration.zh.md)

## Executive Summary

This Architecture Decision Record (ADR) analyzes the industrial-grade **AgentHarness specification** defined in upstream Pi's `packages/agent/docs/harness.md`, and outlines its integration blueprint with the **Cordis (v4.0.1) microkernel**:
1. **The Three Stores Model**: `entries` (immutable tree), `registers` (typed mutable state / program counter), and `usage ledger` (append-only cost tracking);
2. **The Effect Sandwich**: Two-phase transactional commits (`Intent -> Effect -> Settlement`) and crash recovery with synthetic settlements for non-replayable (`replay: "never"`) operations;
3. **Lanes Concurrency**: Multi-cursor execution on top of shared immutable history trees;
4. **Cordis Control Plane Mapping**: Encapsulating `Storage` and `Operations` as `ctx.session` and `ctx.agent` services.

---

## 1. Deep Dive: AgentHarness Specification

```text
                                AgentHarness System Model
  ┌───────────────────────────────────────────────────────────────────────────┐
  │ 1. Harness & Operations (Control Plane & State Machine)                   │
  │    • Drives Lanes / Runs Assistant / Tools Execution / Checkpoint         │
  │    • Durable Program Counter (op.state/{opId})                            │
  ├───────────────────────────────────────────────────────────────────────────┤
  │ 2. Session & Conversation Tree (Conversation Tree Model)                  │
  │    • Entry Tree (Message / Compaction / BranchSummary / Custom)           │
  │    • Lanes (Named Cursors, e.g. main, slack:thread_1, subagent:worker_2)   │
  │    • Facts (Namespaced Key-Value metadata)                                │
  ├───────────────────────────────────────────────────────────────────────────┤
  │ 3. Storage Layer (The Three Stores Model)                                 │
  │    • entries (Write-once append-only tree)                                │
  │    • registers (Current mutable state and program counters)               │
  │    • usage ledger (Append-only cost ledger rows)                          │
  └───────────────────────────────────────────────────────────────────────────┘
```

### 1. The Three Stores Model
All durable state belongs strictly to one of three storage types:
- **`entries`**: **Write-once, Append-only**. Once written, never modified or deleted. Encompasses `message`, `compaction`, `branch_summary`, and `custom` entries;
- **`registers`**: **Namespaced Typed Cells**. The only mutable state store.
  - `lane.leaf`: The active leaf entry id for a given lane;
  - `op.state`: **The durable program counter** representing the total operation state;
  - `op.tool_args`: Staged tool arguments;
  - `pending.entry`: Staged content awaiting placement;
- **`usage ledger`**: **Append-only Rows**. Records token and monetary costs for each provider attempt; persists even if operations abort.

---

## 2. The Effect Sandwich Pattern
To handle unexpected crashes during streaming or destructive tool execution (e.g. file deletions), Harness mandates a two-phase commit wrapper:

```text
  Commit 1 (Intent):    "About to execute Tool X; reserved result entry_id = n3, usage_id = u1"
          ↓
  Do Effect:            Invoke model / execute shell tool (the only uncertain window)
          ↓
  Commit 2 (Settlement): Write tool result entry_n3 + usage_u1 + advance op.state
```

* **Crash Recovery Policy**:
  - If a process crashes during `Do Effect`, upon restart the Harness inspects `op.state`:
  - **`replay: "safe"` (Read-only operations)**: Re-executes the tool;
  - **`replay: "never"` (Destructive operations)**: **Never re-executes**; injects a synthetic "interrupted" result to close the conversation tree safely without duplicating destructive side effects.

---

## 3. Lanes Concurrency
- A session can host multiple named cursors (**Lanes**) over the same conversation history;
- Enables subagents, Slack threads, and parallel workflows to branch off the root tree without duplicating stored history.

---

## 4. Storage Backends
- **Memory**: In-memory maps for tests and transient sessions;
- **JSONL (v4)**: Replay recipe with snapshot compaction;
- **SQLite**: One `.sqlite` file per session, utilizing `BEGIN IMMEDIATE` and `writer_lease` for single-writer process fencing.

---

## 5. Fusion with Cordis Microkernel

The relationship between AgentHarness and Cordis is a classic **Data Plane vs Control Plane** synergy:

```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │         Cordis Microkernel Control Plane (packages/.../src/core/cordis)│
  │  Context / IoC Container / static provide / Lifecycle Events / Plugins │
  └──────────────────┬──────────────────────────────────┬──────────────────┘
                     │                                  │
      ┌──────────────▼─────────────┐      ┌─────────────▼──────────────┐
      │  SessionService            │      │  AgentService              │
      │  (ctx.session: Storage)    │      │  (ctx.agent: Harness/Lanes)│
      └──────────────┬─────────────┘      └─────────────┬──────────────┘
                     │                                  │
  ┌──────────────────▼──────────────────────────────────▼──────────────────┐
  │         AgentHarness Industrial Data Plane & State Machine             │
  │  Three Stores (entries/registers/ledger) / Effect Sandwich / Lanes     │
  └────────────────────────────────────────────────────────────────────────┘
```

1. **`SessionService` (`ctx.session`)**: Wraps `Storage` and `SessionTree` into standard Cordis services;
2. **`AgentService` (`ctx.agent`)**: Coordinates multi-lane execution, program counter transitions, and recovery;
3. **Plugin Event Interception**: Cordis plugins hook seamlessly into the Effect Sandwich via `ctx.on("pi/tool-call")` and `ctx.on("pi/session-before")`.

---

## 6. Conclusion

1. **Rock-Solid Durability**: AgentHarness provides deterministic crash resilience and transactional integrity;
2. **Microkernel Flexibility**: Cordis v4.0.1 brings modularity, inversion of control, and full plugin extensibility on top.
