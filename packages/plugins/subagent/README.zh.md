# @pi-cordis/plugin-subagent

[English](README.md) | 中文

原生 Cordis 子智能体派生插件。提供面向模型的 `subagent` 工具，在完全隔离的独立会话状态树（`ctx.session.inMemory()`）中派生子任务，具备角色工具权限切片、递归深度限制与结构化产出规约。

## 工具

### `subagent`

接受参数：
- `task` (string, 必填)：子智能体执行的任务详细描述。
- `context` (string, 可选)：上下文背景或具体路径约束。
- `role` (string, 可选)：角色类型，自动切片工具权限：
  - `scout` / `researcher`：只读侦察角色，仅开放只读工具 `["read", "grep", "find", "ls"]`；
  - `reviewer` / `oracle`：审计与方案顾问角色，仅开放审查工具 `["read", "grep", "find"]`；
  - `worker` / `implementer` / `delegate`：标准编码实施角色，开放全量读写工具 `["read", "write", "edit", "bash"]`。
- `depth` (number, 可选)：当前派生深度。

返回值：
- `task`：原派生任务。
- `success`：执行结果布尔值。
- `sessionId`：独立派生的子会话标识符。
- `summary`：结构化总结报告。
- `deliverables`：结构化成果载荷（`summary`, `modifiedFiles`, `artifacts`）。
- `details`：元数据信息（层级深度、角色画像、允许工具清单 `allowedTools`、执行耗时等）。
- `error`：异常代码（如超出深度时的 `DELEGATED_DEPTH_EXCEEDED`）。

## 模型体验与架构收益
- **独立物理会话隔离**：子智能体运行于专属内存会话中，海量代码探索与长日志留在子会话中，父会话仅接收提炼后的 Markdown 交付物，**节约 80%+ 核心上下文**；
- **角色工具权限切片**：根据 `role` 自动限制工具暴露，避免侦察/审查阶段意外修改文件；
- **递归防死锁**：内置深度边界防护（默认 `maxDepth: 3`），防止模型无限递归派生子任务。
