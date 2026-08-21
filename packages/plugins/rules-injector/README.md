# @pi-cordis/plugin-rules-injector

English | [中文](README.zh.md)

Adds supplemental project rule formats to the Cordis prompt-transform pipeline. By default it reads root `.clauderules` and `.cursorrules`, plus Markdown files under `.claude/rules/` and `.agents/rules/`.

Pi already discovers `AGENTS.override.md`, `AGENTS.md`, and `CLAUDE.md`; this plugin therefore does not duplicate them by default. Set `includePiContextFiles: true`, or provide an explicit `ruleFiles` list, only when upstream Pi context-file loading has been disabled intentionally.

Directory traversal is deterministic, unreadable files fail visibly, and `maxTotalBytes` defaults to 128 KiB. A SHA-256 content hash reuses the already formatted block when content is unchanged; it does not eliminate the filesystem reads needed to detect changes or guarantee provider-side KV-cache behavior.
