# @pi-cordis/plugin-safety-gate

English | [中文](README.zh.md)

Native Cordis security gate and command/file protection plugin. It intercepts `pi/tool-call` events before execution, enforcing read-only modes, protected file boundaries, and blocking destructive shell commands.

## Configuration

- `readOnly` (boolean, default: `false`): Disallows any `write` or `edit` tool calls.
- `protectedPaths` (string[], optional): File paths protected against accidental overwrite (defaults: `[".env", ".git/", "id_rsa", "id_ed25519", "node_modules/", ".ssh/"]`).
- `dangerousCommands` (string[], optional): High-risk command patterns blocked in bash (defaults: `["rm -rf /", "rm -rf /*", "mkfs", "dd if=", ":(){ :|:& };:", "chmod -R 777 /"]`).

## Event Interception
Listens to `pi/tool-call` synchronously and throws a descriptive error before the tool execution begins, preventing unintended damage to the workspace or operating system.

## Model Experience
- **Pre-execution Guardrails**: Immediate feedback if the model accidentally attempts to modify protected secrets or run dangerous commands.
- **Default Inclusion**: Enabled by default across `default`, `safe`, and `strict` profiles.
