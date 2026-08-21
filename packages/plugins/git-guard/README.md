# @pi-cordis/plugin-git-guard

English | [中文](README.zh.md)

Registers `git_checkpoint`, which uses `git stash create` to create a snapshot of tracked working-tree changes and keeps its commit reference in process memory.

- `create`: creates a reference when tracked changes exist;
- `list`: lists references created by this plugin instance;
- `restore`: shows the selected SHA and conflict warning, requires an explicit interactive confirmation, then applies it with structured Git arguments.

Checkpoint references do not survive process exit, do not include untracked files, and applying one may conflict with current changes. The plugin does not reset or delete the current working tree.

Restore declares a `workspace` side effect, so active Plan state blocks it before any prompt or Git operation. Headless restore and cancelled confirmation fail without changing the worktree; `create` and `list` remain non-mutating from the worktree-policy perspective.

`autoCheckpoint` is opt-in and defaults to `false`, avoiding hidden Git object writes in the default Profile. When enabled, it attempts a checkpoint before each agent turn. Git errors are ignored by that background hook; explicit tool actions return failures to the caller.
