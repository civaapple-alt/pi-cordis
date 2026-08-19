# Agent Note: Pi-Cordis Native Cordis Plugins and Profile Presets

Status: implemented
Created: 2026-08-19

English | [中文](2026-08-19-pi-cordis-native-plugins-and-profiles.zh.md)

## Executive Summary

This Architecture Decision Record (ADR) documents the design and implementation of **Native Cordis Plugins** and the **Profile Preset System** in `pi-cordis`:
1. **Dedicated Plugin Workspace (`packages/plugins/*`)**: Adopting a modular monorepo layout where every plugin lives as an autonomous subpackage;
2. **Four Native Cordis Plugins**:
   - `@pi-cordis/plugin-safety-gate`: Intercepts high-risk shell commands and sensitive file modifications;
   - `@pi-cordis/plugin-git-guard`: Provides workspace dirty warnings and automatic git checkpoints;
   - `@pi-cordis/plugin-todo-tracker`: Provides `todo_write`/`todo_read` tools and active task prompt injection;
   - `@pi-cordis/plugin-rules-injector`: Auto-discovers project rules (`AGENTS.md`, `.claude/rules/*.md`, `.cursorrules`) and injects them into system prompts;
3. **Profile Composition Hub (`@pi-cordis/profiles`)**: Delivers `default`, `safe`, `strict`, `full`, and `minimal` out-of-the-box presets.

---

## Directory Layout

```text
packages/plugins/
├── safety-gate/              # @pi-cordis/plugin-safety-gate
│   ├── package.json
│   └── src/index.ts          # High-risk command and path interceptor
├── git-guard/                # @pi-cordis/plugin-git-guard
│   ├── package.json
│   └── src/index.ts          # Git checkpoints and status guard
├── todo-tracker/             # @pi-cordis/plugin-todo-tracker
│   ├── package.json
│   └── src/index.ts          # Task management tools and prompt injection
├── rules-injector/           # @pi-cordis/plugin-rules-injector
│   ├── package.json
│   └── src/index.ts          # Project rules discovery and injection
└── profiles/                 # @pi-cordis/profiles
    ├── package.json
    └── src/index.ts          # Preset profile matrix and dynamic assembler
```

---

## Built-in Profile Matrix

| Profile | Target Scenario | Active Plugin Combination |
| :--- | :--- | :--- |
| **`default`** | Daily standard development | `rules-injector` + `todo-tracker` |
| **`safe`** | Safe production development | `safety-gate` + `git-guard` + `rules-injector` + `todo-tracker` |
| **`strict`** | Strict read-only environment | `safety-gate` (read-only) + `git-guard` + `rules-injector` |
| **`full`** | Power user mode | All 4 native plugins active |
| **`minimal`** | Raw lightweight mode | Zero extra plugins |

---

## Usage

### Programmatic Context Bootstrap
```typescript
import { createPiContext } from "@earendil-works/pi-coding-agent";

// Bootstrap using built-in preset
const ctx = await createPiContext({ profile: "safe" });

// Bootstrap with custom plugin config overrides
const customCtx = await createPiContext({
  profile: "default",
  plugins: {
    "safety-gate": { protectedPaths: [".env", "config/secrets.json"] },
  },
});
```

---

## Benefits

1. **High Cohesion & Decoupling**: Each plugin operates as an independent workspace package with clear boundaries;
2. **Flexible Composition**: Switch effortlessly between lightweight speed and full-fledged protection via Profiles;
3. **Native Cordis Advantages**: Full static type safety, explicit dependency injection (`inject = [...]`), and clean lifecycle disposal.
