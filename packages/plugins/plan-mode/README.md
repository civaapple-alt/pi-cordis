# @pi-cordis/plugin-plan-mode

English | [中文](README.zh.md)

Plan is per-session collaboration state, not a Profile. `@pi-cordis/core` mounts this plugin once outside the switchable Profile scope, so `/profile default` and `/profile ptc` do not destroy Plan state or change its tool schema.

The plugin contributes two controls:

- `/plan` enters Plan mode; `/plan off` leaves it by explicit user action;
- `exit_plan_mode({ plan })` presents a complete Markdown plan for interactive review and leaves Plan mode only after approval.

`exit_plan_mode` remains registered while Plan mode is inactive. This keeps the model-facing schema stable; calling it while inactive fails explicitly. Plan authoring does not duplicate execution tracking: use the plan argument for the review artifact, then use `todo_write` only during implementation.

While active, the plugin injects concise planning guidance and blocks file mutation tools plus Shell commands that are not allowlisted as read-only. Calls made through PTC still cross this gate. This is a mistake-prevention guardrail, not a permission sandbox, and custom tools may require their own policy.

Mode state is isolated by the Pi session ID supplied through `ExtensionService` and lasts for the current Picds process. The plugin does not write `.picds/plans/` artifacts or generate caller-authored Walkthrough claims.
