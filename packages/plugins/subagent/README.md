# @pi-cordis/plugin-subagent

English | [中文](README.zh.md)

Native Cordis subagent delegation plugin. It provides the model-facing `subagent` tool to spawn isolated sub-tasks within a child `ctx.extend()` scope, enforcing recursion depth bounds and returning structured deliverables.

## Tool

### `subagent`

Accepts:
- `task` (string, required): Detailed task prompt for the subagent to execute.
- `context` (string, optional): Contextual background or constraint details.
- `role` (string, optional): Role persona (e.g. `'Code Reviewer'`, `'Test Runner'`).
- `depth` (number, optional): Current delegation depth.

Returns:
- `task`: Original delegated task.
- `success`: Boolean execution outcome.
- `summary`: High-level execution summary.
- `deliverables`: Structured deliverables object (`summary`, `modifiedFiles`, `artifacts`).
- `details`: Metadata (`role`, `executionDepth`, `timeoutMs`, `executionTimeMs`).
- `error`: Error code (e.g. `DELEGATED_DEPTH_EXCEEDED` when depth limit is reached).

## Model Experience
- **Depth Boundaries**: Protects against runaway recursive subagent chains.
- **Context Scope Isolation**: Subagents run in an isolated `ctx.extend()` fiber; only the final summary and deliverables return to the parent session.
