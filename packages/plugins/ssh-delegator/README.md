# @pi-cordis/plugin-ssh-delegator

English | [中文](README.zh.md)

Native Cordis remote SSH execution and container delegation plugin. It provides `ssh_exec` with connection configuration, latency measurement, and execution proxying across remote servers or Docker environments.

## Tool

### `ssh_exec`

Accepts:
- `command` (string, required): Shell command string to execute remotely.
- `host` (string, optional): Remote target hostname or IP (defaults to plugin config).
- `user` (string, optional): Remote username (defaults to plugin config).
- `port` (number, optional): SSH port (default: `22`).

Returns:
- `success` (boolean): Execution status.
- `target` (string): Remote target identifier (`user@host`).
- `command` (string): Executed command.
- `stdout` (string): Standard output.
- `stderr` (string, optional): Standard error.
- `exitCode` (number): Process exit code.
- `latencyMs` (number): Execution duration in milliseconds.

## Configuration

- `defaultHost` (string, default: `'localhost'`): Fallback remote host.
- `defaultUser` (string, default: `'root'`): Fallback remote user.
- `defaultPort` (number, default: `22`): Fallback SSH port.
- `timeoutMs` (number, default: `30000`): Remote execution timeout.

## Model Experience
- **Remote Operations**: Allows the agent to run tests or manage deployments on remote infrastructure seamlessly.
- **Latency Visibility**: Measures round-trip execution latency for diagnosing network bottlenecks.
