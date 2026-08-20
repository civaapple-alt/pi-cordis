# Agent Note: Pi-Cordis Agent Self-Inspection, Introspection Architecture, and Knowledge Grounding

Status: implemented
Created: 2026-08-20

English | [中文](2026-08-20-pi-cordis-agent-self-inspection-and-introspection-architecture.zh.md)

## Executive Summary

An effective AI coding assistant is not merely a blind tool-execution engine; it must possess clear **self-awareness, environmental introspection, and capability grounding**.

One of the defining strengths of native [`earendil-works/pi`](https://github.com/earendil-works/pi) is its strong self-introspection tradition: it injects documentation paths, extension examples, project guidelines, and skill catalogs into the system prompt, enabling the agent to understand its own architecture and autonomously develop extensions or adapt to project constraints.

**Pi-Cordis preserves 100% of this tradition while elevating it into a structured 5-Dimensional Self-Inspection Model on top of the Cordis v4.0.1 microkernel.** This document records the architectural design, implementation mechanisms, and best practices for agent introspection in Pi-Cordis.

---

## 1. Why a Coding Agent Requires Introspection

In real-world engineering environments, an agent lacking self-awareness suffers from critical failure modes:
1. **Blind Tool Hallucinations**: Attempting to invoke non-existent or restricted tools without awareness of the active mode;
2. **Inability to Autonomously Extend Itself**: Failing to locate SDK contracts, extension examples, or provider interfaces when asked to develop custom plugins;
3. **Disregard for Project Boundaries**: Refactoring code without respecting repository guidelines (such as `AGENTS.md` or `.cursorrules`);
4. **Mode Blindness**: Repeatedly triggering blocked mutations while in read-only planning (`plan`) or programmatic tool calling (`ptc`) modes.

---

## 2. The 5-Dimensional Self-Inspection Model

Pi-Cordis establishes a comprehensive introspection framework spanning documentation, project rules, microkernel services, toolsets, and visual observability:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   5-Dimensional Self-Inspection Model                  │
├────────────────────────────────────────────────────────────────────────┤
│ 📚 1. Self-Documentation & Extension Grounding : Native docs/examples  │
│ 📋 2. Project Rules & Guidelines               : rules-injector + SHA  │
│ ⚙️ 3. Microkernel Service Mesh Reflection      : 10 Core Services      │
│ 🛠️ 4. Dynamic Toolset & Preset Awareness       : /profile + PTC Masking│
│ 🖥️ 5. Visual Observability & Telemetry         : TUI Banner + OSC 777  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Dimension 1: Self-Documentation & Extension Grounding

#### 1. Native Pi Documentation Paths Preserved
By consuming `@earendil-works/pi-coding-agent`, the agent automatically receives absolute documentation paths in its system prompt:
- `readmePath`: Primary documentation entrypoint;
- `docsPath`: Detailed subsystem specifications (`extensions.md`, `skills.md`, `tui.md`, `custom-provider.md`, `models.md`, `packages.md`, etc.);
- `examplesPath`: Extension development, custom tools, and SDK examples.

#### 2. Built-in Cordis Core Services Documentation
In [`packages/core/docs/cordis/services/`](../../../packages/core/docs/cordis/services/README.md), all 10 Core Services are documented across 22 bilingual Markdown files. When prompted to extend Cordis capabilities, the agent can inspect these contracts directly.

---

### Dimension 2: Project Rules & Guidelines

#### 1. Multi-Level Recursive Rule Discovery
The `@pi-cordis/plugin-rules-injector` plugin hooks into the `pi/prompt-transform` lifecycle event to scan:
- Root guideline files: `AGENTS.md`, `CLAUDE.md`, `.clauderules`, `.cursorrules`;
- Subdirectory rule collections: `.claude/rules/*.md`, `.agents/rules/*.md`.

#### 2. SHA-256 KV-Cache Protection
Rather than naively concatenating dynamic prompt fragments, `rules-injector` hashes the combined rule contents:
```typescript
const combinedRaw = rulesFound.map((r) => `${r.file}:${r.content}`).join("\n---\n");
const currentHash = crypto.createHash("sha256").update(combinedRaw).digest("hex");

if (currentHash === cachedHash && cachedBlock) {
    event.prompt += cachedBlock; // Cache hit: preserves 100% LLM KV-cache prefix stability
    return;
}
```
This guarantees that guideline updates remain fresh without degrading Time-to-First-Token (TTFT).

---

### Dimension 3: Microkernel Service Mesh Reflection

The Cordis IoC container exposes 10 strongly-typed reactive services on `ctx`:
- `ctx.settings`: Reflects effective global and project settings;
- `ctx.auth`: Reflects configured credential metadata;
- `ctx.ai`: Reflects available models and the active model runtime;
- `ctx.tools`: Reflects registered tools and execution filter pipelines;
- `ctx.session`: Reflects active sessions and branching trees;
- `ctx.extensions`: Reflects loaded extension plugins and their contributed capabilities.

---

### Dimension 4: Dynamic Toolset & Preset Awareness

#### 1. Preset Reflection (`/profile`)
The agent and user can inspect the active preset mode (`default`, `plan`, `ptc`) and active plugin list via the `/profile` command.

#### 2. PTC / Code Mode Tool Masking
When switching to `ptc` (Programmatic Tool Calling) mode:
- `ToolRegistryService` masks granular single-step tools (such as `read`, `write`, `edit`);
- The agent is presented with a dynamic TypeScript `.d.ts` SDK and a single `run_code` execution endpoint;
- The agent recognizes its batch execution mode and outputs clean TypeScript scripts instead of fragmented round-trips.

---

### Dimension 5: Visual Observability & Telemetry

#### 1. TUI Microkernel Status Banner
The interactive welcome screen displays the `[Cordis Microkernel]` status badge and loaded plugin topology, aligning human and agent mental models.

#### 2. Native Desktop Notifications (OSC 777)
During long-running tasks or when awaiting user input, the agent emits OSC 777 escape sequences to trigger native desktop notifications in modern terminal emulators (Warp, Ghostty, iTerm2).

---

## 3. Comparison Matrix: Native Pi vs. Pi-Cordis

| Dimension | Native Pi Implementation | Pi-Cordis Enhanced Implementation |
|---|---|---|
| **Self-Documentation** | Injects `docs/` and `examples/` paths | Retains native paths + adds 10 Core Services API contracts |
| **Project Rules** | Single-file root scanning | Recursive multi-dir scanning + **SHA-256 KV-cache protection** |
| **Service Reflection** | Distributed across ununified classes | **Unified Cordis IoC container reflecting 10 services** |
| **Mode Awareness** | Static tool definitions | **`/profile` preset reflection + Code Mode dynamic tool masking** |
| **Skills Catalog** | Formats `<available_skills>` | Retains native format + supports dynamic reversible plugin skills |
| **Observability** | Basic status indicators | **TUI Microkernel Banner + OSC 777 system notifications** |

---

## 4. Engineering Guidelines

1. **Self-Describing Metadata**: Every new `@pi-cordis/plugin-*` must export descriptive `name`, `inject`, and tool descriptions.
2. **KV-Cache Friendly Prompt Mutations**: Any plugin transforming `pi/prompt-transform` must ensure deterministic prompt prefixes and avoid injecting volatile timestamps at the header.
3. **Atomic Tool Masking & Instruction Alignment**: When masking tools via `ctx.tools.addFilter()`, corresponding prompt instructions must be updated to keep agent awareness in sync with tool availability.
