# @pi-cordis/plugin-session-handoff

[English](README.md) | 中文

原生 Cordis 会话交接与标准信封（Handoff Envelope）插件。注册 `session_handoff` 工具，将当前会话的目标、成果、后续步骤、关键文件与阻塞项打包为标准化交接文档，并广播 `pi/handoff` 事件以便平滑交接至新会话。

## 工具

### `session_handoff`

接受参数：
- `newGoal` (string, 必填)：新会话的核心主目标。
- `nextSteps` (string[], 必填)：立即执行的后续步骤列表。
- `sessionTitle` (string, 可选)：当前会话标题。
- `accomplishments` (string[], 可选)：已完成的里程碑列表。
- `criticalFiles` (string[], 可选)：与新目标相关的核心文件。
- `blockers` (string[], 可选)：已知阻塞项或遗留问题。

返回值：
- `success` (boolean)：打包结果。
- `message` (string)：状态信息。
- `handoff` (HandoffEnvelope)：包含 `formattedMarkdown` 格式化文档的完整信封载荷。

## 模型体验
- **无损交接**：跨会话迁移时保留全部核心事实，杜绝上下文断层幻觉；
- **快速冷启动**：新会话直接加载结构化交接信封，迅速进入执行状态。
