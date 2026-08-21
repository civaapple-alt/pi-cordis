# @pi-cordis/profiles

English | [中文](README.zh.md)

Profile resolver, YAML loader, runtime switcher, and development HMR manager for Pi-Cordis.

The built-in profiles are deliberately small and describe capability presentation, not collaboration state:

- `default`: eight verified daily-development plugins;
- `ptc`: Programmatic Tool Calling with a timeout-isolated Worker. It is not a permission sandbox.

Plan is a stable per-session control mounted by `@pi-cordis/core`, outside Profile Fibers. Use `/plan` or `picds --plan`; approval through `exit_plan_mode` leaves the active Profile unchanged.

`applyProfile()` owns the exact Cordis Fibers it mounts. A switch validates and mounts the replacement before disposing the exact old Fibers; a failed replacement is rolled back while the active Profile remains intact. Tools, commands, listeners, timers, and filters registered as Cordis effects are therefore reversible. Unknown profiles and plugin names fail explicitly.

Profile discovery prefers `.picds` project configuration and uses `.pi` only as a compatibility fallback. Development HMR serializes reloads and disposes its watchers and timers with the owning Fiber.

The `/profile` command lists or switches capability profiles. See the repository `presets/` directory for their exact compositions.
