# @pi-cordis/plugin-git-automation

English | [中文](README.zh.md)

Native Cordis Git commit automation and message generator plugin. It registers the `git_smart_commit` tool to format structured Conventional Commits messages and link relevant GitHub issues.

## Tool

### `git_smart_commit`

Accepts:
- `type` (`"feat"` | `"fix"` | `"docs"` | `"style"` | `"refactor"` | `"test"` | `"chore"` | `"perf"`, required): Conventional commit type.
- `message` (string, required): Short imperative summary of the change.
- `scope` (string, optional): Component or package scope (e.g. `'plugins'`, `'core'`).
- `issueNumber` (number, optional): GitHub issue number to associate (e.g. `42`).

Returns:
- `success` (boolean): Formatting outcome.
- `commitMessage` (string): Standard formatted commit message (e.g. `feat(plugins): add subagent tool (#42)`).
- `instruction` (string): Ready-to-run git commit command line.

## Model Experience
- **Commit Standardization**: Ensures adherence to team Conventional Commits standards without manual regex crafting.
- **Traceability**: Seamlessly links issue numbers and affected architectural scopes.
