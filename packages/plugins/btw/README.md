# @pi-cordis/plugin-btw

English | [中文](README.zh.md)

`@pi-cordis/plugin-btw` is an ephemeral side-question plugin for Pi-Cordis.

---

## Core Capabilities

- Registers `/btw <question>` terminal slash command;
- Bypasses main conversation session to query active LLM via `ctx.ai` directly;
- Calls `completeSimple()` outside the active `AgentSession`, so the question and answer are not appended to the main session history;
- Uses a separate model request with its own token usage; provider-side cache behavior is provider-dependent;
- Renders concise answer directly in TUI notification overlay.
