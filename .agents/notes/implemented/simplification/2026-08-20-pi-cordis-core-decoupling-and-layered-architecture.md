# Agent Note: Pi-Cordis Core (@pi-cordis/core) Upstream Decoupling & 4-Layer Architecture Implementation

Status: implemented
Created: 2026-08-20

English | [中文](2026-08-20-pi-cordis-core-decoupling-and-layered-architecture.zh.md)

## Executive Summary

This architecture decision record (ADR) documents the **ultimate upstream decoupling and 4-layer architecture implementation** for `pi-cordis`.

By renaming `packages/coding-agent` to **`@pi-cordis/core`** and directly consuming the official `@earendil-works/pi-coding-agent` package from npm, we have eliminated hundreds of cloned upstream source files. We established a strict **4-layer architecture pyramid**, implemented a **2-phase CLI bootstrapper**, and introduced a **zero-collision binary strategy (`picds`) and isolated `~/.picds` user directory**.

---

## 1. Problem Background & Diagnosis

In the previous simplification milestone, auxiliary packages were converted to npm dependencies. However, the core package retained bottlenecks:
1. **Workspace Name Collision**: Package name shadowed the npm registry package, preventing npm installation of official `@earendil-works/pi-coding-agent`;
2. **Redundant Cloned Sources**: Retained hundreds of duplicated files in `modes/`, `tools/`, `utils/`;
3. **Upstream Upgrade Barrier**: Could not run `pnpm update` to track upstream releases.

---

## 2. The 4-Layer Architecture Topology

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Pi-Cordis 4-Layer Architecture                  │
├────────────────────────────────────────────────────────────────────────┤
│ 【Level 4: Presets & Native Plugin Ecosystem】                         │
│   • presets/ (default, ptc); Plan is cross-Profile session state       │
│   • packages/plugins/* (safety-gate, plan-mode, subagent, todo, etc.)  │
│   • Role: Programmed strictly against Cordis services (inject)         │
├────────────────────────────────────────────────────────────────────────┤
│                                  ▲                                     │
│                                  │ Drives & Assembles                  │
│                                  │                                     │
│ 【Level 3: Microkernel Control Plane & Services】 ── @pi-cordis/core   │
│   • Cordis Microkernel Foundation (IOC, Fiber scopes, Disposers)       │
│   • 10 Core Cordis Services (SettingsService, AIService, Session...)   │
│   • Central EventBus (pi/* reactive streams)                           │
│   • Microkernel Bootstrap & Presets Loader (createPiContext, /profile) │
├────────────────────────────────────────────────────────────────────────┤
│                                  ▲                                     │
│                                  │ Wraps & Bridges (import)            │
│                                  │                                     │
│ 【Level 2: Upstream Coding Specialization】 ── pi-coding-agent         │
│   • Coding Tools (read, edit, write, bash, grep, find logic)           │
│   • Interactive TUI (pi-tui, double-buffered render, diff, queue)      │
│   • Tree-Structured Sessions (SessionManager, SQLite/JSONL, /fork)     │
│   • Intelligent Compaction (Context auto-summarization)                │
│   • Extension & Package Runtime (ExtensionRunner, SkillsManager, RPC)  │
├────────────────────────────────────────────────────────────────────────┤
│                                  ▲                                     │
│                                  │ Substrate Loop (npm dependency)     │
│                                  │                                     │
│ 【Level 1: Upstream Generic Agent Core】 ── pi-agent-core              │
│   • Generic Turn Loop State Machine (Message -> Model -> Tool -> Result│
│   • Generic AgentContext Message Container                             │
│   • LLM Streaming Parser (Thinking, Text, ToolCall)                    │
│   • Pure Abstract Tool Interface                                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Implementation Details

### 1. Package Renaming & Dependency Ingestion
- `packages/coding-agent/package.json` renamed to **`@pi-cordis/core`**;
- Ingests `@earendil-works/pi-coding-agent: ^0.84.2`, `@earendil-works/pi-ai`, `@earendil-works/pi-agent-core`, `@earendil-works/pi-tui` from npm.

### 2. 10 Core Cordis Services Rewired to npm
- All 10 core services now import upstream managers directly from npm.

### 3. Two-Phase Bootstrapper Design in `src/cli.ts`
```typescript
#!/usr/bin/env node
import { createPiContext } from "./core/cordis/index.ts";
import { createProfileCommandExtension, createBtwCommandExtension, setupTerminalNotifier } from "./core/cordis/profile-command.ts";
import { main } from "@earendil-works/pi-coding-agent";

async function runCli() {
  process.title = "picds";
  process.env.PI_CODING_AGENT = "true";
  process.env.AI_AGENT = "picds";

  const rawArgs = process.argv.slice(2);
  let profileName = "default";
  const profileIdx = rawArgs.indexOf("--profile");
  if (profileIdx !== -1 && rawArgs[profileIdx + 1]) {
    profileName = rawArgs[profileIdx + 1];
    rawArgs.splice(profileIdx, 2);
  }

  // Phase 1: Boot Cordis Microkernel & Core Services + Active Profile
  const cordisCtx = await createPiContext({ profile: profileName, cwd: process.cwd() });
  setupTerminalNotifier(cordisCtx);

  const extensionFactories = [
    createProfileCommandExtension(cordisCtx),
    createBtwCommandExtension(cordisCtx),
  ];

  // Phase 2: Hand over to official upstream CLI, driving the TUI terminal
  await main(rawArgs, { extensionFactories });
}
runCli().catch((err) => { console.error("Pi-Cordis Boot Error:", err); process.exit(1); });
```

### 4. User & Project Directory Isolation (~/.picds & .picds/ Strategy)
- **Global User Directory (`~/.picds/`)**: `settings.json`, `auth.json`, `sessions/`, `presets/` live in `~/.picds/agent/`, physically isolated from native `~/.pi/`;
- **Project-Level Directory (`<cwd>/.picds/`)**: Prioritizes `<cwd>/.picds/` with graceful fallback to `<cwd>/.pi/`.

### 5. Zero-Collision Bin Strategy
- Omitted `pi` binary;
- Officially registered `picds` and `picordis`;
- Root scripts: `pnpm picds` and `pnpm picordis`.

---

## 4. Consequences & Benefits

1. **Effortless Upstream Tracking**: Single `pnpm update` upgrades all underlying tools, TUI, and engine features;
2. **Zero Global Binary & Data Collision**: `picds` command and `~/.picds/` directory safely coexist with any locally installed official `pi`;
3. **80%+ Repository Footprint Reduction**: Deleted hundreds of duplicate cloned files;
4. **Clean Unidirectional Architecture**: Clear boundary separation.
