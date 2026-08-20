# Agent Note: Pi-Cordis rpiv-mono Lean Feature Absorption Implementation

Status: implemented
Created: 2026-08-20

English | [中文](2026-08-20-pi-cordis-rpiv-mono-lean-feature-absorption.zh.md)

## Executive Summary

This architecture record documents the lean absorption of key interaction features inspired by the `rpiv-mono` benchmark repository.

By **rejecting plugin fragmentation** (avoiding creating extra npm packages for 15-line utilities), we integrated four high-value features directly into existing core services and plugins in under 100 lines of total code:
1. **Built-in `/btw` Command**: Ephemeral side questions with zero conversation history pollution;
2. **In-Place Upgrade for `@pi-cordis/plugin-ask-question`**: Added Markdown/Diff previews and note attachments;
3. **In-Place Upgrade for `@pi-cordis/plugin-todo-tracker`**: Added topological sort cycle detection and self-dependency guards;
4. **OSC 777 Terminal Notifier**: Provided `TerminalNotifierPlugin` emitting native OS toasts to Warp/Ghostty/iTerm2.

---

## 1. Decision

1. **`/btw` Command**: Mounted via `createBtwCommandExtension` in `packages/coding-agent/src/core/cordis/profile-command.ts`, executing single-turn answers in an ephemeral scope;
2. **Markdown Previews**: Added `preview` and `note` fields to `QuestionOption` in `packages/plugins/ask-question/src/index.ts`;
3. **Todo Dependency Validation**: Implemented DFS-based `hasCycle` in `packages/plugins/todo-tracker/src/index.ts` to reject circular and self dependencies;
4. **`OSC 777` Notifications**: Added `setupTerminalNotifier` in `profile-command.ts` emitting `\x1b]777;notify;title;body\x07` on tool waiting and turn completion.

---

## 2. Consequences & Verification

- **Zero Package Bloat**: Enhanced developer experience without proliferating packages;
- **Automated Verification**: Full test coverage in `cordis-plugins-and-profiles.test.ts` and `cordis-ten-plugins.test.ts`.
