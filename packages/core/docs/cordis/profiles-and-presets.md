# Profiles, Presets & YAML Composition

English | [中文](profiles-and-presets.zh.md)

Following the "Default is Best" minimalist philosophy, Pi-Cordis delivers 3 canonical out-of-the-box presets and supports declarative plugin composition and hot module reloading (HMR) via `cordis.yml`.

---

## 1. The 3 Canonical Presets

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        3 Canonical Agent Presets                       │
├────────────────────────────────────────────────────────────────────────┤
│ 🌟 1. default (Standard Dev)  : Out-of-the-box safe, rich UX, complete │
│ 🛡️ 2. plan (Planning/Review)  : Strict read-only, step state machine   │
│ ⚡ 3. ptc (Code Mode)         : TypeScript SDK + 1-round batch execute │
└────────────────────────────────────────────────────────────────────────┘
```

| Preset | Configuration | Purpose & Active Plugins |
|---|---|---|
| **`default`** | `presets/default/cordis.yml` | **Default is Best**. Everyday coding, activating `safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`, `ask-question`, `subagent`, `context-compactor`, etc. |
| **`plan`** | `presets/plan/cordis.yml` | Architecture planning, review, and audit. Activates `plan-mode` and `safety-gate: { readOnly: true }` to block all mutations. |
| **`ptc`** | `presets/ptc/cordis.yml` | Programmatic Tool Calling. Activates `code-mode` to expose a dynamic `.d.ts` SDK while masking granular single-step tools. |

---

## 2. Declarative `cordis.yml` Syntax

Define `cordis.yml` in your project root or under `presets/<name>/`:

```yaml
plugins:
  "@pi-cordis/plugin-safety-gate":
    readOnly: false
    blockedCommands:
      - "rm -rf /"
      - "mkfs"

  "@pi-cordis/plugin-todo-tracker":
    maxActiveTasks: 5

  "@pi-cordis/plugin-rules-injector":
    scanClaudeRules: true
    scanAgentRules: true
```

---

## 3. CLI & Runtime Preset Switching

```bash
# Launch with a specific preset
pnpm picds --profile plan
pnpm picds --profile ptc

# Live switching in the terminal without restarting
/profile plan
/profile ptc
/profile default
```
