# @pi-cordis/plugin-git-automation

[English](README.md) | 中文

注册 `git_smart_commit`，用于格式化候选提交信息。它返回完整消息与结构化命令（`executable: "git"`、`args: [...]`），不分析 Diff、不暂存文件，也不执行 `git commit`。

`conventionalCommits: true`（默认）时，调用者提供类型、可选 Scope、消息、Issue 编号与可选 Breaking Change；关闭后，返回主题只包含消息与 Issue 编号。

附带 Instruction 是不可执行说明，不会把消息插入 Shell 字符串。先审阅完整提案，再把结构化参数交给正常受保护工具路径，使空格、引号与命令替换语法始终只是数据。
