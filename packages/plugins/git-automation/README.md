# @pi-cordis/plugin-git-automation

English | [中文](README.zh.md)

Registers `git_smart_commit`, a formatter for proposed commit messages. It returns the complete message plus a structured command (`executable: "git"`, `args: [...]`); it does not inspect the diff, stage files, or execute `git commit`.

With `conventionalCommits: true` (the default), the caller supplies the type, optional scope, message, issue number, and optional breaking-change note. With it disabled, the returned subject contains only the supplied message and issue number.

The accompanying instruction is non-executable prose and never interpolates the message into a shell string. Review the full proposal, then pass the structured arguments through the normal guarded tool path so spaces, quotes, and command-substitution syntax remain data.
