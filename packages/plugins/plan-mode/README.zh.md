# @pi-cordis/plugin-plan-mode

[English](README.md) | 中文

原生 Cordis 结构化规划模式插件。注册 `plan_step` 工具，支持步骤依赖关系与进度条计算，在规划阶段拦截并阻断写操作工具，并将实时方案步骤自动注入到系统提示词中。

## 工具

### `plan_step`

接受参数：
- `action` (`"add"` | `"update"` | `"list"` | `"finish"`, 必填)：规划操作行为。
- `id` (number, 可选)：目标步骤编号（更新时必填）。
- `title` (string, 可选)：步骤描述。
- `status` (`"pending"` | `"in_progress"` | `"completed"` | `"failed"`, 可选)：步骤状态。
- `dependsOn` (number[], 可选)：前置依赖步骤编号列表。
- `notes` (string, 可选)：补充说明或技术选型依据。

返回值：
- `totalSteps` (number)：总步骤数。
- `progress` (string)：格式化进度条（例如 `[████░░░░░░] 40%`）。
- `percentage` (number)：完成度百分比。
- `steps` (数组)：步骤列表。

## 写操作拦截器
在规划模式激活期间，任何写操作工具（`write`、`edit`、`patch`、`apply_patch`）均被自动拦截。调用 `plan_step({ action: "finish" })` 时，系统自动解除写拦截并对外广播 `pi/plan-completed` 事件。

## 模型体验
- **Token 影响**：规划期间在系统提示词末尾追加动态规划 Markdown 与状态符号（`✓`、`▶`、`⏳`、`✗`）；
- **安全性**：确保模型在修改任何源码前先与用户对齐技术路线。
