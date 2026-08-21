# Pi-Cordis Plan State and Profile Boundary

English | [中文](2026-08-21-pi-cordis-plan-state-and-profile-boundary.zh.md)

Status: implemented

## Decision

Plan is per-session collaboration state, not a Pi-Cordis Profile. `@pi-cordis/core` mounts `plan-mode` once outside the switchable Profile scope. The canonical Profiles are `default` and `ptc`; they select ordinary or programmatic tool presentation while leaving Plan state intact.

This matches the useful boundary in DSH: its shipped presets are `standard`, `code`, `minimal`, and `cordis`; Plan is a scoped state plugin inside the non-minimal agents, not another preset. Pi itself also treats Plan as an optional extension rather than an agent-kernel mode.

| DSH preset | Execution presentation | Plan control |
| --- | --- | --- |
| `standard` | Full coding tools | Included |
| `code` | Standard abilities through Code Mode | Included |
| `minimal` | Persistent Shell + editor only | Excluded |
| `cordis` | Standard plus Cordis inspection/authoring | Included |

Pi-Cordis does not copy all four product personas: `minimal` would weaken the verified default, while DSH's `cordis` authoring persona is outside Pi-Cordis's lightweight control-plane boundary. It retains only the execution distinction that changes tool presentation: `default` and `ptc`.

## Model and user controls

- `/plan` activates Plan for the current Pi session;
- `/plan <request>` activates Plan before submitting the original request as a real Pi user message; when an agent turn is already running, delivery uses Pi's `steer` queue;
- `/plan off` is the explicit user exit;
- `exit_plan_mode({ plan })` remains registered in every state, rejects calls outside Plan, requires a Markdown `#` heading, and exits only after interactive approval;
- interactive TUI review renders the complete plan in the tool row and opens a scrollable full-text preview before the separate approval selector; preview edits require resubmission rather than changing the approved artifact silently;
- approval does not switch Profile;
- `picds --plan` selects initial Plan state without inventing a `plan` Profile.

The tool catalog therefore stays stable when Plan changes. `todo_write` remains the execution tracker after approval; Plan does not duplicate Todo state, write plan artifacts, or generate unverified Walkthrough files.

The command is designed from the observable user journey rather than an argument allowlist. Empty input and the exact `on`/`off` words are controls; every other non-empty string is request content and preserves its original spelling. Activation happens before delivery so the new turn observes Plan policy. If Pi rejects message submission, the plugin restores the previous session state instead of leaving a partially applied transition.

## Enforcement and scope

While Plan is active, prompt policy forbids implementation, file mutation tools are blocked, and every segment of a compound Shell command must match a read-only allowlist. Process-local navigation commands are allowed so real inspection sequences such as `cd ... && git status && git log` remain usable, while a safe first segment cannot hide an unknown suffix. PTC passes its nested SDK calls through the same `ToolRegistryService.executeTool()` pipeline, so inner writes and Shell mutations reach the Plan gate.

This interception is a guardrail, not an operating-system permission sandbox. Unknown or custom tools need their own policy. State is keyed by the live Pi session ID forwarded by `ExtensionService` and lasts for the Picds process; it is not claimed as durable logged state across process restarts.

## Removed design

The former `plan` Profile mounted and disposed `plan-mode`, used `plan_step` as a second task system, wrote `.picds/plans/`, and approved plans by emitting `pi/profile-switch`. That design forced state migration across Fiber disposal and coupled review decisions to tool presentation. Removing that coupling eliminates the source of the earlier Profile-exit and cross-Profile persistence fixes.

## Verification

Regression coverage proves:

- only `default` and `ptc` are canonical Profiles;
- core-only tests and embeddings use `profile: false`, not an implicit `minimal` Profile;
- the removed `plan` name fails with a `/plan` migration message;
- `exit_plan_mode` remains registered across Profile switches;
- Plan prompt state survives `default -> ptc -> default`;
- approval exits Plan without switching Profile;
- approval UI exposes the complete plan before the decision, with a full-text fallback for providers without Pi's multi-line editor;
- `/plan <request>` preserves request text, activates policy before delivery, uses `steer` while busy, does not submit `off`, and rolls state back when delivery fails;
- compound Shell inspection is accepted only when every segment is allowlisted; command substitution and unknown suffixes fail closed;
- ordinary and PTC-nested mutations cross the Plan gate;
- session IDs flow from Pi `ExtensionContext` into Cordis lifecycle envelopes.
