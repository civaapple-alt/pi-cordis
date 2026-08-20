# Agent Note: Pi-Cordis Native Subagent Plugin Lean Enhancement Implementation

Status: implemented
Created: 2026-08-20

English | [中文](2026-08-20-pi-cordis-subagent-plugin-lean-enhancement.zh.md)

## Executive Summary

This architecture record documents the lean enhancement delivered to `@pi-cordis/plugin-subagent`.

Following a comparative audit with the community `pi-subagents` package (130+ files), we explicitly **rejected monolithic framework overengineering** in built-in plugins. Instead, we delivered the **two essential capabilities** of multi-agent delegation in under 50 lines of code:
1. **Physical Session Isolation (`ctx.session.inMemory()`)**: Child agents execute in isolated session state trees and context windows, closing cleanly upon completion to protect the parent's context window;
2. **Role-Based Tool Slicing**: Provides native tool permission boundaries for `scout`/`researcher` (read-only), `reviewer`/`oracle` (audit), and `worker`/`implementer` (full coding).

---

## 1. Decision

1. **Session-Scoped Physical Isolation**:
   - Declares `inject = ["tools", "session"]` in `packages/plugins/subagent/src/index.ts`;
   - Spawns an isolated sub-session via `ctx.session.inMemory()` during execution;
   - Closes the child session upon completion, keeping verbose logs out of the parent session and saving 80%+ of context window tokens.

2. **Role Tool Slicing**:
   - `scout` / `researcher`: Restricted to `["read", "grep", "find", "ls"]`;
   - `reviewer` / `oracle`: Restricted to `["read", "grep", "find"]`;
   - `worker` / `implementer` / `delegate`: Full coding tools `["read", "write", "edit", "bash"]`.

---

## 2. Consequences & Verification

- **Lean Codebase**: Zero unnecessary abstractions added to `packages/plugins/subagent`;
- **Automated Verification**: Verified by automated test suites in `cordis-ten-plugins.test.ts`.
