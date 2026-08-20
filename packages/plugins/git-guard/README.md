# @pi-cordis/plugin-git-guard

English | [中文](README.zh.md)

Native Cordis Git repository guard and atomic snapshot checkpoint plugin. It monitors working tree cleanliness, automatically generates `git stash create` snapshot references, and registers the `git_checkpoint` tool for instant rollbacks.

## Tool

### `git_checkpoint`

Accepts:
- `action` (`"create"` | `"restore"` | `"list"`, required): Checkpoint action to execute.
- `checkpointId` (string, optional): Target checkpoint identifier for restore operations.
- `description` (string, optional): Human-readable note for the checkpoint.

Returns:
- `success` (boolean): Checkpoint operation outcome.
- `checkpoint` (object, optional): Created checkpoint details (id, sha, timestamp).
- `checkpoints` (array, optional): Active session checkpoints on list action.

## Configuration

- `autoCheckpoint` (boolean, default: `true`): Automatically creates lightweight stash references before mutating turns.
- `warnDirtyOnStart` (boolean, default: `false`): Warns if uncommitted changes exist when the session starts.

## Model Experience
- **Atomic Rollbacks**: Allows the model or user to safely snapshot experimental code changes and revert with zero Git reflog pollution.
- **Silent Protection**: Background stash operations execute quietly without inflating prompt tokens.
