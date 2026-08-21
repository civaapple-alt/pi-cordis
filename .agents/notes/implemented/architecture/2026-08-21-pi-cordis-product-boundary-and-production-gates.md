# Pi-Cordis Product Boundary and Production Gates

English | [中文](2026-08-21-pi-cordis-product-boundary-and-production-gates.zh.md)

Status: implemented

## Decision

Pi-Cordis is positioned as a **thin Cordis control plane over the Pi data plane**.

- Pi continues to own the TUI, agent loop, model adapters, session semantics, and built-in tools;
- Pi-Cordis owns only lifecycle bridging, policy interception, tool visibility, prompt injection, and Profile composition;
- Cordis provides IoC, Fibers, Effects, and the event bus through the public `@deepseek-ai/cordis` npm package;
- DSH is the source of architectural principles such as capability seams, composition across scopes and lifetimes, and reversible side effects, but it is not a Pi-Cordis runtime dependency.

This distinction prevents the project from duplicating either Pi or DSH. It also keeps upstream upgrades as dependency upgrades instead of turning them into source synchronization projects.

## Capability Truthfulness Tiers

### Enabled by Default

`default` composes only eight enhancements that have real execution paths and regression tests: `safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`, `ask-question`, `btw`, and `terminal-notifier`.

The root control plane also mounts `plan-mode` once for every Profile. Plan is inactive by default and contributes a stable `exit_plan_mode` schema plus the user-owned `/plan` command; it is session collaboration state rather than a Profile capability set.

### Enabled by Scenario

- `code-mode` appears only in `ptc`;
- `git-automation`, `session-handoff`, and `tools-manager` remain explicitly optional and do not occupy the default tool surface.

### Private Prototypes

The following packages are marked `private` and removed from both the dependency graph and built-in plugin registry of `@pi-cordis/profiles`:

- `subagent`: previously allocated an in-memory session without running an agent;
- `ssh-delegator`: previously returned simulated stdout without establishing an SSH transport;
- `context-compactor`: previously emitted an event without invoking Pi's native compaction.

They must not be published again until they have a real driver, explicit failure semantics, lifecycle tests, and end-to-end evidence.

## Reversibility and Execution Pipelines

- Tool and command registrations use stack semantics. Disposing a later registration restores the preceding live registration, while out-of-order disposal cannot delete a neighboring Fiber's registration;
- Profiles retain exact Fiber disposers instead of deleting potentially unrelated instances through plugin objects;
- HMR performs one serialized Profile reload per change, and its watchers, timers, and hot-loaded Fibers are cleaned up with the Context;
- `pi/tool-call` uses serial dispatch. Both ordinary tools and PTC-internal tools execute through `ToolRegistryService.executeTool()`;
- Mutated `pi/tool-result` values are returned to Pi, so output truncation is no longer a side-channel no-op;
- The command bridge uses stable proxies. Pi does not currently expose command unregistration, so a catalog entry left after disposal reports itself as unavailable instead of invoking a destroyed handler;
- The Skills, Prompts, Session, and Agent services explicitly distinguish SDK-side catalogs and objects from the interactive Pi runtime. Registrations without an upstream bridge API are no longer described as active in the TUI;
- Provider registration, model selection, and the `pi/session-start` envelope remain consistent across the Cordis-to-Pi bridge. Prompt and result transformations run serially, and policy errors are no longer silently discarded.

## Failure Semantics

- Pattern-based command interception is a guardrail against common mistakes, not a security sandbox for untrusted code. The PTC Worker provides only timeout and failure isolation;
- Without an interactive UI, questions and plan approval return an explicit unavailable result instead of choosing on the user's behalf;
- Profile replacement mounts the candidate first. If mounting fails, only the candidate is disposed and the previous Profile remains active;
- Plan activation never replaces a Profile. Approval exits Plan while preserving the current `default` or `ptc` presentation;
- Credential writes use process-local serialization and atomic replacement, and failures propagate to the caller. The service does not present itself as a multi-process transactional database.

## Production Gates

A release candidate must satisfy all of the following:

1. `pnpm run check`: strict type checking;
2. `pnpm test`: service, bridge, Profile, plugin lifecycle, and safety regressions;
3. `pnpm run build`: generate ESM and `.d.ts` artifacts for every publishable workspace;
4. `pnpm run publint`: validate entries, exports, and types from the packed-package perspective;
5. `pnpm run pack:check`: pack 15 release units, install them into a fresh temporary project, and execute the compiled `picds --version`;
6. GitHub Actions runs `pnpm release:check` on a Node 22.19 matrix covering Ubuntu, Windows, and macOS.

Dependency installation uses the pnpm 11 `allowBuilds` allowlist. Unreviewed dependency scripts must not be bypassed with `dangerouslyAllowAllBuilds`. Only `esbuild`, which is required by the release toolchain, is currently allowed; other discovered nonessential scripts are explicitly denied.

A local pass proves only the current platform. Cross-platform status must be established by the three-platform CI result.

## Falsification Signals

The project must not claim production readiness if any of the following is true:

- The CLI starts only from the source repository or when `tsx` is present;
- Profile switching leaves behind ghost tools, duplicate listeners, or watchers that prevent process exit;
- PTC can bypass the safety gate when invoking a lower-level tool;
- A plugin returns success without performing the external action promised by its name;
- The documented plugin count, default composition, or capabilities differ from the published tarballs;
- `release:check` fails on any supported platform.

## Outcome

Pi-Cordis differentiates itself through a small, verifiable, and reversible Pi policy layer instead of a large built-in plugin inventory. Complex capabilities may continue to evolve as external Cordis plugins, but the default surface and public packages must prioritize truthfulness and reversibility.
