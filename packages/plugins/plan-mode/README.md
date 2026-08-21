# @pi-cordis/plugin-plan-mode

English | [中文](README.zh.md)

Plan is per-session collaboration state, not a Profile. `@pi-cordis/core` mounts this plugin once outside the switchable Profile scope, so `/profile default` and `/profile ptc` do not destroy Plan state or change its tool schema.

The plugin contributes two controls:

- `/plan` enters Plan mode, `/plan <request>` enters and submits the request as the next user turn, and `/plan off` leaves it by explicit user action;
- `exit_plan_mode({ plan })` presents a complete Markdown plan for interactive review and leaves Plan mode only after approval.

## User journey contract

| User action | Expected result |
| --- | --- |
| `/plan` or `/plan on` | Enter Plan without starting an agent turn. |
| `/plan continue the migration plan` | Enter Plan first, then submit the original text under Plan policy. |
| `/plan <request>` while the agent is busy | Activate the mutation guard immediately and deliver the request as a steering message. |
| `/plan off` | Leave Plan without submitting `off` as a prompt. |
| Message submission fails | Restore the previous Plan state and expose the failure; never report a half-success. |
| `exit_plan_mode` proposes a plan | Show the complete artifact, make edits visible, and require explicit approval of the exact submitted revision. |

`exit_plan_mode` remains registered while Plan mode is inactive. This keeps the model-facing schema stable; calling it while inactive fails explicitly. Plan authoring does not duplicate execution tracking: use the plan argument for the review artifact, then use `todo_write` only during implementation.

In Pi's interactive TUI, the tool call renders the complete Markdown plan instead of only its first heading. Before approval, a scrollable multi-line preview opens with the full plan, followed by a separate explicit decision selector. Cancelling keeps Plan active. Editing the preview is treated as review feedback and requires the revised plan to be submitted again, so an altered artifact is never approved implicitly. UI providers without the multi-line editor receive the complete plan in the selector prompt.

While active, the plugin injects concise planning guidance and blocks file mutation tools plus Shell commands that are not allowlisted as read-only. Compound Shell commands are checked segment by segment, so navigation plus inspection such as `cd ... && git status && git log` works while a safe prefix cannot conceal an unknown suffix. Calls made through PTC still cross this gate. This is a mistake-prevention guardrail, not a permission sandbox, and custom tools may require their own policy.

Mode state is isolated by the Pi session ID supplied through `ExtensionService` and lasts for the current Picds process. The plugin does not write `.picds/plans/` artifacts or generate caller-authored Walkthrough claims.
