<div align="center">

# 🥧 Pi-Cordis

**The Developer-First Terminal Coding Agent, Rebuilt on the Cordis (v4.0.1) Microkernel with an "Everything is a Plugin" Architecture.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Cordis: v4.0.1](https://img.shields.io/badge/Cordis-v4.0.1-brightgreen.svg?style=flat-square)](vendor/)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict_Mode-blue.svg?style=flat-square)](tsconfig.json)
[![Tests: 3500+ Passing](https://img.shields.io/badge/Tests-3500+_Passing-success.svg?style=flat-square)](packages/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/civaapple-alt/pi-cordis/pulls)

[English](README.md) | [中文说明](README.zh.md) | [Architecture Notes](.agents/notes/README.md) | [Contributing Guide](AGENTS.md)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start)
- [Core Feature Matrix](#-core-feature-matrix)
- [Native Cordis Plugins & Presets Matrix](#-native-cordis-plugins--presets-matrix)
- [Interactive TUI /profile Slash Command](#-interactive-tui-profile-slash-command)
- [Architecture & Control Plane](#-architecture--control-plane)
- [Cordis Service Matrix](#-cordis-service-matrix)
- [Plugin & Extension Ecosystem](#-plugin--extension-ecosystem)
- [Repository Structure](#-repository-structure)
- [Quality Gates & Testing](#-quality-gates--testing)
- [Architecture Decision Records (ADRs)](#-architecture-decision-records-adrs)
- [License](#-license)

---

## 🌟 Overview

**Pi-Cordis** combines the raw speed, distraction-free terminal user interface (TUI), and coding power of [`earendil-works/pi`](https://github.com/earendil-works/pi) with the modular **Inversion-of-Control (IoC) microkernel** of **Cordis v4.0.1**.

### Why Pi-Cordis?

1. **100% Pi Parity**: Retains the complete interactive full-screen TUI, diff view, session branching tree, and prompt templates with zero user-facing regressions.
2. **"Everything is a Plugin"**: All 10 core capabilities (settings, auth, AI runtime, tool registry, session persistence, skills, prompt templates, extension runner, package manager, and agent inference loop) are decoupled into first-class Cordis services.
3. **Native Plugin Workspace & Standalone Presets**: Modular `packages/plugins/*` packages with declarative `presets/<name>/` directories (each with `preset.yml` and `cordis.yml`) for instant zero-code profile additions.
4. **Live TUI Switching (`/profile`)**: Switch safety levels and capability bundles on the fly during active sessions.
5. **Ecosystem Compatible**: Fully supports the [`pi.dev/packages`](https://pi.dev/packages) community marketplace. Install extensions via `npm:`, `git:`, or local paths out of the box.
6. **Strict Isolation**: 100% standalone. Zero dependencies on proprietary DSH plugins.

---

## ⚡ Quick Start

### 1. Prerequisites

- **Node.js**: `>= 20.0.0`
- **pnpm**: `>= 9.0.0`

### 2. Clone and Install

```bash
git clone https://github.com/civaapple-alt/pi-cordis.git
cd pi-cordis
pnpm install
```

### 3. Configure API Key

Set your preferred LLM provider in your environment or root `.env`:

```env
# DeepSeek (Recommended)
DEEPSEEK_API_KEY=sk-your-deepseek-api-key

# Or OpenAI / Anthropic / Gemini / Ollama
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-your-anthropic-api-key
```

### 4. Launch

```bash
# Launch interactive full-screen TUI
pnpm pi

# Switch profiles live in TUI via slash commands
/profile safe
/profile full

# Or run a single task non-interactively (print mode)
pnpm pi -p "Inspect the repository and list the 10 Cordis core services"

# Install a real community plugin from the ecosystem
pnpm pi install npm:@juicesharp/rpiv-todo
```

---

## 🎯 Core Feature Matrix

| Capability | Native Pi | Pi-Cordis | Highlights |
| :--- | :---: | :---: | :--- |
| **Interactive Terminal TUI** | ✅ | ✅ | Full-screen canvas, double-buffered diffs, branching tree selector, status dashboard |
| **Core Coding Tools** | ✅ | ✅ | Built-in `read`, `write`, `edit`, `bash` + optional `grep`, `find`, `ls` |
| **Multi-Model Support** | ✅ | ✅ | 1307+ models indexed (DeepSeek, OpenAI, Anthropic, Gemini, Ollama, Bedrock, etc.) |
| **Microkernel IoC Architecture** | ❌ | ✅ | Reversible lifecycle effects (`ctx.effect`), service auto-injection (`static provide`) |
| **Native Cordis Plugins** | ❌ | ✅ | Modular packages under `packages/plugins/*` (Safety Gate, Git Guard, Todo, Rules) |
| **Standalone Presets Directory** | ❌ | ✅ | Declarative YAML presets under `presets/<name>/` (`preset.yml` + `cordis.yml`) |
| **Interactive `/profile` Switch** | ❌ | ✅ | Live TUI profile switching with Tab autocompletions and interactive dropdowns |
| **Extension Marketplace** | ✅ | ✅ | 100% compatible with `pi.dev/packages` via transparent `ExtensionAPI` event bridging |
| **Zero DSH Business Plugins** | N/A | ✅ | Self-contained, vendored Cordis framework under `vendor/` |

---

## 🧩 Native Cordis Plugins & Presets Matrix

### 1. Four Native Cordis Plugins (`packages/plugins/*`)

- 🔒 **`@pi-cordis/plugin-safety-gate`**: Blocks destructive shell commands (`rm -rf /`, `mkfs`) and sensitive file modifications (`.env`, `.git/`, `id_rsa`).
- 🛡️ **`@pi-cordis/plugin-git-guard`**: Detects dirty repository state and creates automatic `git stash` checkpoints before critical actions.
- 📋 **`@pi-cordis/plugin-todo-tracker`**: Registers `todo_write`/`todo_read` tools and dynamically injects active tasks into system prompts.
- 📜 **`@pi-cordis/plugin-rules-injector`**: Auto-scans `AGENTS.md`, `.claude/rules/*.md`, `.cursorrules` and injects them into agent context.

### 2. Five Built-in Profile Presets (`presets/`)

```text
presets/
├── default/    # Rules injector + Todo tracker
├── safe/       # Safety gate + Git guard + Rules injector + Todo tracker
├── strict/     # Read-only safety gate + Git guard + Rules injector
├── full/       # All 4 native Cordis plugins active
└── minimal/    # Zero extra plugins, pure 10-service microkernel
```

---

## 🕹️ Interactive TUI `/profile` Slash Command

During active interactive sessions in `pnpm pi`, use `/profile` to inspect and switch presets:

```text
/profile safe       ── Switch to Safe Engineering mode immediately
/profile full       ── Switch to Full Power-User mode
/profile default    ── Switch to Default mode
/profile minimal    ── Switch to Minimal mode
```

Typing `/profile` with no arguments opens an interactive dropdown menu:
```text
┌─ Select Cordis Profile ────────────────────────────────────────────────────────┐
│ > default - Standard coding agent with rule injection and todo task tracking  │
│   safe    - Safe engineering mode with destructive action blocking & git stash│
│   strict  - Strict security mode with read-only inspection & dangerous block   │
│   full    - Power user mode with all native Cordis plugins activated           │
│   minimal - Zero extra plugins for raw, lightweight execution                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏛️ Architecture & Control Plane

Pi-Cordis adopts the **Strangler Fig Pattern**, wrapping Pi's core runtime with the Cordis IoC microkernel:

```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │                 Cordis Microkernel Control Plane (v4.0.1)             │
  │     Context Container / static provide / Event Bus / Plugin Loader     │
  └──────────────────┬──────────────────────────────────┬──────────────────┘
                     │                                  │
      ┌──────────────▼─────────────┐      ┌─────────────▼──────────────┐
      │  Service Adapters Layer    │      │  ExtensionAPI Event Bridge │
      │  (Settings, AI, Tools...)  │      │  (pi.on <-> ctx.on)        │
      └──────────────┬─────────────┘      └─────────────┬──────────────┘
                     │                                  │
  ┌──────────────────▼──────────────────────────────────▼──────────────────┐
  │                        Pi Underlying Data Plane                        │
  │      LLM Stream Processing / Session Branching / TUI Canvas Engine     │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 🎛️ Cordis Service Matrix

| Service | Context Property | Responsibility |
| :--- | :--- | :--- |
| `SettingsService` | `ctx.settings` | User global (`~/.pi/agent/settings.json`) and project local (`.pi/settings.json`) configuration |
| `AuthService` | `ctx.auth` | API keys, OAuth tokens, and credential storage |
| `AIService` | `ctx.ai` | Multi-model runtime with 1307+ model definitions and token usage telemetry |
| `ToolRegistryService` | `ctx.tools` | Unified registry for 7 built-in coding tools and dynamic custom tools |
| `SessionService` | `ctx.session` | SQLite and in-memory session persistence, branching tree switcher |
| `SkillsService` | `ctx.skills` | Auto-discovery and parsing of prompt and directory skills |
| `PromptsService` | `ctx.prompts` | Prompt template engine and parameter interpolation |
| `ExtensionService` | `ctx.extensions` | Pi extension loader bridging `ExtensionAPI` to Cordis events |
| `PackageManagerService` | `ctx.packageManager` | Cross-source package management (`pi.dev`, npm, git, local) |
| `AgentService` | `ctx.agent` | Multi-turn agent inference cycle orchestration |

---

## 📂 Repository Structure

```text
pi-cordis/
├── vendor/                           # Vendored Cordis (v4.0.1) core framework
│   ├── cordis/                       # @deepseek-ai/cordis
│   ├── cosmokit/                     # @deepseek-ai/cosmokit
│   └── schemastery/                  # @deepseek-ai/schemastery
│
├── presets/                          # 🌟 Standalone Agent Presets & Profiles Directory
│   ├── default/                      # preset.yml + cordis.yml
│   ├── safe/                         # preset.yml + cordis.yml
│   ├── strict/                       # preset.yml + cordis.yml
│   ├── full/                         # preset.yml + cordis.yml
│   └── minimal/                      # preset.yml + cordis.yml
│
├── packages/
│   ├── coding-agent/                 # CLI entry point, TUI terminal, and Cordis bootstrap
│   │   └── src/core/cordis/          # 10 core services + createPiContext + profile command
│   └── plugins/                      # 🌟 Native Cordis Plugin Packages
│       ├── safety-gate/              # @pi-cordis/plugin-safety-gate
│       ├── git-guard/                # @pi-cordis/plugin-git-guard
│       ├── todo-tracker/             # @pi-cordis/plugin-todo-tracker
│       ├── rules-injector/           # @pi-cordis/plugin-rules-injector
│       └── profiles/                 # @pi-cordis/profiles (YAML & directory assembler)
│
├── .agents/notes/                    # Architecture Decision Records (ADRs)
│   ├── implemented/architecture/     # Technical architecture notes
│   ├── implemented/simplification/   # Decoupling and cleanup notes
│   └── README.md                     # Bilingual ADR index
│
├── CHANGELOG.md                      # Keep a Changelog updates
├── pnpm-workspace.yaml               # pnpm workspace configuration
└── tsconfig.json                     # TypeScript path aliases
```

---

## 🧪 Quality Gates & Testing

```bash
# Run unit tests across all Cordis services, plugins, and profiles
npx vitest run packages/coding-agent/test/cordis-plugins-and-profiles.test.ts packages/coding-agent/test/cordis-bootstrap.test.ts

# TypeScript typechecking
pnpm run check

# Launch interactive terminal
pnpm pi
```

---

## 📝 Architecture Decision Records (ADRs)

| Date | Title | Focus |
| :--- | :--- | :--- |
| `2026-08-19` | [Pi-Cordis Microkernel Architecture](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-microkernel-architecture.md) | "Everything is a plugin" philosophy, Vendored Cordis v4.0.1, 100% Pi parity |
| `2026-08-19` | [Services and Plugin Ecosystem](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-services-and-plugin-ecosystem.md) | 10 Cordis core services, `pi.dev` marketplace, `ExtensionAPI` event bridge |
| `2026-08-19` | [TUI and Control Plane Trade-offs](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-tui-and-control-plane-tradeoffs.md) | Control plane costs, TUI silent boot, UI plugin constraints, 7-slot TUI evolution |
| `2026-08-19` | [Repository Simplification and Decoupling](.agents/notes/implemented/simplification/2026-08-19-pi-cordis-repository-simplification.md) | Cleaned 1200+ duplicate files, direct upstream npm packages, 85%+ size reduction |
| `2026-08-19` | [Pi AgentHarness Specification Integration](.agents/notes/implemented/architecture/2026-08-19-pi-agent-harness-specification-and-cordis-integration.md) | Three Stores model, Effect Sandwich crash safety, Lanes concurrency |
| `2026-08-19` | [Native Cordis Plugins & Presets Directory](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-native-plugins-and-profiles.md) | Modular `packages/plugins/*`, declarative `presets/<name>/` directory layout, `/profile` TUI command |

---

## 📄 License

[MIT](LICENSE) © 2026 civaapple-alt & Earendil Works.
