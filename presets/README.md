# presets/ — Agent Capability Presets & Profile Configurations

English | [中文](README.zh.md)

The `presets/` directory contains all scenario-driven Agent Mode configurations for **Pi-Cordis**. In accordance with the **"Default is Best" Minimalist Philosophy**, the system consolidates internal plugin permutations into **3 canonical, high-leverage scenario presets**.

Each preset is a dedicated directory containing two declarative YAML configuration files:
1. **`preset.yml`**: Display name, description, and UI ordering metadata;
2. **`cordis.yml`**: The list of native Cordis plugins and validated configs mounted upon activation.

---

## The 3 Canonical Presets

| Preset Key | Display Name | Directory | Active Plugins & Capabilities | Best For |
|---|---|---|---|---|
| **`default`** | Standard Coding Mode (Default is Best) | [`presets/default/`](default/) | `safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`, `ask-question`, `context-compactor`, `subagent`, `git-automation`, `session-handoff`, `ssh-delegator`, `tools-manager` | **Default is Best**. Out-of-the-box standard engineering mode with full safety, task tracking, rules injection, and multi-agent delegation. |
| **`plan`** | Planning & Audit Mode (Plan / Review) | [`presets/plan/`](plan/) | `plan-mode`, `safety-gate` (`readOnly: true`), `rules-injector`, `todo-tracker`, `output-truncator`, `ask-question`, `context-compactor` | Complex refactoring, architecture exploration, and proposal design. Mutating tools are strictly intercepted until plans are approved. |
| **`ptc`** | Programmatic Tool Calling (PTC / Code Mode) | [`presets/ptc/`](ptc/) | `code-mode` (`worker_threads`), `safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`, `context-compactor` | Batch operations and complex data filtering. Exposes tools via a strong-typed TypeScript SDK, collapsing multi-turn workflows into 1 local execution. |

---

## How to Switch Presets

- **CLI Flag**: `pnpm pi --profile plan` or `pnpm pi --profile ptc`
- **Interactive TUI**: Type `/profile plan` or `/profile ptc` in the terminal prompt.
- **Default Startup**: `pnpm pi` (automatically loads `default` with full capabilities and zero configuration).

---

## Adding Custom Presets

To add a custom preset, create a new subfolder in `presets/<name>/` (or `.pi/presets/<name>/` / `~/.pi/presets/<name>/`):

1. **`preset.yml`**:
   ```yaml
   name: Reviewer Mode
   description: Specialized preset for code quality and architectural review
   order: 4
   ```

2. **`cordis.yml`**:
   ```yaml
   - name: '@pi-cordis/plugin-safety-gate'
     config:
       readOnly: true
   - name: '@pi-cordis/plugin-rules-injector'
   ```
