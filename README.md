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
3. **Ecosystem Compatible**: Fully supports the [`pi.dev/packages`](https://pi.dev/packages) community marketplace. Install extensions via `npm:`, `git:`, or local paths out of the box.
4. **Strict Isolation**: 100% standalone. Zero dependencies on proprietary DSH plugins.

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
| **Extension Marketplace** | ✅ | ✅ | 100% compatible with `pi.dev/packages` via transparent `ExtensionAPI` event bridging |
| **Zero DSH Business Plugins** | N/A | ✅ | Self-contained, vendored Cordis framework under `vendor/` |

---

## 🏗️ Architecture & Control Plane

Pi-Cordis adopts the **Strangler Fig Pattern**, separating the **Cordis Control Plane** from the **Pi Data & Algorithmic Plane**:

```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │         Cordis Microkernel Control Plane (packages/.../src/core/cordis)│
  │  Context Container / static provide / Lifecycle Events / DI / IoC      │
  └──────────────────┬──────────────────────────────────┬──────────────────┘
                     │                                  │
      ┌──────────────▼─────────────┐      ┌─────────────▼──────────────┐
      │  Service Plugin Adapters   │      │  ExtensionAPI Bridge       │
      │  (Settings, AI, Tools...)  │      │  (pi.on <-> ctx.on)        │
      └──────────────┬─────────────┘      └─────────────┬──────────────┘
                     │                                  │
  ┌──────────────────▼──────────────────────────────────▼──────────────────┐
  │         Pi Underlying Data & Algorithmic Plane (packages/*)            │
  │  LLM Token Streams / Agent State Tree / SQLite / Double-Buffer TUI     │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Cordis Service Matrix

All core subsystems are mounted onto the Cordis `Context` via typed Declaration Merging:

| Service | Accessor | Responsibility |
| :--- | :--- | :--- |
| `SettingsService` | `ctx.settings` | User (`~/.pi/agent/settings.json`) & project (`.pi/settings.json`) configuration with schema validation |
| `AuthService` | `ctx.auth` | API keys, OAuth tokens, and credential storage |
| `AIService` | `ctx.ai` | Model catalog (1307+ models), token tracking, and streaming completion runtime |
| `ToolRegistryService` | `ctx.tools` | Registry for the 4 core + 3 optional tools and dynamically registered extension tools |
| `SessionService` | `ctx.session` | SQLite and in-memory session persistence, conversation branch trees, and export |
| `SkillsService` | `ctx.skills` | Automatic scanning, parsing, and execution of skill directories |
| `PromptsService` | `ctx.prompts` | Prompt template loading and variable interpolation |
| `ExtensionService` | `ctx.extensions` | Loads Pi extensions and transparently bridges `ExtensionAPI` to the Cordis event bus |
| `PackageManagerService` | `ctx.packageManager` | Cross-source package management (`pi.dev`, npm, git, local paths) |
| `AgentService` | `ctx.agent` | Multi-turn reasoning loop orchestration and context assembly |

---

## 🔌 Plugin & Extension Ecosystem

Pi-Cordis supports dual-track plugin authoring:

### 1. Pi Community Extensions (`ExtensionAPI`)
Write standard Pi extensions without worrying about Cordis internals:
```typescript
export default function(pi) {
  pi.registerTool({
    name: "my_tool",
    description: "Custom tool",
    parameters: { type: "object", properties: { query: { type: "string" } } },
    execute: async ({ query }) => `Result for: ${query}`,
  });
}
```

### 2. Cordis Microkernel Plugins (`Context`)
Advanced developers can write pure Cordis plugins leveraging full IoC and event interception:
```typescript
import { Context } from "@deepseek-ai/cordis";

export default function(ctx: Context) {
  ctx.on("pi/tool-call", async ({ name, args }) => {
    console.log(`Tool invoked: ${name}`);
  });
}
```

---

## 📂 Repository Structure

```text
pi-cordis/
├── vendor/                           # Vendored Cordis v4.0.1 framework suite
│   ├── cordis/                       # Core IoC container
│   ├── cosmokit/                     # Foundation utilities
│   └── schemastery/                  # Schema validation
├── packages/                         # Monorepo workspaces
│   └── coding-agent/                 # Main CLI, TUI, and Cordis integration
│       └── src/core/cordis/          # Microkernel bootstrap and 10 core services
├── .agents/notes/                    # Architecture Decision Records (ADRs)
├── AGENTS.md                         # Contributor and AI coding guidelines
├── CHANGELOG.md                      # Detailed release changelog (Chinese)
└── README.md                         # Project documentation
```

---

## 🧪 Quality Gates & Testing

Pi-Cordis maintains comprehensive test coverage across all subpackages:

```bash
# Run all workspace unit tests
pnpm test

# Run microkernel bootstrap tests
npx vitest run packages/coding-agent/test/cordis-bootstrap.test.ts

# Run type checks across monorepo
pnpm run check
```

---

## 📚 Architecture Decision Records (ADRs)

Deep-dive architectural decisions are documented in [`.agents/notes/`](.agents/notes/README.md):

- [Pi-Cordis: Microkernel Architecture on Cordis v4.0.1](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-microkernel-architecture.md)
- [Pi-Cordis: Services Matrix and Extension Ecosystem Integration](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-services-and-plugin-ecosystem.md)
- [Pi-Cordis: TUI, UI Plugins, and Control Plane Refactoring Trade-offs](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-tui-and-control-plane-tradeoffs.md)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Portions derived from [`earendil-works/pi`](https://github.com/earendil-works/pi) under MIT License.
Microkernel components vendored from Cordis under MIT License.
