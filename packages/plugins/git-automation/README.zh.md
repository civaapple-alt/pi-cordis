# @pi-cordis/plugin-git-automation

[English](README.md) | 中文

原生 Cordis Git 提交自动化与规范生成插件。注册 `git_smart_commit` 工具，依据 Conventional Commits 规范生成标准提交信息并自动关联 GitHub Issue。

## 工具

### `git_smart_commit`

接受参数：
- `type` (`"feat"` | `"fix"` | `"docs"` | `"style"` | `"refactor"` | `"test"` | `"chore"` | `"perf"`, 必填)：规范化提交类型。
- `message` (string, 必填)：变更内容的简明扼要说明。
- `scope` (string, 可选)：所属模块或作用域（例如 `'plugins'`, `'core'`）。
- `issueNumber` (number, 可选)：关联的 GitHub Issue 编号（例如 `42`）。

返回值：
- `success` (boolean)：格式化结果。
- `commitMessage` (string)：标准 Conventional Commit 提交信息（例如 `feat(plugins): add subagent tool (#42)`）。
- `instruction` (string)：可直接执行的 Git 提交命令提示。

## 模型体验
- **规范化提交**：确保模型生成的提交信息百分之百符合开源社区与团队约定的 Conventional Commits 规范。
- **可追溯性**：自动关联所属包作用域与 Issue 编号，便于版本回溯。
