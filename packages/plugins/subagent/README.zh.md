# @pi-cordis/plugin-subagent

[English](README.md) | 中文

原生 Cordis 子智能体派生插件。提供面向模型的 `subagent` 工具，在隔离的 `ctx.extend()` 子作用域中派生子任务，具备严格的递归深度限制与结构化产出规约。

## 工具

### `subagent`

接受参数：
- `task` (string, 必填)：子智能体执行的任务详细描述。
- `context` (string, 可选)：上下文背景或具体约束。
- `role` (string, 可选)：角色画像（例如 `'Code Reviewer'`, `'Test Runner'`）。
- `depth` (number, 可选)：当前派生深度。

返回值：
- `task`：原派生任务。
- `success`：执行结果布尔值。
- `summary`：结构化总结报告。
- `deliverables`：结构化成果载荷（`summary`, `modifiedFiles`, `artifacts`）。
- `details`：元数据信息（层级深度、角色画像、执行耗时等）。
- `error`：异常代码（如超出深度时的 `DELEGATED_DEPTH_EXCEEDED`）。

## 模型体验
- **递归防死锁**：内置深度边界防护，防止模型无限递归派生子任务；
- **作用域完全隔离**：子任务执行期间的上下文在子作用域中销毁，仅将精炼的成果摘要回传父会话。
