# @pi-cordis/profiles

English | [中文](README.zh.md)

Central profile resolver, YAML loader, and dual-track Hot Module Replacement (HMR) manager for the Pi-Cordis plugin ecosystem. It unifies built-in profile declarations, directory-based preset loading (`presets/<name>/preset.yml` and `cordis.yml`), and dynamic runtime switching via the `/profile` command.

## Curated Built-in Profiles

- **`default` (Default is Best)**:
  - `safety-gate`: High-risk command and sensitive file protection.
  - `git-guard`: Git status and stash checkpoint tracking.
  - `rules-injector`: Auto-scanning of repository instructions.
  - `todo-tracker`: Live checklist management and prompt injection.
  - `output-truncator`: Oversized tool output protection.
- **`safe`**: Read-only safety gate with file write interception.
- **`strict`**: Safe profile with strict command blocking and uncommitted git checks.
- **`plan`**: Interactive plan mode with mutating write blocker.
- **`ptc`**: Programmatic Tool Calling (PTC) with sandboxed JavaScript execution.
- **`full`**: All 14 native Cordis plugins active simultaneously.
- **`minimal`**: Pure minimalist microkernel with zero extra plugins.

## Dual-Track HMR (Hot Module Replacement)

1. **Preset Track (YAML)**:
   - Watches `presets/**/preset.yml` and `cordis.yml`.
   - On change: Disposes active forks cleanly and mounts newly declared plugins without restarting the process.
2. **Plugin Track (TS/JS Code)**:
   - Watches `packages/plugins/*/src/**/*.ts`.
   - On change: Dynamic re-import via timestamped URLs and atomic Cordis context rebound.

## Interactive Command Extension

Exports `createProfileCommandExtension(ctx)` which registers the `/profile` command in the Pi TUI/CLI:
- `/profile`: Opens an interactive selector to choose from all available profiles.
- `/profile <name>`: Instantly switches the active profile and displays the loaded plugin roster.
