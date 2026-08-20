# @pi-cordis/plugin-tools-manager

[English](README.md) | 中文

原生 Cordis 工具动态管理与查看插件。注册 `manage_tools` 工具，支持在运行时查看当前活跃工具，并动态启用或禁用特定工具以保持上下文专注。

## 工具

### `manage_tools`

接受参数：
- `action` (`"list"` | `"disable"` | `"enable"`, 必填)：管理操作行为。
- `toolName` (string, 可选)：启用或禁用的目标工具名称。

返回值：
- `total` (number)：已注册的工具总数。
- `active` (string[])：当前处于活跃状态的工具名称列表。
- `disabled` (string[])：已被禁用的工具名称列表。
- `message` (string, 可选)：操作反馈信息。

## 模型体验
- **动态专注**：针对特定纯分析或纯只读任务动态关闭无关工具。
- **Schema 开销优化**：仅保留任务相关的工具，减少大模型每次推理携带的工具定义 Token 开销。
