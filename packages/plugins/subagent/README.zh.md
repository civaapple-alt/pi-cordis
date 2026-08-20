# @pi-cordis/plugin-subagent

[English](README.md) | 中文

原生 Cordis 子智能体派生插件。提供面向模型的 `subagent` 工具，在隔离的 `ctx.extend()` 子作用域中派生子任务，避免父级上下文被大量探索性输出污染，并返回结构化总结。

## 工具

### `subagent`

接受参数：
- `task` (string, 必填)：子智能体执行的任务详细描述。
- `context` (string, 可选)：上下文背景或具体约束。
- `role` (string, 可选)：角色画像（例如 `'Code Reviewer'`, `'Test Runner'`）。

返回值：
- `task`：原派生任务。
- `success`：执行结果布尔值。
- `summary`：结构化总结报告。
- `details`：元数据信息（层级深度、角色画像、超时时间等）。

## 模型体验

### 工具 Schema
- 启用时产生固定的 Schema Token 开销。
- 只要定义与参数保持稳定，即可维持前缀稳定的 KV Cache。

### 调用历史与结果
- 模型可将耗费大量 Token 的探索或验证任务委托给子智能体。
- 子智能体在隔离的上下文作用域中运行，最终仅将精简的摘要结果追加到父会话上下文。

## 已知限制与暂缓事项
- 跨进程或多工作线程的分布式 Subagent 暂缓至未来演进。
- 子任务嵌套层级受 `maxDepth` 配置约束（默认限制为 3 层）。
