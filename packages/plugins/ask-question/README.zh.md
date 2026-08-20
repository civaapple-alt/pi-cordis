# @pi-cordis/plugin-ask-question

[English](README.md) | 中文

原生 Cordis 需求澄清与交互问答插件。提供面向模型的 `ask_question` 工具，支持单题与多题批量问答、`(Recommended)` 推荐选项高亮与 TUI 可视化选项卡。

## 工具

### `ask_question`

接受参数：
- `questions` (对象数组，可选)：包含 `id`、`question`、`header`、`options` 与 `multi_select` 的批量问题列表。
- `question` (string, 可选)：单个问题文本（向后兼容）。
- `options` (对象数组，可选)：供选择的选项列表（推荐选项置于首位并追加 `(Recommended)`）。
- `allowCustom` (boolean, 可选)：是否允许自由输入。

返回值：
- `answers` (数组)：标准结构化回答数组（`{ id, selected: string[], custom? }`）。
- `question` (string)：主问题文本。
- `selected` (string)：选中的选项标签。
- `wasCustom` (boolean)：是否为自定义输入。

## 模型体验
- **主动对齐意图**：遇到多解法分支或未指定参数时，主动通过交互组件向用户确认，避免盲目猜测；
- **结构化结果回传**：通过规范的 JSON 结果直接回传给智能体循环。
