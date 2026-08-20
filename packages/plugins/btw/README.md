# @pi-cordis/plugin-btw

English | [中文](README.zh.md)

`@pi-cordis/plugin-btw` is the **zero-context-pollution ephemeral side-channel LLM question plugin** for Pi-Cordis.

---

## Core Capabilities

- Registers `/btw <question>` terminal slash command;
- Bypasses main conversation session to query active LLM via `ctx.ai` directly;
- **100% Physical Isolation**: Never writes to SQLite / `session.jsonl` logs, never consumes main session context tokens, preserves KV-cache;
- Renders concise answer directly in TUI notification overlay.
