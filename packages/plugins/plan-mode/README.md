# @pi-cordis/plugin-plan-mode

English | [中文](README.zh.md)

Provides `plan_step`, a structured in-memory plan state machine with Markdown projection under `.picds/plans/`. It supports plan metadata, steps, status updates, session-scoped views, interactive review, and optional walkthrough generation.

Mutating file tools are blocked while the plan is unapproved. The standard `plan` Profile also mounts read-only Safety Gate coverage for shell mutations. Approval requires an actual Pi UI selection; a headless model call cannot self-approve. Approval emits `pi/profile-switch` to `default` or `ptc`.

Plan and index writes fail visibly if persistence fails. `finish` refuses empty or incomplete plans and records the supplied verification plan without claiming that tests ran. Walkthrough content remains caller-supplied, not independently verified.

This is workflow control, not an operating-system permission boundary. A user can explicitly leave Plan mode with `/profile default`.
