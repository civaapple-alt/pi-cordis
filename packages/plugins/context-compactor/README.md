# @pi-cordis/plugin-context-compactor

English | [中文](README.zh.md)

Native Cordis long-session compaction and context summarization plugin. It provides the `trigger_compact` tool and emits the `pi/compact` event to reclaim token capacity while preserving critical decisions.

## Tool

### `trigger_compact`

Accepts:
- `reason` (string, optional): Justification or target milestone for triggering compaction.

Returns:
- `success` (boolean): Compaction trigger status.
- `message` (string): Informational message regarding compaction.
- `tokenThreshold` (number): Configured compaction threshold.

## Event Broadcasting
Emits `pi/compact` with payload:
```ts
{
  reason: string;
  timestamp: number;
}
```

## Model Experience
- **Token Budget Recovery**: Condenses lengthy conversation history into an executive summary.
- **Continuous Focus**: Maintains continuity across long-running multi-step refactoring workflows.
