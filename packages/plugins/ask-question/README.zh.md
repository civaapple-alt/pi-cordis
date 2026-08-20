# @pi-cordis/plugin-ask-question

[English](README.md) | 中文

原生 Cordis 需求澄清与交互问答插件。提供面向模型的 `ask_question` 工具，用于在遇到歧义或缺失设计决策时主动向用户发起结构化问答。

## 工具

### `ask_question`

接受参数：
- `question` (string, 必填)：向用户提出的问题描述。
- `options` (对象数组，必填)：提供给用户选择的选项列表（包含 `label` 与可选 `description`）。
- `allowCustom` (boolean, 可选)：是否允许用户自由输入自定义回答。

返回值：
- `question` (string)：回显问题文本。
- `options` (string[])：所有选项标签列表。
- `selected` (string)：用户选中的选项或自定义输入内容。
- `wasCustom` (boolean)：是否为用户自定义输入。

## 模型体验
- **主动对齐意图**：遇到多解法分支或未指定参数时，主动通过交互组件向用户确认，避免盲目猜测。
- **结构化结果回传**：通过规范的 JSON 结果直接回传给智能体循环。
