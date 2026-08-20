# @pi-cordis/plugin-git-automation

English | [中文](README.zh.md)

Native Cordis Git automation and Conventional Commits plugin. It registers `git_smart_commit` to compose structured Conventional Commit messages, support breaking changes (`BREAKING CHANGE:` / `!`), and output ready-to-run shell commands.

## Tool

### `git_smart_commit`

Accepts:
- `type` (`"feat"` | `"fix"` | `"docs"` | `"style"` | `"refactor"` | `"test"` | `"chore"` | `"perf"`, required): Conventional commit type.
- `scope` (string, optional): Scope descriptor (e.g. `'core'`, `'plugins'`).
- `message` (string, required): Imperative commit description.
- `issueNumber` (number, optional): GitHub issue/PR number.
- `breakingChange` (string, optional): Breaking change explanation.

Returns:
- `success` (boolean): Formatting success.
- `commitMessage` (string): Complete formatted commit text.
- `instruction` (string): Ready-to-execute `git commit -m "..."` command.
- `isBreakingChange` (boolean): Whether a breaking change was recorded.

## Model Experience
- **Standardized History**: Enforces consistent semantic Git commits across all agent modifications.
- **TUI Integration**: Formats clear commit preview badges in the terminal interface.
