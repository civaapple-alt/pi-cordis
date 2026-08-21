# @pi-cordis/core

English | [中文](README.zh.md)

The Pi-Cordis control plane, Cordis service seams, Pi extension bridge, and `picds` / `picordis` CLI.

The CLI boots Cordis first, mounts the active Profile, and then delegates the actual terminal coding-agent loop to `@earendil-works/pi-coding-agent`. Core does not copy or replace Pi's TUI, model transport, sessions, or built-in tool implementations.

## Service seams

- `ctx.settings`: project and user setting access;
- `ctx.auth`: credential facade and update events;
- `ctx.ai`: Pi `ModelRuntime` and reversible provider registrations;
- `ctx.tools`: built-in/custom tool definitions, visibility filters, and serial execution interception;
- `ctx.session`: persistent and in-memory `SessionManager` factories;
- `ctx.skills`: skill discovery and dynamic registrations;
- `ctx.prompts`: prompt discovery and dynamic registrations;
- `ctx.extensions`: Pi extension discovery plus command/tool/event bridge;
- `ctx.packageManager`: wrapper around Pi's `DefaultPackageManager`;
- `ctx.agent`: SDK-side `AgentSession` creation and event bridging. The interactive CLI remains driven by upstream Pi `main()`.

All dynamic registrations must return Cordis-owned disposers. Tool-result listeners may replace `event.result`; that replacement is propagated back to Pi.

## CLI isolation

- Binaries: `picds`, `picordis`; no `pi` binary is registered.
- User directory: `~/.picds/agent/`.
- Pi-Cordis control-plane project files: `.picds/`, with `.pi/` compatibility only where documented. Pi-owned resources retain upstream Pi paths.

## Package verification

The npm package contains compiled ESM and declaration files under `dist/`. From the repository root:

```bash
pnpm run build
pnpm --filter @pi-cordis/core run publint
pnpm run pack:check
```

Detailed contracts are in [docs/cordis/services](docs/cordis/services/README.md).
