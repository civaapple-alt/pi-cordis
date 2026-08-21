# AGENTS.md

Pi-Cordis is a thin Cordis control plane over Pi: Pi owns the terminal UI, agent loop, model adapters, sessions, and built-in tools; Pi-Cordis adds reversible, composable capabilities as Cordis plugins. **Everything added here is a scoped plugin or effect.**

## Read only as deep as needed

1. Start with this file for repository-wide boundaries.
2. Read [Product Boundary and Production Gates](.agents/notes/implemented/architecture/2026-08-21-pi-cordis-product-boundary-and-production-gates.md) before changing architecture, capability claims, security wording, or release behavior.
3. For a core service, open the [Core Services index](packages/core/docs/cordis/services/README.md), then only the service page being changed.
4. For a plugin or preset, read its local `README.md`, manifest/YAML, and nearest tests.
5. Use the [Agent Notes index](.agents/notes/README.md) when the reason or historical trade-off is not clear. Archived notes are frozen snapshots.

Before changing `packages/` or `presets/`, follow the relevant path above; do not load the entire documentation tree by default.

## Architectural boundaries

```text
Presets and plugins
  -> @pi-cordis/core (Cordis control plane)
    -> @earendil-works/pi-coding-agent
      -> @earendil-works/pi-agent-core
```

- Consume `@deepseek-ai/cordis`, `@deepseek-ai/cosmokit`, `@deepseek-ai/schemastery`, and `@earendil-works/pi-*` directly from npm. Never clone or vendor upstream sources.
- DSH is an architectural influence, not a runtime dependency or source tree.
- Never instantiate upstream agents directly in business logic. Use `ctx.agent` for SDK-side orchestration and `createPiContext()`/the extension bridge for the interactive Pi runtime.
- Dynamic tools, skills, prompts, providers, listeners, timers, and commands are effects. Register through `ctx.effect()`/`ctx.on()` and return a `Disposer` wherever a registration API is exposed.
- Declare dependencies explicitly: plugins export `inject`; services use `static inject` and `static provide` as appropriate. Cordis injection boundaries are not optional.
- Use `ctx.extend()` for child scopes. Profile changes must dispose the exact mounted Fibers and synchronize visible tools.
- Describe capabilities truthfully: `subagent`, `ssh-delegator`, and `context-compactor` are private prototypes. PTC Workers provide timeout/failure isolation, not a permission sandbox; `safety-gate` is a guardrail, not a sandbox.

## Repository map

```text
packages/core/       Microkernel, 10 service seams, Pi bridge, and picds CLI
packages/plugins/    Native Cordis capability plugins and private prototypes
presets/             default and ptc capability compositions
.agents/notes/       Active decisions under implemented/; frozen history under archived/
```

Published project packages use `@pi-cordis/*`. Executables are `picds` and `picordis`; never register `pi`. Global control-plane data lives under `~/.picds/agent/`; project control-plane data prefers `<cwd>/.picds/`. Only use `<cwd>/.pi/` where fallback behavior is explicitly documented, and leave Pi-owned resources on upstream paths.

## Change routing

| Change or symptom | Start here |
| --- | --- |
| Tool registration, execution hooks, or LLM visibility | [ToolRegistryService](packages/core/docs/cordis/services/tool-registry-service.md), [ExtensionService](packages/core/docs/cordis/services/extension-service.md), then the [bridge ADR](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-bidirectional-tool-bridge-and-interactive-ui.zh.md) |
| Profile composition, switching, masking, or HMR | [Profiles plugin](packages/plugins/profiles/README.md), affected `presets/*`, and their tests |
| TUI commands, prompts, selections, or confirmations | [ExtensionService](packages/core/docs/cordis/services/extension-service.md); use `cmdCtx.ui` or `execContext.ctx.ui`, never injected `ctx.ui` |
| Service lifecycle, events, or injection failures | [Core Services index](packages/core/docs/cordis/services/README.md), the exact service page, and [typed events](packages/core/src/core/cordis/types.ts) |
| Package, clean-checkout, or release behavior | Root [package.json](package.json), [package smoke test](scripts/package-smoke.mjs), and [CI workflow](.github/workflows/ci.yml) |

Follow links from these indexes instead of duplicating their contracts here.

## Implementation rules

- ESM everywhere. Use workspace package names across packages and explicit `.ts` extensions for local relative imports.
- Extend Cordis events through declaration merging in `packages/core/src/core/cordis/types.ts`.
- Convert Windows paths for dynamic imports with `pathToFileURL(path).href`; handle symlink `EPERM` with a safe Junction fallback where needed.
- Preserve Fiber ownership and clean up listeners, timers, tools, and other registrations during disposal.
- New services and plugins need tests for lifecycle, event propagation, and disposer cleanup.
- Non-trivial architecture changes, refactors, and new plugins require an Agent Note under `.agents/notes/implemented/` in the same PR.
- Update the closest README/service contract and `CHANGELOG.md` when observable behavior or public contracts change. Do not duplicate detailed contracts in this file.
- Keep TypeScript strict, add concise JSDoc to public function-like exports, and end text files with one newline.

## Fast diagnostics

- **Custom tools are invisible:** ensure the CLI does not pass a hard-coded `--tools`; inspect `ExtensionService.createBridgeExtensionFactory()` and `syncActiveTools()`.
- **Interactive tools do not open UI:** read UI from `cmdCtx.ui` or `execContext.ctx.ui`; headless execution must fail or fall back explicitly, never invent an answer.
- **Old tools remain after profile switching:** inspect transactional `applyProfile`, exact Fiber disposers, and the final `syncActiveTools()` call.
- **`cannot get property ... without inject`:** add the dependency to the plugin's exported `inject` or the service's `static inject`; do not bypass the proxy.
- **Works locally but fails from a packed install:** run the release gate and check for undeclared workspace or prebuilt-`dist` assumptions.

## Commands and completion gates

```sh
pnpm install                 # Node >= 22.19
pnpm run check               # strict TypeScript check
pnpm test                    # unit and integration tests
pnpm release:check           # clean-install, pack, and runtime release gate
pnpm picds                   # default profile
pnpm picds --plan            # default profile with per-session Plan active
pnpm picds --profile ptc     # programmatic tool-calling profile
```

Use `pnpm` to update explicit upstream semver ranges, then run `pnpm run check && pnpm test`; run `pnpm release:check` for dependency, package, CLI, preset, or release-path changes.

Real-API runs may read `DEEPSEEK_API_KEY`, optional `DEEPSEEK_BASE_URL`, and the root `.env`. Never commit credentials, generated runtime state, or spill/session artifacts.
