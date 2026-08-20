# @pi-cordis/plugin-git-automation

[English](README.md) | 中文

原生 Cordis Git 自动化与规范提交（Conventional Commits）插件。注册 `git_smart_commit` 工具，自动化编排规范化 Git 提交信息，支持破坏性变更标记（`BREAKING CHANGE:` / `!`），并输出可直接执行的 Shell 指令。

## 工具

### `git_smart_commit`

接受参数：
- `type` (`"feat"` | `"fix"` | `"docs"` | `"style"` | `"refactor"` | `"test"` | `"chore"` | `"perf"`, 必填)：语义化提交类型。
- `scope` (string, 可选)：修改范围（例如 `'core'`, `'plugins'`）。
- `message` (string, 必填)：祈使句描述。
- `issueNumber` (number, 可选)：关联的 GitHub Issue/PR 编号。
- `breakingChange` (string, 可选)：破坏性变更说明。

返回值：
- `success` (boolean)：格式化结果。
- `commitMessage` (string)：格式化后的完整提交信息。
- `instruction` (string)：可直接运行的 `git commit -m "..."` 命令。
- `isBreakingChange` (boolean)：是否包含破坏性变更。

## 模型体验
- **提交历史规范化**：确保智能体对代码库的修改全部遵循语义化 Conventional Commits 规范；
- **TUI 友好**：在终端界面中渲染醒目的提交预览卡片。
