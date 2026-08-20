# Agent Note: Pi-Cordis Built-in Plugin Ecosystem Optimal Architecture Blueprint and Guide

Status: proposed
Created: 2026-08-20

English | [中文](2026-08-20-pi-cordis-plugin-ecosystem-optimal-architecture-and-roadmap.zh.md)

## Executive Summary

Following the successful upgrade of `@pi-cordis/plugin-code-mode` to the industry standard of **"Dynamic .d.ts Generation + Tool Presentation Masking + Node.js worker_threads Isolate Sandbox + TUI Polymorphic Render Cards"**, this architectural blueprint systematically defines the **Optimal Solution standards and evolution roadmap for all 15 built-in plugins in Pi-Cordis**.

By aligning with the industrial agent design philosophy of **DeepSeek Harness (DSH)**, we elevate each plugin from a basic implementation into a robust native Cordis extension featuring **crash prevention, token & KV-cache efficiency, rich terminal visualization, strong-typed contracts, and 100% reversible side-effects**.

---

## 1. The 5 Pillars of Pi-Cordis Plugin Optimal Solutions

```text
┌────────────────────────────────────────────────────────────────────────┐
│             The 5 Pillars of Pi-Cordis Plugin Optimal Solutions         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Type & Schema Rigor : Precise JSON Schemas and JSDoc documentation  │
│ 2. Presentation & Cache : Tool masking and KV cache prefix stability   │
│ 3. True Isolation & Defense : Worker threads and timeout termination   │
│ 4. TUI Rich UI : Polymorphic renderCall/renderResult folded cards      │
│ 5. 100% Reversible Effects : Clean rollback via Cordis disposers       │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Type & Schema Rigor**: Every tool input and return payload possesses exact JSON Schemas, TypeScript interfaces, and descriptive JSDoc documentation.
2. **Presentation & Token Efficiency**: Tailors the model-visible tool surface (e.g. masking underlying tools in Code Mode) to reduce tool schema token footprint and maintain KV cache prefix stability.
3. **True Isolation & Defensive Patterns**: High-risk tasks are bounded by thread/process isolation with hard timeout ceilings and physical termination (`worker.terminate()`).
4. **TUI Rich Visualizations**: User-facing tools implement `renderCall` and `renderResult` supporting compact collapsed summaries and rich expanded views.
5. **100% Reversible Effects**: All registrations, listeners, and intercepts are encapsulated in `ctx.effect()`, ensuring zero residue when switching profiles.

---

## 2. The 15 Plugins Optimization Map (Aligned with DSH)

| Plugin | DSH Equivalent & Pattern | Pi-Cordis Optimal Enhancement |
|---|---|---|
| **1. `code-mode`** | `code-runtime-worker-thread`, `tool-presentation` | **[Completed]** Dynamic `.d.ts` generation + Tool presentation masking + `worker_threads.Worker` execution + Async infinite-loop termination + TUI folded cards. |
| **2. `output-truncator`** | `spill/`, `guard/tool-output-truncation` | **Spill Storage & Head/Tail Preservation**: Retains Head (first 30 lines) + Tail (last 20 lines); overflows >50KB are persisted to `.pi/spill/<id>.txt` with offset/limit pagination guidance. |
| **3. `ask-question`** | `interaction/tool-ask-user`, `user-questions` | **Interactive Decision & Batch Questions**: Multi-question batching, `(Recommended)` selection highlights, single/multi-select, and TUI keyboard navigation. |
| **4. `plan-mode`** | `plan/`, `plan-mode` | **Dependency Graph & Progress Dashboard**: State machine (`pending` -> `in_progress` -> `completed`), visual progress bar (`[████░░] 60%`), and mutating tool interception. |
| **5. `todo-tracker`** | `todo/` (`tool-todo-write`) | **Task State Machine & Adaptive Injection**: 4-state task progression, with completed tasks collapsed into summaries (`✓ N completed hidden`) in prompt injection. |
| **6. `subagent`** | `subagent/` (`subagent-local`) | **Depth Bounds & AbortSignal Cascade**: Isolated `ctx.extend()` scope, recursion depth ceiling, cascading aborts on session cancellation, and structured summary deliverables. |
| **7. `safety-gate`** | `sandbox/`, `guard/tool-hygiene` | **Multi-Tier Security Engine**: Command pattern detection (`rm -rf /`, `chmod -R 777`), sensitive path blacklists (`.env`, `.ssh/`), and credential leak prevention. |
| **8. `git-guard`** | `guard/` | **Atomic Stash Checkpoints & Rollback**: Creates lightweight `git stash create` SHA references before risky turns for one-click rollback on failure. |
| **9. `context-compactor`** | `compaction/` (`compaction-basic`) | **Decision-Preserving Compactor**: Extracts 4 core assets (modified files, architectural decisions, resolved issues, blockers) while preserving system prompt prefix. |
| **10. `tools-manager`** | `core/tools` | **Capability Slicing**: Batch-toggles toolsets by scenario (e.g. read-only review, code generation) with instant Cordis effect disposal. |
| **11. `git-automation`** | `shell/` | **Staged Diff Semantic Analysis**: Parses `git diff --staged` to infer commit scopes and formats Conventional Commits with issue linkages. |
| **12. `ssh-delegator`** | `e2b/`, `shell/` | **Persistent Connection Pool & Probing**: Reuses SSH handshakes via multiplexing, probes remote OS/tools, and returns structured command results. |
| **13. `rules-injector`** | `context/workspace-rules` | **Hierarchical Rules & Hash Caching**: Recursively discovers project instruction files (`AGENTS.md`, `CLAUDE.md`) with SHA-256 hash caching to preserve KV cache. |
| **14. `session-handoff`** | `session/`, `goal/` | **Standardized Handoff Envelope**: Packages goals, milestones, key files, and next actions into an artifact for smooth transition to a new session. |
| **15. `profiles`** | `preset/`, `bundle/` | **Preset Composition & Incremental HMR**: Supports profile inheritance/layering (e.g. `default + code-mode`) and seamless dual-track hot reload. |

---

## 3. Implementation Phases

### Phase 1: Robustness & Spill Protection (Top Priority)
1. **`output-truncator` -> Spill Mechanism**: Implement `.pi/spill/` storage and Head/Tail preservation.
2. **`safety-gate` -> Multi-Tier Security Engine**: Pattern-based command checks and protected file boundaries.
3. **`git-guard` -> Atomic Stash Checkpoints**: Lightweight snapshots before mutating operations.

### Phase 2: Interaction & Reasoning Efficiency (Second Priority)
4. **`ask-question` -> Batch Questions & Recommended Choices**.
5. **`plan-mode` -> Step State Machine & Mutating Interceptor**.
6. **`todo-tracker` -> Adaptive Prompt Injection & Task State Machine**.
7. **`subagent` -> AbortSignal Cascades & Depth Boundaries**.

### Phase 3: Long-Session & Collaboration Optimization (Third Priority)
8. **`context-compactor` -> 4-Dimensional Decision Compaction**.
9. **`session-handoff` -> Standardized Handoff Envelope**.
10. **`git-automation` -> Staged Diff Semantic Analysis**.
11. **`ssh-delegator` -> SSH Multiplexing & Remote Probing**.
12. **`rules-injector` -> Hash Caching & Hierarchical Merging**.
