# @pi-cordis/plugin-plan-mode

[English](README.md) | 中文

原生 Cordis 结构化规划模式插件。注册 `plan_step` 工具，在规划阶段拦截并阻断修改性文件工具，并将实时方案步骤自动注入到系统提示词中。

## 工具

### `plan_step`

接受参数：
- `action` (`"add"` | `"update"` | `"list"` | `"finish"`, 必填)：规划操作行为。
- `id` (number, 可选)：目标步骤编号（更新时必填）。
- `title` (string, 可选)：步骤描述。
- `status` (`"pending"` | `"in_progress"` | `"completed"` | `"failed"`, 可选)：步骤状态。
- `notes` (string, 可选)：补充说明或技术选型依据。

## 写操作拦截器
在规划模式激活期间（`isPlanModeActive === true`），任何写操作工具（`write`、`edit`、`patch`、`apply_patch`）均被自动拦截并提示先完成方案规划。

## 提示词注入
在每轮对话中通过 `pi/prompt-transform` 事件将当前的实施步骤与完成状态自动注入系统上下文。

## 模型体验
- **Token 影响**：规划期间在系统提示词末尾追加动态规划 Markdown。
- **安全性**：确保模型在修改任何源码前先与用户对齐技术路线。
