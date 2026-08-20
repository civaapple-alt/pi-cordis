# @pi-cordis/plugin-session-handoff

English | [中文](README.zh.md)

Native Cordis session transition and Handoff Envelope plugin. It registers `session_handoff` to package the current goal, accomplishments, next steps, critical files, and blockers into a standardized briefing document and emits `pi/handoff` for a clean transition to a fresh session.

## Tool

### `session_handoff`

Accepts:
- `newGoal` (string, required): The target goal for the new session.
- `nextSteps` (string[], required): Actionable next steps.
- `sessionTitle` (string, optional): Current session title.
- `accomplishments` (string[], optional): Completed milestones.
- `criticalFiles` (string[], optional): File paths relevant to the handoff.
- `blockers` (string[], optional): Active blockers or open questions.

Returns:
- `success` (boolean): Package creation status.
- `message` (string): Informational message.
- `handoff` (HandoffEnvelope): Standardized envelope containing `formattedMarkdown`.

## Model Experience
- **Zero Hallucination Transfer**: Creates a clean, structured bridge between sessions.
- **Fast Startup**: New session immediately starts with clear priorities and verified context.
