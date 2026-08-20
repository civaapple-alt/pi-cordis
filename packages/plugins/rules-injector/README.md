# @pi-cordis/plugin-rules-injector

English | [中文](README.zh.md)

Native Cordis workspace rules scanner and prompt injector plugin. It automatically discovers and injects repository-level instructions (`AGENTS.md`, `CLAUDE.md`, `.clauderules`, `.cursorrules`, `.agents/rules/`) into the system prompt.

## Configuration

- `ruleFiles` (string[], optional): Target rule filenames to scan (defaults: `["AGENTS.md", "CLAUDE.md", ".clauderules", ".cursorrules"]`).
- `scanClaudeRules` (boolean, default: `true`): Whether to scan the `.agents/rules/` and `.claude/rules/` directory trees.

## Behavior
On each agent turn (`pi/prompt-transform`), it reads existing workspace rule files from the current working directory and appends them under the `## 📋 Project Instructions & Guidelines:` section.

## Model Experience
- **Immediate Project Alignment**: Automatically equips the model with project-specific conventions, defensive patterns, and testing rules without manual user pasting.
- **Prefix Reusability**: Rule content remains constant across turns for stable KV cache prefixing.
