# @pi-cordis/plugin-context-compactor

English | [中文](README.zh.md)

Native Cordis long-session compaction and context summarization plugin. It provides the `trigger_compact` tool, capturing 4 core dimensions (modified files, key decisions, resolved issues, pending blockers) and emitting the `pi/compact` event to reclaim token capacity while preserving critical architectural decisions.

## Tool

### `trigger_compact`

Accepts:
- `reason` (string, optional): Justification or target milestone for triggering compaction.
- `modifiedFiles` (string[], optional): Key modified file paths to retain.
- `keyDecisions` (string[], optional): Architectural or design decisions to remember.
- `resolvedIssues` (string[], optional): Resolved problems or completed bug fixes.
- `pendingBlockers` (string[], optional): Unresolved obstacles or open questions.

Returns:
- `success` (boolean): Compaction trigger status.
- `message` (string): Informational status message.
- `tokenThreshold` (number): Configured compaction threshold.
- `compaction` (object): Structured 4-dimensional compaction payload.

## Event Broadcasting
Emits `pi/compact` with payload:
```ts
{
  reason: string;
  timestamp: number;
  modifiedFiles: string[];
  keyDecisions: string[];
  resolvedIssues: string[];
  pendingBlockers: string[];
}
```

## Model Experience
- **Token Budget Recovery**: Condenses lengthy conversation history into structured decision summaries.
- **Continuous Focus**: Maintains continuity across long-running multi-step refactoring workflows.
