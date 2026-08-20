# @pi-cordis/plugin-session-handoff

[English](README.md) | 中文

原生 Cordis 会话交接与上下文提炼插件。注册 `session_handoff` 工具，用于打包当前会话的目标、已完成成果及后续行动项，以平滑交接至全新的专注会话中。

## 工具

### `session_handoff`

接受参数：
- `newGoal` (string, 必填)：新会话的主要推进目标。
- `accomplishments` (string[], 可选)：本会话已达成的关键里程碑列表。
- `nextSteps` (string[], 必填)：新会话应立即执行的行动清单。
- `criticalFiles` (string[], 可选)：与新目标强相关的关键文件路径列表。

返回值：
- `success` (boolean)：打包状态。
- `message` (string)：交接确认说明。
- `handoff` (object)：包含时间戳、目标与步骤的结构化交接载荷。

## 事件广播
调用时对外广播 `pi/handoff` 事件，支持被会话管理服务、UI 组件或自动化转存流程捕获。

## 模型体验
- **平滑接力开发**：在结束大型任务的一个阶段时，将核心结论打包，无缝切换到下一阶段。
- **噪音隔离**：丢弃探索过程中的大量冗余上下文，仅保留高价值线索。
