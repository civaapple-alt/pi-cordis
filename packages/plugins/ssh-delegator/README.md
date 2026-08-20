# @pi-cordis/plugin-ssh-delegator

English | [中文](README.zh.md)

Native Cordis remote SSH execution and container proxy plugin. It registers the `ssh_exec` tool to run commands and query files on remote hosts or containerized environments.

## Tool

### `ssh_exec`

Accepts:
- `command` (string, required): Shell command to execute on the remote machine.
- `host` (string, optional): Remote target hostname or IP address (falls back to plugin config).
- `user` (string, optional): Remote username (falls back to plugin config).

Returns:
- `success` (boolean): Remote command execution status.
- `target` (string): Effective target connection string (`user@host`).
- `command` (string): Executed command string.
- `stdout` (string): Captured remote output.
- `exitCode` (number): Exit code returned by remote process.

## Model Experience
- **Remote Host Delegation**: Enables inspecting server logs, running remote unit tests, or managing cloud environments directly from Pi.
- **Configurable Fallbacks**: Default connection details configured via `cordis.yml`.
