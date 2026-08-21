# Pi-Cordis plugins

Native plugins extend the Pi data plane through Cordis services. Every registration must be fiber-owned and reversible.

## Published packages

| Plugin | Injected services | Status |
| --- | --- | --- |
| `ask-question` | `tools` | Interactive Pi TUI question tool with non-interactive fallback. |
| `btw` | `extensions`, `ai` | Ephemeral one-turn question command. |
| `code-mode` | `tools` | Worker-based PTC; nested tool calls pass through Cordis interception. |
| `git-automation` | `tools` | Conventional Commit message formatter from explicit inputs; it does not commit. |
| `git-guard` | `settings`, `tools` | Lightweight `git stash create` checkpoints. |
| `output-truncator` | `settings` | Recursive text truncation and `.picds/spill` persistence. |
| `plan-mode` | `tools`, `settings` | Plan state, review flow, and read-only write blocking. |
| `profiles` | `extensions`, `settings`, `tools` | Built-in profile composition and development HMR. |
| `rules-injector` | `settings` | Project-rule discovery and prompt injection. |
| `safety-gate` | none | Serial destructive-command and protected-path interception. |
| `session-handoff` | `tools` | Structured handoff envelope generation and event emission. |
| `terminal-notifier` | none | OSC 777 notification on questions and Pi turn completion. |
| `todo-tracker` | `tools` | Four-state todo graph with cycle validation. |
| `tools-manager` | `tools` | Runtime model-facing tool visibility filter. |

## Private prototypes

`subagent`, `ssh-delegator`, and `context-compactor` are private workspaces. Their previous implementations did not execute the work implied by their names, so they are excluded from `@pi-cordis/profiles` and the publication graph.

## Profiles

- `default`: eight verified daily-development enhancements.
- `plan`: read-only planning and review controls.
- `ptc`: programmatic tool calling with the same safety pipeline.
- `minimal`: internal/testing escape hatch with no native capability plugins.

See the [root README](../../README.md) for the exact composition and release gates.
