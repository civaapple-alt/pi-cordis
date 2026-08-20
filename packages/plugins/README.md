# plugins/ — Native Cordis Plugin Ecosystem for Pi

English | [中文](README.zh.md)

Native Cordis plugins and profiles for Pi. Every plugin follows the **"Everything is a Plugin"** and **"Registration as Effect"** architecture, providing isolated capabilities, tool registrations, event intercepts, and prompt injections that are 100% reversible via Cordis disposers.

## Plugin Catalog

| Package | Role | Key Tools / Intercepts | `inject` |
|---|---|---|---|
| [`profiles/`](profiles/README.md) | Central profile resolver, YAML loader, and dual-track HMR manager. | Profile switching, `/profile` command | `[]` |
| [`subagent/`](subagent/README.md) | Spawns isolated subagents with separate context scopes. | `subagent` | `["tools"]` |
| [`plan-mode/`](plan-mode/README.md) | Structured planning mode, step tracking, and write-blocking interceptor. | `plan_step` | `["tools"]` |
| [`code-mode/`](code-mode/README.md) | Programmatic Tool Calling (PTC) executing JS/TS with `pi.*` SDK tools. | `run_code` | `["tools"]` |
| [`ask-question/`](ask-question/README.md) | Interactive clarifying questions with selectable options. | `ask_question` | `["tools"]` |
| [`output-truncator/`](output-truncator/README.md) | Automatic truncation for oversized tool outputs (>50KB / >2000 lines). | Event interceptor (`pi/tool-result`) | `[]` |
| [`context-compactor/`](context-compactor/README.md) | Manual and token-threshold context compaction. | `trigger_compact` | `["tools"]` |
| [`tools-manager/`](tools-manager/README.md) | Dynamic tool inspection and runtime enablement/disablement. | `manage_tools` | `["tools"]` |
| [`session-handoff/`](session-handoff/README.md) | Packages session goals and milestones for clean context transitions. | `session_handoff` | `["tools"]` |
| [`git-automation/`](git-automation/README.md) | Conventional Commits generator and issue linker. | `git_smart_commit` | `["tools"]` |
| [`ssh-delegator/`](ssh-delegator/README.md) | Proxies shell commands and file operations to remote SSH/Docker hosts. | `ssh_exec` | `["tools"]` |
| [`safety-gate/`](safety-gate/README.md) | Security guard blocking destructive bash commands and sensitive file writes. | Event interceptor (`pi/tool-call`) | `[]` |
| [`git-guard/`](git-guard/README.md) | Automatic git dirty check on session start and git stash checkpoints. | Event interceptors | `["settings"]` |
| [`todo-tracker/`](todo-tracker/README.md) | In-session task tracking with automatic prompt injection. | `todo_write`, `todo_read` | `["tools"]` |
| [`rules-injector/`](rules-injector/README.md) | Auto-scans and injects `AGENTS.md`, `CLAUDE.md`, `.cursorrules` into prompt. | Prompt transform hook | `["settings"]` |

## Presets & Profiles

Plugins are organized into curated profiles:
- **`default` (Default is Best)**: `safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`.
- **`safe`**: Read-only safety gate with protected file boundaries.
- **`strict`**: Safe profile with strict command enforcement and dirty git check.
- **`plan`**: Interactive plan mode with mutating write blocker.
- **`ptc`**: Programmatic Tool Calling via sandboxed JavaScript execution.
- **`full`**: All 14 native Cordis plugins active simultaneously.
- **`minimal`**: Pure minimalist microkernel with zero extra plugins.
