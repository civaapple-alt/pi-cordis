# Agent Note: Native Slash Command Pluginization and Ephemeral Side-Channel LLM Query Architecture

Status: implemented
Created: 2026-08-20

English | [中文](2026-08-20-pi-cordis-native-slash-commands-and-ephemeral-btw-architecture.zh.md)

## Executive Summary

This Architecture Decision Record establishes and delivers the **pure native Cordis pluginization** of terminal control plane slash commands (`/profile`, `/btw`) and desktop notifications (`terminal-notifier`).

It completely eliminates legacy `profile-command.ts` external glue, allowing all terminal slash commands to be declaratively registered via `ctx.extensions.registerCommand()` with fiber-scoped disposers, and connects `@pi-cordis/plugin-btw` to real single-turn LLM bypass queries with 100% physical isolation and zero context pollution.

---

## 1. Architecture Decisions

1. **`ExtensionService` Command Bridge Hub**:
   - Exposes `ctx.extensions.registerCommand(name, definition): () => void` returning a reversible fiber Disposer;
   - Provides `createBridgeExtensionFactory()`, aggregating all plugin slash commands and cleanly bridging them into the upstream TUI loop.
2. **`@pi-cordis/profiles` Pluginization**:
   - Declares `inject = ["extensions", "settings"]`;
   - Registers `/profile` autocompletion and live hot-switching via `ctx.extensions.registerCommand("profile", ...)`.
3. **New `@pi-cordis/plugin-btw` Side-Channel Query Plugin**:
   - Declares `inject = ["extensions", "ai"]`;
   - Bypasses main conversation session to execute real single-turn LLM completions via `ctx.ai.getRuntime().completeSimple(...)`;
   - **Zero Context Pollution**: Never writes to SQLite / `session.jsonl` logs, never consumes main session context tokens, preserves KV-cache;
   - Renders answer directly in TUI notification overlay (`[btw: <model_id>]`).
4. **New `@pi-cordis/plugin-terminal-notifier` Native Desktop Notification Plugin**:
   - Listens to `pi/tool-call` (`ask_question` waiting) and `pi/session-turn-end` (turn completion) to emit OSC 777 escape sequences.
5. **Streamlined CLI Bootstrapping**:
   - `packages/core/src/cli.ts` removes manual factory glue, cleanly passing `cordisCtx.extensions.createBridgeExtensionFactory()`.

---

## 2. Consequences & Verification

- **Purity of "Everything is a Plugin"**: All terminal commands and control plane features strictly adhere to Cordis IoC and dependency injection;
- **Real AI Side-Channel Q&A**: Users can query `/btw <question>` anytime for instant AI answers without degrading main task context;
- **Automated Verification**: All 36 unit tests and `tsc --noEmit` pass with 100% success.
