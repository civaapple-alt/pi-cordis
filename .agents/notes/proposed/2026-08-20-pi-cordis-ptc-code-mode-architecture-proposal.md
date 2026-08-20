# Agent Note: Pi-Cordis Programmatic Tool Calling (PTC / Code Mode) Architecture Design Proposal

Status: proposed
Created: 2026-08-20

English | [中文](2026-08-20-pi-cordis-ptc-code-mode-architecture-proposal.zh.md)

## Executive Summary

This Architecture Decision Record (ADR) Proposal provides an in-depth analysis of **DeepSeek Harness (DSH)'s acclaimed PTC (Programmatic Tool Calling / Code Mode)** architecture and outlines the design for implementing `@pi-cordis/plugin-code-mode` and the `presets/ptc/` preset in the **Pi-Cordis microkernel ecosystem**.

By transforming scattered JSON function calls into a **strongly-typed TypeScript SDK + single `run_code` executor**, PTC mode collapses complex multi-step workflows (which traditionally require 5~10 serial network round-trips) into **a single local programmatic execution**, cutting latency by 80%+ and saving over 90% of Context Window token budgets.

---

## 1. Native Tool Calling vs. PTC (Code Mode)

### 1. The Serial Round-Trip Bottleneck in Native Tool Calling
When scanning `src/` for files containing `deprecated`:
```text
[Round 1] Model invokes fs_list({ path: "src" }) ──> Awaits network ──> Receives 50 filenames
[Round 2] Model invokes fs_read({ file: "a.ts" }) ──> Awaits network ──> Content pushed to context
[Round 3] Model invokes fs_read({ file: "b.ts" }) ──> Awaits network ──> Content pushed to context
...
[Round 50] Reads completed, model produces final answer
```
- **Pain Point**: **50 consecutive round trips (taking several minutes)** while flooding the Context Window with unneeded file bodies.

---

### 2. Programmatic Execution in PTC (Code Mode)
Instead of exposing 50 loose JSON schemas, the system presents a **strongly-typed TypeScript SDK** with a single **`run_code`** tool. The model writes an expressive TypeScript program:

```typescript
// Model outputs complete TypeScript program in a single turn
import { fs } from '@pi/agent-sdk';

const files = await fs.list('src');
const tsFiles = files.filter(f => f.endsWith('.ts'));

// Concurrently reads and filters in memory; discard large text locally
const results = await Promise.all(
  tsFiles.map(async (file) => {
    const content = await fs.read(`src/${file}`);
    return content.includes('deprecated') ? file : null;
  })
);

console.log(`Files with deprecated usages:`, results.filter(Boolean));
```
- **Benefit**: Runs in milliseconds within a local Worker sandbox, returning only the distilled output in **one single round-trip**!

---

## 2. Four Major Architectural Advantages of PTC

```text
┌────────────────────────────────────────────────────────────────────────┐
│                         Core Benefits of PTC Mode                      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Round-Trip Collapse : 5~10 serial round-trips ──> Collapsed to 1    │
│ 2. Context Window Preservation : In-memory filtering, zero token flood │
│ 3. Control Flow Power : Native for / while / Promise.all concurrency   │
│ 4. Type-Driven Reasoning : d.ts types are natural for code models      │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Round-Trip Collapse**: 80%+ latency reduction by eliminating LLM waiting cycles;
2. **Context Window Preservation**: Massive intermediate data stays in local memory, returning only `console.log` summaries;
3. **Control Flow Primitives**: Models write native `if-else` branching, `try-catch` error retries, and `Promise.all` concurrency;
4. **Type-Driven Reasoning**: Modern LLMs are pre-trained on codebases and understand `.d.ts` types far better than flat JSON Schemas.

---

## 3. DSH Microkernel Reference Architecture

In DSH, Code Mode is activated through a single presentation plugin:

```yaml
# apps/cli/config/agent-presets/code/agent.cordis.yml
# 1. Mount standard driver tools
- id: tool-fs
  name: '@deepseek-ai/dsh-tool-fs'
- id: tool-bash
  name: '@deepseek-ai/dsh-tool-bash'

# 2. Switch tool presentation to Code Mode
- id: tool-presentation
  name: '@deepseek-ai/dsh-agent-tool-presentation'
  config:
    mode: code
```

- **Zero Driver Rewrite**: Underlying `fs` and `bash` drivers remain untouched;
- **Dynamic SDK Synthesis**: The presentation plugin scans visible tools and synthesizes SDK declarations on the fly.

---

## 4. Pi-Cordis Implementation Proposal

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. New Plugin: packages/plugins/code-mode                   │
│    • Declares inject = ['tools']                            │
│    • Scans ctx.tools.getAllToolDefinitions()                │
│    • Generates virtual: @pi/agent-sdk declarations & runtime│
│    • Registers run_code / execute_script tool for LLMs      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. New Preset: presets/ptc/ (preset.yml + cordis.yml)       │
│    • Composes code-mode, rules-injector, todo-tracker       │
│    • CLI flag support: pnpm pi --profile ptc                │
│    • Interactive TUI switch: /profile ptc                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Lightweight Sandbox Engine: Worker / node:vm             │
│    • Executes TypeScript scripts locally in milliseconds    │
│    • Injects SDK proxy objects                              │
│    • Captures stdout and renders in pi-tui code widgets     │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Preset Specification (`presets/ptc/`)

```yaml
# presets/ptc/preset.yml
name: Programmatic Tool Calling Mode (PTC / Code Mode)
description: All standard tool capabilities exposed via a TypeScript SDK, allowing the model to compose multi-step workflows in one script
order: 6
```

```yaml
# presets/ptc/cordis.yml
- name: '@pi-cordis/plugin-code-mode'
  config:
    timeoutMs: 30000
    allowImports: true
- name: '@pi-cordis/plugin-rules-injector'
- name: '@pi-cordis/plugin-todo-tracker'
- name: '@pi-cordis/plugin-git-guard'
```

---

## Roadmap

1. **Phase 1 (MVP)**: Implement a lightweight TypeScript runner mapping the 7 built-in tools (`read`, `write`, `edit`, `bash`) to `pi.fs.*` and `pi.bash.*`;
2. **Phase 2 (TUI Rich Rendering)**: Provide dedicated `pi-tui` renderers for `run_code` execution cards with live console logs;
3. **Phase 3 (Official Preset Release)**: Ship `presets/ptc/` with seamless `/profile ptc` switching!
