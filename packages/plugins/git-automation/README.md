# @pi-cordis/plugin-git-automation

English | [中文](README.zh.md)

Registers `git_smart_commit`, a formatter for proposed commit messages. It returns a message and a ready-to-review shell instruction; it does not inspect the diff, stage files, or execute `git commit`.

With `conventionalCommits: true` (the default), the caller supplies the type, optional scope, message, issue number, and optional breaking-change note. With it disabled, the returned subject contains only the supplied message and issue number.

Treat the returned shell instruction as display text. Review and execute Git operations through the normal tool path so policy hooks remain active.
