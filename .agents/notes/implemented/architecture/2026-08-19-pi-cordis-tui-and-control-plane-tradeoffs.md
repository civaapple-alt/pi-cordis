# Agent Note: TUI, UI Plugins, and Control Plane Refactoring Trade-offs

Status: implemented
Created: 2026-08-19

English | [中文](2026-08-19-pi-cordis-tui-and-control-plane-tradeoffs.zh.md)

## Executive Summary

This Architecture Decision Record (ADR) synthesizes the in-depth reflections, trade-off analyses, and architectural inquiries that emerged during the `pi-cordis` refactoring. It specifically addresses:
1. **The True Cost of Control Plane Refactoring**: Why swapping the microkernel foundation via `packages/coding-agent/src/core/cordis` appears simple on the surface, and what hidden architectural trade-offs exist underneath.
2. **Startup Presentation & Silent Boot vs CLI Loggers**: Why `pi-cordis` utilizes a clean, alternate-screen TUI resource dashboard instead of stdout-streamed plugin loading logs.
3. **The Inherent Tension Between TUI and Microkernel UI Plugins**: Why `pi-tui` remains monolithic in phase one, why DSH retired its built-in TUI, and the fundamental engineering barriers of fine-grained UI slots and WebServer architectures in character terminals.
4. **Divergent Inquiries & Future Evolution**: TUI slotification paths, bilingual plugin interoperability, multi-agent terminal presentation boundaries, and unified multi-frontend dispatching.

---

## Key Inquiries & Deep-Dive Analysis

### 1. Control Plane & Strangler Pattern Trade-offs

#### Why does it appear "so simple"?
By establishing the 10 core services and the `createPiContext()` bootstrapper under `packages/coding-agent/src/core/cordis/`, control was transferred to the Cordis microkernel without altering algorithmic subpackages:
- **Clean modularity in upstream Pi**: `pi-ai`, `pi-agent-core`, and `pi-tui` are well-bounded libraries without malicious global singletons.
- **Strangler Fig Pattern**: Establishing an IoC control plane on top of battle-tested algorithmic code rather than rewriting hundreds of thousands of lines.
- **TypeScript Declaration Merging**: Seamless compile-time type injection through `declare module "@deepseek-ai/cordis"`.

#### The 4 Real Architectural Costs & Hidden Trade-offs
- **Cost 1: Dual Event Systems & Indirection Overhead**: Maintaining both Pi's hook-based `ExtensionAPI` and Cordis's `Context` event bus introduces indirection mapping and small delegation costs.
- **Cost 2: Bypass Risk**: Subpackages remain standalone npm packages. Without lint gates or strict team discipline, code might `new Agent()` directly, escaping microkernel supervision.
- **Cost 3: Deep Cordis Features Partially Constrained**: Subsystems retaining static caches or terminal handles cannot yet achieve 100% leak-free runtime plugin HMR (Hot Module Reload) or deep Context Forking.
- **Cost 4: Mental Model Shift**: Developers must transition from imperative class instantiations to IoC lifecycle effects, provider declarations (`static provide`), and asynchronous fiber microtask scheduling.

---

### 2. Startup Presentation & Silent Boot

#### Why not stream plugin loading logs to stdout?
- **TUI Alternate Screen Buffer Specification**: An interactive full-screen terminal requires an untainted `stdout` during launch; rogue text writes corrupt ANSI escape sequences and cursor positioning.
- **Sub-millisecond In-Memory Assembly**: `createPiContext()` mounts all 10 core services in `< 2ms`, rendering rolling loader logs unnecessary.

#### Best Practice: TUI Welcome Resource Dashboard
The microkernel status is surfaced directly inside the TUI dashboard:
```text
[Cordis Microkernel]
  ctx.settings, ctx.auth, ctx.ai, ctx.tools, ctx.session, ctx.skills, ctx.prompts, ctx.extensions, ctx.packageManager, ctx.agent

[Extensions]
  @juicesharp/rpiv-todo
```
Expanding this section reveals each service's responsibility and runtime description.

---

### 3. Fundamental Barriers of UI Plugins & WebServers in TUI

#### Why is fine-grained UI plugin slotification (Slots / UI-Plugins) difficult in TUI?
- **Absence of CSS Box Model & Flexible Layouts**: Web browsers compute layout automatically via CSS Flexbox/Grid. Character terminals operate on a strict grid (e.g., 120 × 40); dynamic multi-plugin card rendering easily leads to **width calculation errors, card squashing, and layout tearing**.
- **Exclusive Standard Input Raw Mode**: A terminal possesses only one global input stream. Multiple plugins intercepting keys (Tab autocomplete, indentation, modal dialogs) trigger **keybinding conflicts and focus deadlocks**.
- **Long-Session Double-Buffer Redraw Overhead**: Maintaining an expansive dynamic widget tree across hundreds of conversational turns imposes severe CPU and memory burdens.

#### Why did DSH retire its built-in TUI prior to open-sourcing?
- **The Local TUI vs Remote WebServer/RPC Divide**: Local terminal state (cursor coordinates, raw input) and remote state (JSON-RPC, stateless HTTP/WS requests) create dual-state synchronization bloat.
- **Protocol-First Strategy**: DSH retreated to the core and protocol layers (Cordis microkernel, inference loop, tool sandboxes, ACP), delegating all UI rendering to external IDE extensions and Web frontends.

#### Complementary Value of Pi and DSH
- **Pi's core strength**: The most responsive, distraction-free terminal agent experience (`pi-tui`).
- **pi-cordis's mission**: Empowering Pi's plugin and service orchestration with the Cordis microkernel to deliver the ultimate **Native Terminal Agent**.

---

## Divergent Explorations & Future Architecture

### Q4: Evolutionary Path to Cordis TUI Slots
Refactoring `InteractiveMode` into a formal `TuiService` (`ctx.tui`) with 7 standard slots:
1. `tui/header`: Branding and system notices.
2. `tui/resources`: Microkernel services and extension status.
3. `tui/widget-top`: Top banners and countdown timers.
4. `tui/chat-stream`: Message streams (Markdown, Diff, Bash, Tool cards).
5. `tui/widget-bottom`: Bottom status indicators.
6. `tui/editor`: Multiline editor and autocomplete popups.
7. `tui/footer`: Workspace path, Git branch, and Token metrics.

### Q5: Bilingual Plugin Interoperability
- **Cordis plugins consuming Pi extensions**: Querying `ctx.extensions.getExtensions()` and invoking registered tools via `ctx.tools`.
- **Pi extensions accessing Cordis**: Injecting `pi.cordis = ctx` into `ExtensionAPI` for advanced extensions.

### Q6: Multi-Agent Presentation in Terminal UI
- **Pane Split**: Horizontal/vertical terminal splits on wide displays (columns > 160).
- **Tab Switching**: Switching active subagent views via `Alt+1..9`.
- **Inline Accordions**: Embedding collapsible subagent progress cards in the main chat stream.

### Q7: Unified Runtime with Divergent Frontends
`createPiContext()` serves as the single source of truth across all execution targets:
- **TUI Mode (`pnpm pi`)**: Mounts `TuiService` for full-screen interaction.
- **Print / Headless Mode (`pi -p "task"`)**: Direct stdout streaming.
- **JSON Stream Mode (`pi --json`)**: Structured event streaming.
- **RPC / Server Mode (`pi --rpc`)**: IPC or Unix Socket transport for Web and IDE integration.
