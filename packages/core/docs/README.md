# @pi-cordis/core Documentation Hub

English | [中文](README.zh.md)

Welcome to the `@pi-cordis/core` documentation hub. Serving as the microkernel control plane for Pi-Cordis, this package directly ingests official `@earendil-works/pi-coding-agent: ^0.84.2` dependencies from npm, wrapping upstream primitives into 10 reactive Cordis Core Services, and providing the zero-collision `picds` CLI entrypoint.

---

## 📖 Documentation Index

### 1. Core Services Contracts ([`cordis/services/`](cordis/services/README.md))
- [SettingsService (`ctx.settings`)](cordis/services/settings-service.md) — Hierarchical configuration, reactive updates & `pi/settings-updated`
- [AuthService (`ctx.auth`)](cordis/services/auth-service.md) — Credential storage, API key management & `pi/auth-updated`
- [AIService (`ctx.ai`)](cordis/services/ai-service.md) — 1307+ models runtime, dynamic provider registration & `pi/model-change`
- [ToolRegistryService (`ctx.tools`)](cordis/services/tool-registry-service.md) — 7 built-in coding tools, presentation tool masking & `executeTool` pipeline
- [SessionService (`ctx.session`)](cordis/services/session-service.md) — SQLite/JSON tree persistence & ephemeral `inMemory` sessions
- [SkillsService (`ctx.skills`)](cordis/services/skills-service.md) — Automatic Markdown skill discovery & dynamic reversible registration
- [PromptsService (`ctx.prompts`)](cordis/services/prompts-service.md) — Prompt template loading, variable interpolation & dynamic registration
- [ExtensionService (`ctx.extensions`)](cordis/services/extension-service.md) — Extension loader, Cordis EventBus bridge & 7 TUI interaction slots
- [PackageManagerService (`ctx.packageManager`)](cordis/services/package-manager-service.md) — Package installation/removal & progress streaming
- [AgentService (`ctx.agent`)](cordis/services/agent-service.md) — `AgentSession` factory orchestration & multi-turn event mapping

### 2. Microkernel & Plugin Guides ([`cordis/`](cordis/))
- [Cordis Microkernel Architecture](cordis/architecture.md) — IoC container, Fiber scopes, Disposer pattern, and EventBus
- [Native Plugin Development Guide](cordis/plugin-development.md) — Writing `@pi-cordis/plugin-*` packages, explicit `inject`, and reversible effects
- [Profiles, Presets & YAML Composition](cordis/profiles-and-presets.md) — 3 canonical presets (`default`, `plan`, `ptc`), `cordis.yml`, and live HMR
