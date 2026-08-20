# @pi-cordis/plugin-todo-tracker

[English](README.md) | 中文

原生 Cordis 会话内任务清单追踪与提示词注入插件。提供 `todo_write` 与 `todo_read` 工具，维护实时的待办任务清单并自动将其注入到系统提示词中。

## 工具

### `todo_write`

接受参数：
- `action` (`"add"` | `"update"` | `"clear"`, 必填)：待办操作行为。
- `id` (string, 可选)：更新任务时的任务编号。
- `title` (string, 可选)：任务描述。
- `status` (`"pending"` | `"in_progress"` | `"completed"`, 可选)：任务状态。

### `todo_read`

返回值：
- `total` (number)：清单中的任务总数。
- `todos` (数组)：当前所有任务项列表。

## 提示词注入
当 `injectToPrompt: true`（默认启用）时，未完成的任务项将在每轮对话前自动注入系统提示词末尾：
```markdown
## Current Active Tasks:
- [▶] 实现 JWT 鉴权端点 (todo_1)
- [ ] 编写集成测试用例 (todo_2)
```

## 模型体验
- **任务目标聚焦**：跨长轮次对话时，始终保持模型对当前未完成工作与进度的精准把握。
- **状态动态感知**：任务状态的变更实时反映在后续轮次的系统提示词中。
