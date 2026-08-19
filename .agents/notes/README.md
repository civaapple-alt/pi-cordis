# Pi-Cordis Architecture and Design Decisions (Agent Notes)

English | [中文](README.zh.md)

This directory records architectural decision records (ADRs), technology selections, and trade-off analyses for the **Pi-Cordis** project.

---

## Index

| Date | Title | Focus |
|---|---|---|
| `2026-08-19` | [Pi-Cordis: Microkernel Architecture on Cordis v4.0.1](implemented/architecture/2026-08-19-pi-cordis-microkernel-architecture.md) | "Everything is a plugin" design philosophy, vendored Cordis framework foundation, dependency isolation, 100% Pi TUI and feature parity |
| `2026-08-19` | [Pi-Cordis: Services Matrix and Extension Ecosystem Integration](implemented/architecture/2026-08-19-pi-cordis-services-and-plugin-ecosystem.md) | Ten core Cordis services (`ctx.settings`, `ctx.auth`, `ctx.ai`, `ctx.tools`, `ctx.session`, `ctx.skills`, `ctx.prompts`, `ctx.extensions`, `ctx.packageManager`, `ctx.agent`), `pi.dev/packages` marketplace compatibility, and `ExtensionAPI` bridging |
| `2026-08-19` | [Pi-Cordis: TUI, UI Plugins, and Control Plane Refactoring Trade-offs](implemented/architecture/2026-08-19-pi-cordis-tui-and-control-plane-tradeoffs.md) | The 4 true costs of control-plane refactoring and Strangler pattern, TUI silent boot & resource presentation dashboard, fundamental barriers of UI plugins and WebServers in character terminals, DSH protocol-first retreat, 7-slot TUI architecture evolution, and multi-agent terminal presentation boundaries |
| `2026-08-19` | [Pi-Cordis: Repository Simplification and Upstream Decoupling](implemented/simplification/2026-08-19-pi-cordis-repository-simplification.md) | Removing 1200+ duplicate source files, consuming official `@earendil-works/pi-*` dependencies from npm, 85%+ repository size reduction, and effortless upstream tracking |
| `2026-08-19` | [Pi AgentHarness: Industrial Specification and Cordis Microkernel Integration](implemented/architecture/2026-08-19-pi-agent-harness-specification-and-cordis-integration.md) | Three Stores model (entries/registers/ledger), Effect Sandwich crash resilience, Lanes concurrency, and Cordis control-plane mapping |
| `2026-08-19` | [Pi-Cordis: Native Cordis Plugins and Profile Presets](implemented/architecture/2026-08-19-pi-cordis-native-plugins-and-profiles.md) | Dedicated plugin workspace (`packages/plugins/*`), four native plugins (safety-gate, git-guard, todo-tracker, rules-injector), and 5 built-in profiles |




