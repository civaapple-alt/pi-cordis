# AGENTS.md

Pi-Cordis is a plugin-based terminal coding agent harness on vendored Cordis: **everything is a plugin**. Read [Architecture Notes](.agents/notes/README.md) before changing `packages/` or `presets/`.

---

## 4-Layer Architecture Stance

Pi-Cordis adheres to a strict 4-layer decoupling model. Never bypass intermediate layers or re-clone upstream sources:

```
Level 4: Presets & Plugins   — presets/* (default, plan, ptc) & packages/plugins/* (15 native plugins)
Level 3: Microkernel Mesh    — packages/core (@pi-cordis/core: 10 Cordis services, EventBus, picds CLI)
Level 2: Coding Agent Spec   — @earendil-works/pi-coding-agent (TUI canvas, prompt templates, agent loop)
Level 1: Generic Agent Core  — @earendil-works/pi-agent-core (LLM adapters, tool execution primitives)
```

---

## Repository layout

```
vendor/      Vendored Cordis microkernel (v4.0.1) source
  cordis/      @deepseek-ai/cordis (IoC container, Fiber lifecycle, EventBus)
  cosmokit/    @deepseek-ai/cosmokit (utility types, collections, time)
  schemastery/ @deepseek-ai/schemastery (schema validation & typing)
presets/     Scenario-driven capability presets (preset.yml + cordis.yml)
  default/     Default is Best standard development mode
  plan/        Strict read-only planning and audit mode
  ptc/         Programmatic Tool Calling (TypeScript SDK + Worker sandbox)
packages/
  core/        @pi-cordis/core: microkernel bootstrapper, 10 Core Services, picds CLI
    docs/        10 Core Services detailed API contracts and guides
    src/         createPiContext, profile-command, 10 Cordis services, types
    test/        Cordis bootstrap and integration test suites
  plugins/     @pi-cordis/plugin-* native Cordis plugin workspaces
    safety-gate/        Destructive command & protected path interception
    git-guard/          Dirty workspace warning & atomic git stash checkpoints
    todo-tracker/       4-state task progression & adaptive prompt compression
    rules-injector/     Automatic project rules discovery & SHA-256 caching
    code-mode/          PTC mode: dynamic .d.ts + Worker thread sandbox
    ask-question/       Interactive multi-question batching & recommended selection
    plan-mode/          Step state machine, progress bar & mutating tool blocker
    output-truncator/   Head/tail preservation & .pi/spill/ overflow persistence
    context-compactor/  4-dimensional structured context retention
    subagent/           Scope-isolated subagent delegation (ctx.extend)
    session-handoff/    Standardized handoff envelope & markdown briefings
    git-automation/     Staged diff semantic analysis & Conventional Commits
    ssh-delegator/      Remote SSH execution proxy & latency measurement
    tools-manager/      Dynamic capability slicing & tool visibility toggling
    profiles/           YAML profile loader, preset composer & dual-track HMR
.agents/     Agent workflows and Architecture Decision Records (notes/)
  notes/       implemented/ (active ADRs), archived/ (frozen snapshots)
CHANGELOG.md Progressively updated changelog (Keep a Changelog)
```

---

## Commands

```sh
pnpm install            # pnpm workspaces, node >=22.19
pnpm test               # vitest unit tests across core and plugins (34 tests)
pnpm run check          # TypeScript strict typecheck (tsc --noEmit)
pnpm picds              # launch interactive terminal (Default is Best mode)
pnpm picds --profile plan # launch in read-only plan mode
pnpm picds --profile ptc  # launch in programmatic tool calling mode
pnpm picordis           # alias command for picds
```

---

## Secrets / .env

Real-API runs read `DEEPSEEK_API_KEY`, optional `DEEPSEEK_BASE_URL`, and root `.env`. Never commit credentials.

---

## Conventions

- **Package Naming**: Every published package is `@pi-cordis/<name>`; vendored microkernel packages are `@deepseek-ai/*` in `vendor/`.
- **Direct Upstream Ingestion**: Upstream `@earendil-works/pi-*` packages (`pi-coding-agent`, `pi-agent-core`, `pi-ai`, `pi-tui`) are consumed directly from npm (`^0.84.2`). Never clone or fork upstream code into `packages/core`.
- **Registrations are Effects**: Every dynamic registration (tools, skills, prompts, providers) goes through `ctx.effect()` / `ctx.on()`; registration methods MUST return a `Disposer` function for clean Fiber teardown.
- **Explicit Dependency Injection (`inject`)**: Plugins declare `export const inject = ['tools', 'settings']`; services declare `static provide = 'serviceName'`.
- **10 Core Services Seams**:
  - `ctx.settings` (`SettingsService`): Global and project settings management; emits `pi/settings-updated`.
  - `ctx.auth` (`AuthService`): Credential and API key storage; emits `pi/auth-updated`.
  - `ctx.ai` (`AIService`): Multi-model runtime (1307+ models) & dynamic provider registry; emits `pi/model-change`.
  - `ctx.tools` (`ToolRegistryService`): 7 built-in tools, dynamic tools, presentation masking, and hooked `executeTool` pipeline.
  - `ctx.session` (`SessionService`): Persistent & in-memory session management; emits `pi/session-created`/`closed`.
  - `ctx.skills` (`SkillsService`): File-based and dynamic skill discovery; emits `pi/skill-registered`.
  - `ctx.prompts` (`PromptsService`): Prompt template engine and dynamic template registry; emits `pi/prompt-registered`.
  - `ctx.extensions` (`ExtensionService`): Loads Pi extensions and bridges `ExtensionAPI` to Cordis events.
  - `ctx.packageManager` (`PackageManagerService`): Installs extensions from `pi.dev`, npm, git; streams `pi/package-progress`.
  - `ctx.agent` (`AgentService`): Agent multi-turn inference loop orchestration & turn lifecycle events.
- **Anti-Bypass Rule**: Never instantiate `new Agent()` or call upstream core classes directly in business logic. Always route through `ctx.agent` or `createPiContext()`.
- **CLI & User Space Isolation**:
  - Executable binaries are `picds` and `picordis`. Never register `pi` to avoid PATH collisions with native Pi installations.
  - Global user configuration lives in `~/.picds/agent/` (`settings.json`, `auth.json`, `sessions/`, `presets/`).
  - Project configuration prioritizes `<cwd>/.picds/` and gracefully falls back to `<cwd>/.pi/`.
- **Typed Events Declaration Merging**: Extend the Cordis event bus via `declare module "@deepseek-ai/cordis" { interface Events { ... } }` in `packages/core/src/core/cordis/types.ts`.
- **ESM Everywhere**: `"type": "module"` across all packages. Use package names across packages and explicit `.ts` in local relative imports.
- **Cross-Platform Defensiveness**:
  - Windows file URLs must use `pathToFileURL(p).href` for ESM dynamic imports.
  - Symlink creation on Windows must safely fall back to Junction or catch `EPERM`.
- **Agent Notes Rule**: Non-trivial architectural changes, refactors, or new plugins MUST include an Agent Note under `.agents/notes/implemented/` in the same PR. Archived notes are frozen in `.agents/notes/archived/`.
- **Testing Policy**: All new services and plugins must provide unit tests under `test/` verifying lifecycle, event propagation, and disposer cleanup.

---

## Defensive patterns

1. **Fiber Scope Disposers**: Always clean up listeners, timers, and tool registrations inside returned disposer callbacks.
2. **Context Extension**: Use `ctx.extend()` when creating child fibers or subagents to prevent state leakage to parent contexts.
3. **Graceful Upstream Fallbacks**: When accessing upstream optional properties, use explicit optional chaining and fallback defaults.

---

## Type safety and documentation

- Everything compiles under `strict: true` with `noImplicitAny`.
- Function-like exports include concise JSDoc documenting parameters and return types.
- Code changes must accompany updated README, service documentation in `packages/core/docs/cordis/services/`, and `CHANGELOG.md` records.
- Files end with exactly one trailing newline.

---

## Vendoring policy

`vendor/` packages are pinned source copies (`cordis`, `cosmokit`, `schemastery`). Updates follow upstream releases; re-apply any local modifications and verify via `pnpm test && pnpm run check`.
