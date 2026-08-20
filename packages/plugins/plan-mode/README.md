# @pi-cordis/plugin-plan-mode

English | [中文](README.zh.md)

Native Cordis structured planning mode plugin. It registers the `plan_step` tool with dependency tracking, blocks mutating file tools during the planning phase, calculates visual progress bars, and injects the live implementation plan into the system prompt.

## Tool

### `plan_step`

Accepts:
- `action` (`"add"` | `"update"` | `"list"` | `"finish"`, required): Plan manipulation action.
- `id` (number, optional): Target step ID for updates.
- `title` (string, optional): Step title or description.
- `status` (`"pending"` | `"in_progress"` | `"completed"` | `"failed"`, optional): Current step status.
- `dependsOn` (number[], optional): List of prerequisite step IDs.
- `notes` (string, optional): Additional rationale or design notes.

Returns:
- `totalSteps` (number): Total step count.
- `progress` (string): Formatted ASCII progress bar (e.g. `[████░░░░░░] 40%`).
- `percentage` (number): Numeric progress percentage.
- `steps` (array): Full step items with statuses and dependencies.

## Mutating Interceptor
While plan mode is active (`isPlanModeActive === true`), any mutating tool calls (`write`, `edit`, `patch`, `apply_patch`) are intercepted and blocked with a clear instruction to finalize the plan before making changes. Calling `plan_step({ action: "finish" })` exits plan mode and emits the `pi/plan-completed` event.

## Model Experience
- **Prompt Token Effect**: Retains dynamic plan markdown with visual status badges (`✓`, `▶`, `⏳`, `✗`) in the system prompt.
- **Safety**: Guarantees read-only planning before code modification begins.
