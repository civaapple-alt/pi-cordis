# presets/ — Canonical Pi-Cordis Profiles

English | [中文](README.zh.md)

Pi-Cordis keeps two profiles whose capability presentation is materially different. Each directory contains display metadata in `preset.yml` and an ordered Cordis plugin list in `cordis.yml`.

| Profile | Composition | Purpose |
|---|---|---|
| `default` | `safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`, `ask-question`, `btw`, `terminal-notifier` | Daily development with a small set of verified controls. |
| `ptc` | `code-mode`, `safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`, `ask-question` | Programmatic batching through `run_code`. |

Start with `pnpm picds` or `pnpm picds --profile ptc`. Plan is independent session state: use `pnpm picds --plan`, `/plan`, and `/plan off`; it survives `/profile default` and `/profile ptc` switches.

Project configuration prefers `<cwd>/.picds/` and falls back to `<cwd>/.pi/` only when `.picds/` is absent. User configuration lives under `~/.picds/agent/`. Unknown profiles and unknown plugin names fail explicitly.

PTC uses a Worker for timeout and failure isolation. It is not a permission sandbox: generated code runs with the Picds process user's authority. The safety gate remains a defense-in-depth guardrail for calls made through the `pi.*` tool SDK.

Private prototype packages (`subagent`, `ssh-delegator`, and `context-compactor`) are intentionally absent from all profiles.
