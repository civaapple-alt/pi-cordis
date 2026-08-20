# @pi-cordis/plugin-todo-tracker

English | [中文](README.zh.md)

Native Cordis in-session task tracking and prompt injection plugin. It provides `todo_write` and `todo_read` tools to manage a live todo checklist that is automatically injected into the system prompt.

## Tools

### `todo_write`

Accepts:
- `action` (`"add"` | `"update"` | `"clear"`, required): Action to perform.
- `id` (string, optional): Task ID for update operations.
- `title` (string, optional): Task title or summary.
- `status` (`"pending"` | `"in_progress"` | `"completed"`, optional): Task completion status.

### `todo_read`

Returns:
- `total` (number): Total tasks in list.
- `todos` (array): Full list of task items.

## Prompt Injection
When `injectToPrompt: true` (default), active non-completed tasks are automatically injected into the system prompt on each turn:
```markdown
## Current Active Tasks:
- [▶] Implement JWT authentication (todo_1)
- [ ] Write integration test cases (todo_2)
```

## Model Experience
- **Focus and Progress**: Keeps the model oriented on remaining work across long, multi-turn sessions.
- **Dynamic Updates**: Automatically reflects task progression in real time.
