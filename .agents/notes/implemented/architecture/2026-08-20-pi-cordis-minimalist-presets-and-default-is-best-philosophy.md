# Agent Note: Pi-Cordis Minimalist Design Philosophy and "Default is Best" Preset Simplification

Status: implemented
Created: 2026-08-20

Boundary update (2026-08-21): this note records the first preset simplification milestone. Its treatment of Plan as a Profile has been superseded by [Plan State and Profile Boundary](2026-08-21-pi-cordis-plan-state-and-profile-boundary.md): the current Profiles are `default` and `ptc`, while Plan is stable per-session state entered with `/plan` or `--plan`.

English | [中文](2026-08-20-pi-cordis-minimalist-presets-and-default-is-best-philosophy.zh.md)

## Executive Summary

This Architecture Decision Record (ADR) addresses the **over-engineering and fragmented technical permutations** in `pi-cordis`'s initial preset system, establishing the core tenets of **Minimalist Design Philosophy** and **"Default is Best"**.

This decision deprecated the 5 cluttered internal permutations (`default`, `safe`, `strict`, `full`, `minimal`). The current boundary keeps **2 execution Profiles (`default` and `ptc`) plus Plan as orthogonal per-session collaboration state**, eliminating user cognitive burden while preserving Pi's lightweight product soul.

---

## 1. Context & Problem Statement: The Flaws of Fragmented Permutations

The previous design fell into the trap of **"permutations based on internal implementation switches"** rather than **"user-facing agent modes"**:

```text
[Four Flaws of the Initial Preset Set]
1. safe vs. full Overlap : Both enabled all 4 plugins, creating user confusion with zero distinct value.
2. default Omitted Safety : The default mode inexplicably omitted safety-gate, leaving standard runs unprotected against destructive commands.
3. strict Arbitrarily Pruned Tools : The read-only audit mode unnecessarily excluded todo-tracker.
4. 4 Plugins Forced into 5 Presets : Artificial permutations lacking true persona identity.
```

---

## 2. Two Core Tenets of Pi-Cordis Minimalist Philosophy

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   Pi-Cordis Minimalist Design Tenets                   │
├────────────────────────────────────────────────────────────────────────┤
│ Tenet 1: Default is Best                                               │
│ • Out of the box, the default mode is the most capable, secure, and    │
│   polished experience.                                                 │
│ • Running pnpm pi requires zero configuration to enjoy full safety.   │
├────────────────────────────────────────────────────────────────────────┤
│ Tenet 2: Presets Represent Distinct Agent Modes, Not Micro-Toggles     │
│ • A preset is not a collection of internal feature flags.              │
│ • Each preset represents a fundamental shift in cognitive role,        │
│   permissions, and interaction patterns (Agent Mode / Persona).        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Simplification: Two Profiles, One Orthogonal Plan State

```text
[Before: 5 Artificial Permutations]               [After: 2 Profiles + Plan state]
  ├── default (Missing safety-gate?) ───┐
  ├── safe (All 4 plugins)          ────┼───> 🌟 Profile: default (Out-of-the-box safe & complete)
  ├── full (All 4 plugins, dup safe) ───┘
  ├── strict (Read-only without todo?) ─────> 🛡️ State: Plan (read-only planning in either Profile)
  └── minimal (Arbitrary empty mode?)  ─────> ⚡ Profile: ptc (Programmatic Tool Calling)
```

---

### 1. 🌟 `default` (Standard Coding Mode)
- **Positioning**: **Default is Best**. The definitive choice for 95% of daily engineering tasks;
- **Capabilities**:
  - High-risk command and protected file interception (`safety-gate`);
  - Project rules and prompt guidelines auto-injection (`rules-injector`);
  - Todo list and task tracking (`todo-tracker`);
  - Git dirty status warning and automatic checkpoints (`git-guard`).
- **UX**: Run `pnpm pi` directly with zero arguments for full assistance and maximum safety.

---

### 2. 🛡️ Plan (Read-Only Planning & Review State)
- **Positioning**: Per-session guardrail state for complex refactorings, architecture exploration, and proposal design; it is not a security sandbox or Profile;
- **Capabilities**:
  - Blocks file mutation tools and non-allowlisted Shell commands through the stable root-scoped Plan plugin;
  - Uses `exit_plan_mode` for explicit interactive approval, without changing Profile;
  - Keeps the same session state across `default` and `ptc`.
- **Entry**: `/plan` in TUI or `picds --plan` in CLI; `/plan off` explicitly exits.

---

### 3. ⚡ `ptc` (Programmatic Tool Calling / Code Mode)
- **Positioning**: Dedicated **programmatic execution mode** for batch data operations and multi-step tasks;
- **Capabilities**:
  - Inherits all baseline capabilities from `default`;
  - Exposes tools via a TypeScript SDK (`@pi-cordis/plugin-code-mode`), allowing the model to collapse 5~10 round-trips into 1 local execution.
- **Switching**: `/profile ptc` in TUI or `pnpm pi --profile ptc` in CLI.

---

## 4. Consequences and Architectural Value

1. **Zero Cognitive Burden**: Eliminates user confusion over micro-differences between `safe`, `full`, and `default`;
2. **Comprehensive Security**: Closes the security loophole where the initial `default` mode ran without `safety-gate`;
3. **Pure & Minimalist Architecture**: Replaces artificial combinations with 3 purpose-built, high-leverage agent personas, honoring Pi's minimalist, developer-first heritage.
