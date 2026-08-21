# @pi-cordis/plugin-git-automation

[English](README.md) | 中文

注册 `git_smart_commit`，用于格式化候选提交信息。它返回消息与一条待审查的 Shell 指令，不分析 Diff、不暂存文件，也不执行 `git commit`。

`conventionalCommits: true`（默认）时，调用者提供类型、可选 Scope、消息、Issue 编号与可选 Breaking Change；关闭后，返回主题只包含消息与 Issue 编号。

返回的 Shell 指令只是展示文本。请通过正常工具路径审查并执行 Git 操作，以继续经过策略钩子。
