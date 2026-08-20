<div align="center">

# 🥧 Pi-Cordis

**The Developer-First Terminal Coding Agent, Rebuilt on the Cordis (v4.0.1) Microkernel with an "Everything is a Plugin" Architecture.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Cordis: v4.0.1](https://img.shields.io/badge/Cordis-v4.0.1-brightgreen.svg?style=flat-square)](vendor/)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict_Mode-blue.svg?style=flat-square)](tsconfig.json)
[![Tests: 32 Passing](https://img.shields.io/badge/Tests-32_Passing-success.svg?style=flat-square)](packages/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/civaapple-alt/pi-cordis/pulls)

[English](README.md) | [中文说明](README.zh.md) | [Architecture Notes](.agents/notes/README.md) | [Contributing Guide](AGENTS.md)

</div>

---

## 📖 Progressive Table of Contents

- [Level 1: Quick Start & Essential Overview](#-level-1-quick-start--essential-overview)
  - [Overview & Why Pi-Cordis](#overview)
  - [Quick Start](#quick-start)
  - [Core Feature Matrix](#core-feature-matrix)
- [Level 2: The 3 Canonical Presets (Default is Best)](#-level-2-the-3-canonical-presets-default-is-best)
  - [1. Standard Coding Mode (`default`)](#1-standard-coding-mode-default)
  - [2. Planning & Audit Mode (`plan`)](#2-planning--audit-mode-plan)
  - [3. Programmatic Tool Calling (`ptc`)](#3-programmatic-tool-calling-ptc)
- [Level 3: Core Architecture & The 5 Pillars](#-level-3-core-architecture--the-5-pillars)
  - [The 5 Pillars of DSH Architecture](#the-5-pillars-of-dsh-architecture)
  - [10 Native Cordis Core Services](#10-native-cordis-core-services)
  - [15 Built-in Plugins Workspace](#15-built-in-plugins-workspace)
  - [Dual-Track HMR & 7-Slot TUI Bridge](#dual-track-hmr--7-slot-tui-bridge)
- [Level 4: Repository Layout, Gates & ADR Index](#-level-4-repository-layout-gates--adr-index)
  - [Repository Structure](#repository-structure)
  - [Quality Gates & Testing](#quality-gates--testing)
  - [Architecture Decision Records (ADRs)](#architecture-decision-records-adrs)

---

## 🚀 Level 1: Quick Start & Essential Overview

### Overview
**Pi-Cordis** fuses the raw speed, distraction-free terminal user interface (TUI), and coding power of [`earendil-works/pi`](https://github.com/earendil-works/pi) with the modular **Inversion-of-Control (IoC) microkernel** of **Cordis v4.0.1**.

1. **100% Pi Parity**: Retains the full-screen interactive TUI, diff viewer, session branching tree, and prompt templates with zero regressions;
2. **"Everything is a Plugin"**: All 10 core capabilities are decoupled into reactive Cordis services;
3. **"Default is Best" Philosophy**: Out of the box, standard runs activate destructive command interception, git checkpoints, prompt rules injection, and task tracking with zero manual configuration;
4. **PTC (Programmatic Tool Calling / Code Mode)**: Collapses 5~10 multi-turn network round-trips into a single local TypeScript execution in an isolated Node.js Worker thread;
5. **Ecosystem Compatible**: Fully supports the [`pi.dev/packages`](https://pi.dev/packages) community marketplace.

### Quick Start

```bash
# 1. Clone and install
git clone https://github.com/civaapple-alt/pi-cordis.git
cd pi-cordis
pnpm install

# 2. Configure API Key in .env
echo "DEEPSEEK_API_KEY=sk-your-key" > .env

# 3. Launch interactive terminal (Default is Best: full capabilities & safety)
pnpm pi

# 4. Switch presets live in terminal
/profile plan
/profile ptc
```

### Core Feature Matrix

| Capability | Native Pi | Pi-Cordis | Highlights |
| :--- | :---: | :---: | :--- |
| **Interactive Terminal TUI** | ✅ | ✅ | Full-screen Canvas, double-buffered Diff, session tree, status widgets |
| **Core Coding Tools** | ✅ | ✅ | Built-in `read`, `write`, `edit`, `bash` + `grep`, `find`, `ls` |
| **Multi-Model Runtime** | ✅ | ✅ | 1307+ models (DeepSeek, OpenAI, Anthropic, Gemini, Ollama, etc.) |
| **Microkernel IoC Engine** | ❌ | ✅ | Reversible effect collection (`ctx.effect`), service injection (`static provide`) |
| **Explicit `inject` Sandboxing** | ❌ | ✅ | `inject = ['tools']` access control, dependency graph resolution |
| **Reversible Side Effects** | ❌ | ✅ | All registrations return `Disposer`s, eliminating zombie listeners |
| **Dual-Track Layered HMR** | ❌ | ✅ | Fast programmatic core boot + live zero-restart plugin code & preset HMR |
| **3 Scenario-Driven Presets** | ❌ | ✅ | `default` (Default is Best), `plan` (Read-only), `ptc` (Code Mode) |
| **PTC / Code Mode** | ❌ | ✅ | Dynamic `.d.ts` SDK + single `run_code` execution in Worker thread |

---

## 🎯 Level 2: The 3 Canonical Presets (Default is Best)

In accordance with the **"Default is Best" Minimalist Philosophy**, artificial permutations (`safe`, `full`, `strict`, `minimal`) are deprecated in favor of **3 scenario-driven Agent Modes**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        3 Canonical Agent Presets                       │
├────────────────────────────────────────────────────────────────────────┤
│ 🌟 1. default (Standard Dev)  : Out-of-the-box safe, rich UX, complete │
│ 🛡️ 2. plan (Planning/Review)  : Strict read-only, step state machine   │
│ ⚡ 3. ptc (Code Mode)         : TypeScript SDK + 1-round batch execute │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Standard Coding Mode (`default`)
- **Philosophy**: **Default is Best**. The definitive choice for 95% of daily engineering tasks;
- **Active Capabilities**: `safety-gate` (destructive command blocking), `git-guard` (checkpoints), `rules-injector` (auto-scans `AGENTS.md`/`CLAUDE.md`), `todo-tracker` (task state machine), `output-truncator` (spill protection), `ask-question` (disambiguation), `subagent` (delegation), `context-compactor`, `git-automation`, `session-handoff`, `ssh-delegator`, `tools-manager`.
- **Usage**: Run `pnpm pi` directly with zero arguments.

### 2. Planning & Audit Mode (`plan`)
- **Philosophy**: Dedicated **read-only sandbox mode** for complex refactoring, architecture exploration, and proposal design;
- **Active Capabilities**: `plan-mode` (step state machine & progress bar), `safety-gate` (`readOnly: true`), `rules-injector`, `todo-tracker`, `output-truncator`, `ask-question`, `context-compactor`.
- **Usage**: `/profile plan` in TUI or `pnpm pi --profile plan`.

### 3. Programmatic Tool Calling (`ptc`)
- **Philosophy**: Dedicated **programmatic execution mode** for batch file operations and complex data filtering;
- **Active Capabilities**: `code-mode` (dynamic `.d.ts` generation + presentation tool masking + `worker_threads.Worker` sandbox), `safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`, `context-compactor`.
- **Usage**: `/profile ptc` in TUI or `pnpm pi --profile ptc`.

---

## 🏛️ Level 3: Core Architecture & The 5 Pillars

### The 5 Pillars of DSH Architecture
Every service and plugin in Pi-Cordis adheres to:
1. **Capability Seam**: Strong-typed contracts (`types.ts`), decoupled providers (`services/*.ts`), and explicit consumers (`inject = [...]`).
2. **Reversibility & Fiber Teardown**: Dynamic registrations return `this.ctx.effect()` disposers for clean rollback.
3. **Reactive Event Bus**: Fine-grained typed events emitted on the Cordis bus (`pi/settings-updated`, `pi/tool-call`, `pi/session-created`, etc.).
4. **Waterfall & Serial Interception Chains**: Pre/post execution pipelines for security validation and response transformation.
5. **Context Isolation**: Scope branching via `ctx.extend()` for subagents and temporary sandboxes with zero side effects.

### 10 Native Cordis Core Services

Detailed guides available in [`packages/coding-agent/docs/cordis/services/`](packages/coding-agent/docs/cordis/services/README.md):

| Service | Property | Core Responsibility & Event Stream |
| :--- | :--- | :--- |
| **SettingsService** | `ctx.settings` | Global and project settings management; emits `pi/settings-updated`. |
| **AuthService** | `ctx.auth` | Credential and API key storage; emits `pi/auth-updated`. |
| **AIService** | `ctx.ai` | Multi-model runtime (1307+ models) & dynamic provider registry; emits `pi/model-change`. |
| **ToolRegistryService** | `ctx.tools` | 7 built-in tools, dynamic tools, presentation masking, and hooked `executeTool` pipeline. |
| **SessionService** | `ctx.session` | SQLite and in-memory session persistence & active tracking; emits `pi/session-created`/`closed`. |
| **SkillsService** | `ctx.skills` | File-based and dynamic skill discovery; emits `pi/skill-registered`. |
| **PromptsService** | `ctx.prompts` | Prompt template engine and dynamic template registry; emits `pi/prompt-registered`. |
| **ExtensionService** | `ctx.extensions` | Loads Pi extensions and bridges `ExtensionAPI` to Cordis events & 7 TUI slots. |
| **PackageManagerService** | `ctx.packageManager` | Installs extensions from `pi.dev`, npm, git; streams `pi/package-progress`. |
| **AgentService** | `ctx.agent` | Agent multi-turn inference loop orchestration & turn lifecycle events. |

### 15 Built-in Plugins Workspace

All native plugins are located in `packages/plugins/*`:

| Plugin | Package Name | Key Feature |
| :--- | :--- | :--- |
| **`code-mode`** | `@pi-cordis/plugin-code-mode` | PTC mode: dynamic `.d.ts` + `worker_threads` sandbox + tool masking. |
| **`output-truncator`** | `@pi-cordis/plugin-output-truncator` | Head (30) + Tail (20) preservation + `.pi/spill/` persistence. |
| **`safety-gate`** | `@pi-cordis/plugin-safety-gate` | Command AST pattern detection + protected file blacklist + read-only mode. |
| **`git-guard`** | `@pi-cordis/plugin-git-guard` | Dirty repository warning + atomic `git stash create` checkpoints. |
| **`ask-question`** | `@pi-cordis/plugin-ask-question` | Interactive multi-question batching + `(Recommended)` selection UI. |
| **`plan-mode`** | `@pi-cordis/plugin-plan-mode` | Step state machine + progress bar + mutating tool interceptor. |
| **`todo-tracker`** | `@pi-cordis/plugin-todo-tracker` | 4-state task progression + adaptive prompt compression. |
| **`subagent`** | `@pi-cordis/plugin-subagent` | `ctx.extend()` scope isolation + recursion depth limits + structured summaries. |
| **`context-compactor`**| `@pi-cordis/plugin-context-compactor` | 4-dimensional structured retention (files, decisions, fixes, blockers). |
| **`session-handoff`** | `@pi-cordis/plugin-session-handoff` | Standardized Handoff Envelope & Markdown briefings. |
| **`git-automation`** | `@pi-cordis/plugin-git-automation` | Staged diff semantic analysis & Conventional Commits. |
| **`ssh-delegator`** | `@pi-cordis/plugin-ssh-delegator` | Remote SSH tool execution proxy & latency measurement. |
| **`rules-injector`** | `@pi-cordis/plugin-rules-injector` | Hierarchical rules discovery with SHA-256 caching for KV-cache stability. |
| **`tools-manager`** | `@pi-cordis/plugin-tools-manager` | Dynamic capability slicing & tool visibility toggling. |
| **`profiles`** | `@pi-cordis/profiles` | Preset loader, YAML parser & dual-track HMR engine. |

### Dual-Track HMR & 7-Slot TUI Bridge
- **Dual-Track HMR**: Fast programmatic core boot + live zero-restart YAML and plugin code reloading (`pathToFileURL + ?t=timestamp`), preserving conversation history and registers;
- **7-Slot TUI Bridge**: Drives Select modals, Confirm dialogs, Header/Footer banners, Toast notifications, Tool renderers, Message renderers, and Status bar counters.

---

## 📂 Level 4: Repository Layout, Gates & ADR Index

### Repository Structure

```text
pi-cordis/
├── vendor/                           # Vendored Cordis (v4.0.1) framework packages
│   ├── cordis/                       # @deepseek-ai/cordis
│   ├── cosmokit/                     # @deepseek-ai/cosmokit
│   └── schemastery/                  # @deepseek-ai/schemastery
│
├── presets/                          # 🌟 3 Canonical Agent capability presets
│   ├── default/                      # preset.yml + cordis.yml (Default is Best)
│   ├── plan/                         # preset.yml + cordis.yml (Planning / Review)
│   └── ptc/                          # preset.yml + cordis.yml (PTC / Code Mode)
│
├── packages/
│   ├── core/                         # @pi-cordis/core (CLI entrypoint, 10 Cordis services & microkernel bootstrapper)
│   │   ├── docs/cordis/services/     # 10 Core Services detailed documentation
│   │   └── src/core/cordis/          # 10 core services + createPiContext + profile command
│   └── plugins/                      # 🌟 15 Native Cordis plugins workspace
│
├── .agents/notes/                    # Architecture Decision Records (ADRs)
│   ├── implemented/architecture/     # Implemented architectural decisions
│   ├── implemented/simplification/   # Simplification and decoupling decisions
│   ├── archived/architecture/        # Frozen historical snapshots
│   └── README.md                     # ADR index & progressive methodology
│
├── CHANGELOG.md                      # Changelog (Keep a Changelog)
├── pnpm-workspace.yaml               # pnpm workspace configuration
└── tsconfig.json                     # TypeScript unified path aliases
```

### Quality Gates & Testing

```bash
# Run all Cordis core services, native plugins, presets, and HMR test suites
pnpm test

# TypeScript strict typecheck
pnpm run check

# Launch interactive terminal
pnpm picds
```

### Architecture Decision Records (ADRs)

Full ADR index available at [`.agents/notes/README.md`](.agents/notes/README.md):

| Date | Topic & Title | Status |
| :--- | :--- | :--- |
| `2026-08-19` | [Pi-Cordis: Microkernel Architecture Design](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-microkernel-architecture.md) | `implemented` |
| `2026-08-19` | [Pi-Cordis: Service Matrix and Plugin Ecosystem](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-services-and-plugin-ecosystem.md) | `implemented` |
| `2026-08-19` | [Pi-Cordis: TUI, UI Plugins, and Control Plane Trade-offs](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-tui-and-control-plane-tradeoffs.md) | `implemented` |
| `2026-08-19` | [Pi-Cordis: Repository Simplification & Decoupling](.agents/notes/implemented/simplification/2026-08-19-pi-cordis-repository-simplification.md) | `implemented` |
| `2026-08-19` | [Pi-Cordis: Native Plugin Ecosystem Roadmap](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-plugin-ecosystem-roadmap-and-priority.md) | `implemented` |
| `2026-08-20` | [Pi-Cordis: Loader Trade-offs and Dual-Track HMR Architecture](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-loader-and-dual-track-hmr-architecture.md) | `implemented` |
| `2026-08-20` | [Pi-Cordis: Capability Seams, Explicit Injection, and TUI Bridge](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-capability-seams-inject-and-tui-bridge.md) | `implemented` |
| `2026-08-20` | [Pi-Cordis: Reversible Side Effects and Disposer Pattern](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-reversible-side-effects-and-disposer-pattern.md) | `implemented` |
| `2026-08-20` | [Pi-Cordis: Programmatic Tool Calling (PTC / Code Mode) Architecture](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-ptc-code-mode-architecture-proposal.md) | `implemented` |
| `2026-08-20` | [Pi-Cordis: Minimalist Presets and "Default is Best" Philosophy](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-minimalist-presets-and-default-is-best-philosophy.md) | `implemented` |
| `2026-08-20` | [Pi-Cordis: Built-in Plugin Ecosystem Optimal Architecture Blueprint](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-plugin-ecosystem-optimal-architecture-and-roadmap.md) | `implemented` |
| `2026-08-19` | [Pi AgentHarness: Specification & Cordis Integration](.agents/notes/archived/architecture/2026-08-19-pi-agent-harness-specification-and-cordis-integration.md) | `archived` |

---

## 📄 License

[MIT](LICENSE) © 2026 civaapple-alt & Earendil Works.
