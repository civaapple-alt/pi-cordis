# @pi-cordis/profiles

English | [中文](README.zh.md)

Profile resolver, YAML loader, runtime switcher, and development HMR manager for Pi-Cordis.

The built-in profiles are deliberately small and describe capability presentation, not collaboration state:

- `default`: eight verified daily-development plugins;
- `ptc`: Programmatic Tool Calling with a timeout-isolated Worker. It is not a permission sandbox.

Plan is a stable per-session control mounted by `@pi-cordis/core`, outside Profile Fibers. Use `/plan` or `picds --plan`; approval through `exit_plan_mode` leaves the active Profile unchanged.

`applyProfile()` owns the exact Cordis Fibers it mounts. A switch validates and mounts the replacement before disposing the exact old Fibers; a failed replacement is rolled back while the active Profile remains intact. Disposal failures are surfaced as an aggregate error instead of being swallowed, because stale effects may require a restart. Tools, commands, listeners, timers, and filters registered as Cordis effects are therefore observable and reversible. Unknown profiles and plugin names fail explicitly.

Profile discovery prefers `.picds` project configuration and uses `.pi` only as a compatibility fallback. Development HMR serializes reloads, follows the active Profile after slash-command switches, and reports fork-disposal failures while disposing its watchers and timers with the owning Fiber.

The `/profile` command marks the current Profile in its selector. A successful switch reports `previous → current`, added plugins, removed plugins, and the complete active plugin set. See the repository `presets/` directory for exact compositions.
