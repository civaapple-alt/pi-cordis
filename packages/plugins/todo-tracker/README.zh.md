# @pi-cordis/plugin-todo-tracker

[English](README.md) | 中文

原生 Cordis 任务清单追踪与自适应提示词注入插件。提供 `todo_write` 与 `todo_read` 工具，支持任务 4 态流转（`pending`、`in_progress`、`completed`、`cancelled`），并在提示词中自适应折叠已完成项以节省 Token。

## 工具

### `todo_write`

接受参数：
- `action` (`"add"` | `"update"` | `"clear"`, 必填)：待办操作行为。
- `id` (string, 可选)：任务编号。
- `title` (string, 可选)：任务描述。
- `status` (`"pending"` | `"in_progress"` | `"completed"` | `"cancelled"`, 可选)：任务状态。
- `category` (string, 可选)：所属类别。

### `todo_read`

返回值：
- `total` (number)：清单中的任务总数。
- `active` (number)：活跃未完成任务数。
- `completed` (number)：已完成任务数。
- `todos` (数组)：任务项列表。

## 自适应提示词注入
在每轮提示词中，仅展开活跃任务项，已完成或取消的任务自动折叠为紧凑数字（例如 `(✓ 3 completed, ✗ 1 cancelled hidden)`），显著减少多轮长会话的 Token 开销。

## 模型体验
- **任务目标聚焦**：始终保持模型对当前未完成工作的精准把握；
- **Token 节约**：避免大量历史已完成任务反复挤占上下文。
