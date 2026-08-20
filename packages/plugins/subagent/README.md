# @pi-cordis/plugin-subagent

English | [中文](README.zh.md)

Native Cordis subagent delegation plugin. It provides the model-facing `subagent` tool to spawn isolated sub-tasks within a child `ctx.extend()` scope, preventing parent context pollution and returning structured summaries.

## Tool

### `subagent`

Accepts:
- `task` (string, required): Detailed task prompt for the subagent to execute.
- `context` (string, optional): Contextual background or constraint details.
- `role` (string, optional): Role persona (e.g. `'Code Reviewer'`, `'Test Runner'`).

Returns:
- `task`: Original delegated task.
- `success`: Boolean execution outcome.
- `summary`: High-level execution summary.
- `details`: Execution metadata (depth, role, timeout).

## Model Experience

### Tool Schema
- Fixed schema token footprint when enabled.
- Prefix-stable KV cache.

### Tool Call & Result
- The model delegates intensive explorations or bounded verification jobs to subagents.
- Subagents execute in isolated context scopes; only the resulting summary string is retained in the parent session log.

## Known Limitations and Deferred Work
- Cross-process or distributed subagent worker-threads are deferred.
- Subagent depth is bounded by `maxDepth` configuration (default: 3).
