# @pi-cordis/plugin-safety-gate

English | [中文](README.zh.md)

Native Cordis multi-tier security gate and command/file protection plugin. It intercepts `pi/tool-call` events before execution, enforcing read-only boundaries, protected secret paths, and pattern-based destructive shell command blocking.

## Configuration

- `readOnly` (boolean, default: `false`): Disallows any `write`, `edit`, `patch`, or `apply_patch` tool calls.
- `protectedPaths` (string[], optional): File paths and extensions protected against modification (defaults: `[".env", ".env.", ".git/", "id_rsa", "id_ed25519", ".pem", ".key", "node_modules/", ".ssh/"]`).
- `dangerousCommands` (string[], optional): Additional custom command patterns to block in bash.
- `allowedCommands` (string[], optional): Exact command strings that bypass pattern checks. Suffixes and compound commands do not inherit the exception.

## Multi-Tier Security Engine

1. **Destructive Command Detection**: Uses regular expression pattern matching to intercept:
   - Root / Home directory deletions: `rm -rf /`, `rm -rf /*`, `rm -rf ~`, `rm -rf $HOME`, `rm -rf ..`
   - Disk formatting: `mkfs`, `dd if=`, `format`
   - Fork bombs: `:(){ :|:& };:`
   - Unrestricted permissions: `chmod -R 777 /`
   - Direct device writes: `> /dev/sda`, `> /dev/nvme`
   - Untrusted remote piping: `curl ... | bash`
   - Secret credential dumps: `cat .env`, `cat ~/.ssh/*`
   - Windows root deletion/formatting: destructive `Remove-Item`, `del`/`rd`, `format`, and `Clear-Disk` forms
2. **Secret & Key Protection**: Blocks write/patch operations targeting `.env`, `.git/`, `.ssh/`, `.pem`, and private keys.
3. **Read-Only Enforcement**: Rejects mutating file operations when operating under read-only or review modes.

## Model Experience
- **Pre-execution Guardrails**: Immediate, clear feedback before any potentially destructive action executes.
- **Default Coverage**: Included out-of-the-box in the `default`, `plan`, and `ptc` profiles.

This plugin is a defense-in-depth guardrail against common mistakes. Pattern matching is not a security sandbox and must not be treated as an isolation boundary for untrusted code.
