# @pi-cordis/plugin-session-handoff

English | [中文](README.zh.md)

Native Cordis session transition and handoff plugin. It registers the `session_handoff` tool to package goals, accomplishments, and next steps, facilitating smooth handoffs into a fresh, clean session context.

## Tool

### `session_handoff`

Accepts:
- `newGoal` (string, required): Primary objective of the upcoming session.
- `accomplishments` (string[], optional): Milestones completed in the current session.
- `nextSteps` (string[], required): Immediate next action items for the new session.
- `criticalFiles` (string[], optional): Essential file paths relevant to the new goal.

Returns:
- `success` (boolean): Handoff packaging status.
- `message` (string): Confirmation message.
- `handoff` (object): Structured handoff payload including timestamps and next steps.

## Event Broadcasting
Emits `pi/handoff` with the packaged structured payload to allow session storage, UI notification, or automated session spawns.

## Model Experience
- **Smooth Workflow Continuity**: Summarizes complex multi-turn sessions before starting a new topic.
- **Noise Elimination**: Leaves behind stale exploratory context while preserving critical findings.
