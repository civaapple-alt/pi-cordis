# @pi-cordis/plugin-subagent

English | [中文](README.zh.md)

Native Cordis subagent delegation plugin. It provides the model-facing `subagent` tool to spawn isolated sub-tasks within an independent session state tree (`ctx.session.inMemory()`), enforcing role-based tool slicing, recursion depth bounds, and returning structured deliverables.

## Tool

### `subagent`

Accepts:
- `task` (string, required): Detailed task prompt for the subagent to execute.
- `context` (string, optional): Contextual background or constraint details.
- `role` (string, optional): Persona name determining automatic tool permission slicing:
  - `scout` / `researcher`: Read-only recon role, restricted to `["read", "grep", "find", "ls"]`;
  - `reviewer` / `oracle`: Code/architecture audit role, restricted to `["read", "grep", "find"]`;
  - `worker` / `implementer` / `delegate`: Implementation role, granting full coding tools `["read", "write", "edit", "bash"]`.
- `depth` (number, optional): Current delegation depth.

Returns:
- `task`: Original delegated task.
- `success`: Boolean execution outcome.
- `sessionId`: Isolated child session ID.
- `summary`: High-level execution summary.
- `deliverables`: Structured deliverables object (`summary`, `modifiedFiles`, `artifacts`).
- `details`: Metadata (`role`, `allowedTools`, `executionDepth`, `timeoutMs`, `executionTimeMs`).
- `error`: Error code (e.g. `DELEGATED_DEPTH_EXCEEDED` when depth limit is reached).

## Model Experience & Architectural Benefits
- **Session-Scoped Physical Isolation**: Child agents execute in isolated in-memory sessions; exploration logs stay out of the parent session, saving 80%+ of main context window tokens.
- **Role-Based Tool Slicing**: Dynamically restricts tool exposure based on `role` to prevent accidental file modifications during research/review phases.
- **Depth Boundaries**: Built-in recursion depth limits (default `maxDepth: 3`) protect against runaway subagent chains.
