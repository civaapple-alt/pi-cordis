# Pi-Cordis

Pi-Cordis is a thin, plugin-oriented Cordis control plane for the Pi terminal coding agent. It keeps Pi's TUI, agent loop, model adapters, session behavior, and core tools as the data plane, then adds reversible policy and composition seams around them.

[中文](README.zh.md) · [Architecture notes](.agents/notes/README.md) · [Plugin guide](packages/plugins/README.md)

## Position in the ecosystem

```text
Pi-Cordis profiles and plugins     scenario policy and composition
Pi-Cordis Cordis control plane     lifecycle, events, tool visibility, interception
Pi Coding Agent                    TUI, prompts, sessions, coding-agent loop
Pi Agent Core                      model adapters and tool execution primitives
```

- **Pi** remains the product data plane. Pi-Cordis does not fork or reimplement its terminal UI or agent loop.
- **Cordis** supplies the IoC container, scoped fibers, typed events, and reversible effects. Pi-Cordis consumes the official public [`@deepseek-ai/cordis`](https://www.npmjs.com/package/@deepseek-ai/cordis) package directly.
- **DeepSeek Harness (DSH)** is an architectural influence, not a runtime dependency. Pi-Cordis adopts capability seams, explicit injection, scoped composition, and reversible side effects without importing the DSH application stack.

This boundary is deliberate: Pi-Cordis is useful when a Pi user needs runtime policy and scenario composition, but does not need a second agent kernel.

## Design rules

1. **Keep the data plane upstream.** Model I/O, the coding loop, TUI rendering, and built-in tools stay in Pi.
2. **Registrations are reversible effects.** Tools, commands, filters, prompts, and listeners return disposers and are owned by Cordis fibers.
3. **Profiles alter capability surfaces, not product identity.** Switching a profile disposes its exact fibers and synchronizes the tools visible to Pi.
4. **Security interception is serial.** Tool calls, including calls made inside PTC, pass through the same Cordis safety pipeline.
5. **Do not report simulated work as success.** Unimplemented Subagent, SSH, and Compaction prototypes are private and absent from publishable profiles.
6. **Design from the review moment.** Complete artifacts stay readable before approval, cancellation stops the workflow, dangerous mutations require visible confirmation, and failures or degraded execution remain explicit.

## Profiles and Plan state

### `default`

The default Profile keeps Pi's ordinary tool presentation and mounts eight verified enhancements: `safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`, `ask-question`, `btw`, and `terminal-notifier`.

### `ptc`

The PTC Profile adds `code-mode` and presents raw tools through the generated `pi` SDK and `run_code`. Its Worker provides timeout and failure isolation, not a permission sandbox; nested calls still cross Cordis interception.

### Plan

Plan is per-session collaboration state, not a Profile. The stable root-scoped `plan-mode` plugin contributes `/plan`, `/plan <request>`, `/plan off`, and `exit_plan_mode` in both Profiles. `/plan <request>` enters Plan and immediately submits that text under its read-only policy. Entering or leaving Plan does not remount plugins or change the tool schema. While active, Plan guidance and mutation guardrails apply equally to ordinary and PTC tool calls.
## Quick start from source

Requirements: Node.js 22.19 or newer and pnpm.

```bash
pnpm install
pnpm picds
pnpm picds --plan
pnpm picds --profile ptc
```

The command names are `picds` and `picordis`; the project never claims `pi` on `PATH`. User data lives under `~/.picds/agent/`. Pi-Cordis control-plane files (Profiles and spill output) use `.picds/`, with `.pi/` fallback only where explicitly documented. Pi-owned project resources such as prompt templates continue to follow Pi's upstream locations.

## Package and plugin status

The publishable graph contains thirteen capability plugins plus `@pi-cordis/profiles` and `@pi-cordis/core`. Each publishable package emits ESM JavaScript and declaration files into `dist/`, declares explicit exports, and passes `publint`.

Private prototypes are kept out of the release dependency graph:

- `plugin-subagent`: session allocation existed, but no agent driver executed the delegated task.
- `plugin-ssh-delegator`: returned simulated output instead of creating an SSH transport.
- `plugin-context-compactor`: emitted an event without connecting to Pi's native compaction operation.

They must not become public again until they have a real driver, failure semantics, lifecycle tests, and end-to-end verification.

## Development and release gates

```bash
pnpm run check       # strict TypeScript validation
pnpm test            # unit and integration tests
pnpm run build       # ESM + declaration artifacts for all workspaces
pnpm run publint     # validate packed package entry points
pnpm run pack:check  # install all tarballs in a clean temp project and run the CLI
pnpm release:check   # all gates above
```

CI runs `release:check` on Ubuntu, Windows, and macOS with Node 22.19. A release is not considered cross-platform verified until that matrix passes.

## Repository layout

```text
presets/                 default and ptc capability compositions
packages/core/           Cordis services, Pi bridge, and picds CLI
packages/plugins/        native Cordis plugin workspaces
.agents/notes/           active architectural decisions and history
.github/workflows/       cross-platform release gate
```

The service API documentation is under [packages/core/docs/cordis/services](packages/core/docs/cordis/services/README.md).

## Current maturity

The repository has a reproducible package pipeline and verified local Windows tarball installation. Interactive real-model TUI behavior and the three-platform CI matrix remain release evidence, not assumptions; consult the latest CI run before publishing.

License: [MIT](LICENSE)
