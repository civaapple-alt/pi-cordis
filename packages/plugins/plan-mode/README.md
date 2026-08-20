# @pi-cordis/plugin-plan-mode

English | [中文](README.zh.md)

Native Cordis structured planning mode plugin. It registers the `plan_step` tool, intercepts and blocks mutating file tools during the planning phase, and injects the live step-by-step implementation plan into the system prompt.

## Tool

### `plan_step`

Accepts:
- `action` (`"add"` | `"update"` | `"list"` | `"finish"`, required): Plan manipulation action.
- `id` (number, optional): Target step ID for updates.
- `title` (string, optional): Step title or description.
- `status` (`"pending"` | `"in_progress"` | `"completed"` | `"failed"`, optional): Current step status.
- `notes` (string, optional): Additional rationale or design notes.

## Mutating Interceptor
While plan mode is active (`isPlanModeActive === true`), any mutating tool calls (`write`, `edit`, `patch`, `apply_patch`) are intercepted and blocked with a clear instruction to finalize the plan before making changes.

## Prompt Injection
Injects current implementation plan steps with status icons into the prompt transform pipeline on every agent turn.

## Model Experience
- **Prompt Token Effect**: Retains dynamic plan markdown in system prompt until plan completion.
- **Safety**: Guarantees read-only planning before code modification begins.
