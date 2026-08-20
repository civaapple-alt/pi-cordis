# @pi-cordis/plugin-git-guard

English | [中文](README.zh.md)

Native Cordis Git repository guard and checkpoint plugin. It monitors working tree cleanliness upon session start and automatically generates `git stash create` checkpoints before risky operations.

## Configuration

- `autoCheckpoint` (boolean, default: `true`): Automatically creates git stash checkpoints before session turns.
- `warnDirtyOnStart` (boolean, default: `false`): Warns if uncommitted changes exist when the session starts.

## Role
Consumer of `ctx.settings` and listener for `pi/session-start` and `pi/session-before` events.

## Model Experience
- **Reversible Experiments**: Provides background stash references that can be restored if experimental edits fail.
- **Silent Reliability**: Executes git checks without cluttering conversational token context.
