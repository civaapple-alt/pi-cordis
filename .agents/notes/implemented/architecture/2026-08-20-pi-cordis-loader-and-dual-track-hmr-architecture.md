# Agent Note: Pi-Cordis Loader Trade-offs and Dual-Track HMR (Hot Module Replacement) Architecture

Status: implemented
Created: 2026-08-20

English | [中文](2026-08-20-pi-cordis-loader-and-dual-track-hmr-architecture.zh.md)

## Executive Summary

This Architecture Decision Record (ADR) documents the **design trade-offs regarding Cordis Loader** and the implementation of the **Dual-Track Layered HMR Architecture** in `pi-cordis`:
1. **Kernel Base Layer (Programmatic Bootstrapping)**: The 10 core services remain programmatically loaded via TypeScript, preserving in-memory non-serializable objects (such as `AbortSignal`) and guaranteeing sub-50ms CLI cold-start times;
2. **Dynamic HMR Layer (Presets & Plugins Hot-Reloading)**:
   - **Preset YAML Hot-Reloading**: Watches `presets/` and `.pi/presets/`, disposing old active plugin forks via Cordis `fork.dispose()` and mounting updated ones upon configuration changes;
   - **Plugin Code-Level HMR**: Watches `packages/plugins/*/src/**/*.ts`, busting Node.js ESM module cache via `pathToFileURL + ?t=timestamp` for live zero-restart code replacement;
   - **Zero Session State Loss**: Conversation trees, memory registers, and model connections remain intact throughout live reloads.

---

## Context & Architectural Questions

During the architectural evolution, two core questions were investigated:

### Question 1: Why extract 10 core Services without using `@deepseek-ai/cordis-plugin-loader` as the primary entry point?
- **Analysis**:
  1. **In-memory Runtime Objects**: Pi is a terminal coding agent requiring non-YAML-serializable options (e.g. `signal: AbortSignal` for Ctrl+C interruption, complex `toolsOptions` callbacks). Loading purely through static YAML requires intrusive global state or context patching;
  2. **Sub-50ms Cold-Start Constraint**: the Cordis loader is tailored for long-running daemon servers (like Koishi/DSH), computing dependency graphs and scanning module trees. Terminal one-shot commands (`pi -p "..."`) demand instant startup;
  3. **Avoiding Unintended Write-Backs**: the loader's `EntryTree` persists state mutations back to disk, whereas `presets/` are treated as immutable templates.

### Question 2: Does the absence of the Cordis loader prevent plugin HMR?
- **Analysis**:
  - **Config-level Reloading**: Supported natively by Cordis reversible effects (`ctx.effect` / `ctx.on`) via fork disposal;
  - **Code-level Module HMR**: Node.js native `import()` enforces persistent module caching.
- **Solution**: A dedicated lightweight Dual-Track HMR engine in `@pi-cordis/profiles/hmr` delivers live code and configuration hot-reloading without daemon complexity.

---

## Dual-Track HMR Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│               1. Kernel Base Layer (Programmatic Loading)              │
│  Settings, Auth, AI, Tools, Session, Skills, Prompts, Ext, Pkg, Agent  │
│  ─────────── Direct TypeScript Inversion-of-Control (Sub-50ms Boot) ───│
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│             2. Dynamic HMR Layer (Presets & Plugins)                   │
│  presets/<name>/(preset.yml + cordis.yml)  &  packages/plugins/*/src   │
│  ────────────────────────────────────────────────────────────────────  │
│  • YAML Watcher  ──> Atomic reload of active profile plugins           │
│  • TS Code Watcher ──> ESM timestamp cache-busting + fork.dispose()    │
│  • Session State Preserved ──> Conversation tree and memory intact!    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details (`@pi-cordis/profiles/hmr`)

### 1. Preset YAML Watcher
```typescript
// Watches presets/ and .pi/presets/
const watcher = fs.watch(presetDir, { recursive: true }, (eventType, filename) => {
  if (!filename?.endsWith(".yml")) return;
  reloadCurrentProfile();
});
```
- Calls `reloadCurrentProfile()`, iterates `activeForks` to invoke `fork.dispose()`, cleanly unregistering stale event listeners and custom tools;
- Re-applies the latest configuration and emits `pi/hmr-preset-update`.

### 2. Plugin Code Watcher & ESM Cache Buster
```typescript
// 1. Bust Node.js ESM cache via timestamp query
const fileUrl = pathToFileURL(filePath).href + `?t=${Date.now()}`;
const newModule = await import(fileUrl);
const plugin = newModule.default ?? newModule;

// 2. Dispose existing plugin fork
const oldFork = activeForks.get(pluginName);
if (oldFork) {
  oldFork.dispose();
  activeForks.delete(pluginName);
}

// 3. Mount updated plugin module on Cordis Context
const newFork = ctx.plugin(plugin, pluginConfig);
activeForks.set(pluginName, newFork);
```

---

## Benefits & Test Verification

1. **Best of Both Worlds**: Lightning-fast CLI cold starts combined with live zero-restart plugin and preset development;
2. **Seamless Session Continuity**: Hot reloads occur strictly within plugin lifecycle boundaries, preserving interactive sessions;
3. **Automated Test Coverage**: Full suite of HMR tests in [`packages/coding-agent/test/cordis-plugins-and-profiles.test.ts`](file:///D:/gh-ws/dsh-ws/pi-cordis/packages/coding-agent/test/cordis-plugins-and-profiles.test.ts) passing **100%**.
