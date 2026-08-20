# @pi-cordis/plugin-todo-tracker

English | [中文](README.zh.md)

Native Cordis task tracking and adaptive prompt injection plugin. It provides `todo_write` and `todo_read` tools supporting a 4-state task machine (`pending`, `in_progress`, `completed`, `cancelled`), topological sort cycle validation (`dependsOn`), and adaptive prompt compression that collapses finished tasks to save token budget.

## Tools

### `todo_write`

Accepts:
- `action` (`"add"` | `"update"` | `"clear"`, required): Action to perform.
- `id` (string, optional): Task ID for update operations.
- `title` (string, optional): Task title or summary.
- `status` (`"pending"` | `"in_progress"` | `"completed"` | `"cancelled"`, optional): Task status.
- `category` (string, optional): Grouping category.
- `dependsOn` (string[], optional): List of task IDs this task depends on (automatically validated for self-dependency and circular dependency loops).

### `todo_read`

Returns:
- `total` (number): Total tasks in list.
- `active` (number): Active pending/in_progress count.
- `completed` (number): Completed task count.
- `todos` (array): Full list of task items.

## Adaptive Prompt Injection
When `injectToPrompt: true`, active non-completed tasks and their blocker dependencies (`blocked by: ...`) are listed in the prompt, while completed/cancelled tasks are summarized into compact counts (`✓ N completed hidden`) to preserve conversation tokens.

## Model Experience
- **Focus and Progress**: Keeps the model oriented on remaining work and dependencies across long, multi-turn sessions.
- **Dependency Guard**: Pre-validates acyclic dependency graphs to prevent task deadlocks.
- **Token Efficiency**: Finished tasks do not consume repetitive prompt tokens.
