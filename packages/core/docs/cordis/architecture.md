# Cordis Microkernel Architecture

English | [中文](architecture.zh.md)

Pi-Cordis is built on top of the **Cordis v4.0.1** Inversion-of-Control (IoC) microkernel meta-framework, embodying the "Everything is a Plugin" architectural philosophy.

---

## 1. Core Concepts & Mechanisms

### 1. `Context` (Container Context)
`Context` acts as the central service container and event bus. All core capabilities are mounted as singleton services on `Context`:
- Type declarations are extended via TypeScript Declaration Merging;
- Sub-scopes can be created via `ctx.extend()` for subagents and isolated execution sandboxes.

### 2. `Service` (Service Base Class)
All 10 Core Services extend `Service` from `@deepseek-ai/cordis`:
- Must declare `static provide = 'keyName'`;
- Constructor calls `super(ctx, 'keyName')` to mount itself onto `ctx.keyName`;
- Integrates with Fiber lifecycle activation and disposal.

### 3. `Effect` & `Disposer` (Reversible Side Effects)
"Registrations are Effects, and Effects must be Reversible":
- All dynamic plugin contributions must be wrapped in `this.ctx.effect()` or `this.ctx.on()`;
- Registration methods return `Disposer` functions, ensuring zero zombie listeners upon plugin unload.

### 4. `EventBus` (Central Event Bus)
The typed event bus supports three dispatch modes:
- **Parallel**: `ctx.emit('event', payload)`
- **Serial**: `ctx.serial('event', payload)` (used for security validation chains; aborts if any listener throws)
- **Waterfall**: `ctx.waterfall('event', value)` (used for transformation pipelines)

---

## 2. The 4-Layer Architecture Pyramid

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Level 4: Presets & Native Plugin Ecosystem (presets/*, packages/plugins/*) │
├────────────────────────────────────────────────────────────────────────┤
│ Level 3: Microkernel Control Plane & Services (@pi-cordis/core)        │
│   ├── 10 Core Reactive Services (Settings, Auth, AI, Tools, Session...)│
│   ├── Central EventBus (pi/* reactive streams)                         │
│   └── 2-Phase Microkernel CLI Bootstrapper (picds, picordis)           │
├────────────────────────────────────────────────────────────────────────┤
│ Level 2: Upstream Coding Specialization (@earendil-works/pi-coding-agent)│
├────────────────────────────────────────────────────────────────────────┤
│ Level 1: Upstream Generic Agent Core (@earendil-works/pi-agent-core)   │
└────────────────────────────────────────────────────────────────────────┘
```
