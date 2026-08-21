# @pi-cordis/profiles

English | [中文](README.zh.md)

Profile resolver, YAML loader, runtime switcher, and development HMR manager for Pi-Cordis.

The built-in profiles are deliberately small:

- `default`: eight verified daily-development plugins;
- `plan`: read-only planning and review controls;
- `ptc`: Programmatic Tool Calling with a timeout-isolated Worker. It is not a permission sandbox.

`applyProfile()` owns the exact Cordis Fibers it mounts. A switch disposes those Fibers before mounting the next profile, so tools, commands, listeners, timers, and filters registered as Cordis effects are reversible. Unknown profiles and plugin names fail explicitly.

Profile discovery prefers `.picds` project configuration and uses `.pi` only as a compatibility fallback. Development HMR serializes reloads and disposes its watchers and timers with the owning Fiber.

The `/profile` command lists or switches the available profiles. See the repository `presets/` directory for their exact compositions.
