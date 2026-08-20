# Cordis Core Services Architecture & Documentation

English | [中文](README.zh.md)

This documentation provides complete architectural specifications, API contracts, and usage guides for the 10 native Cordis services in Pi-Cordis.

---

## The 5 Pillars of Core Services

Each Core Service is designed according to DSH (DeepSeek Harness) standards:
- **Capability Seams**: Explicitly declared service contracts accessible via `ctx.<service>`.
- **Reversibility**: Dynamic registrations return `this.ctx.effect()` disposers.
- **Reactive Bus**: Fine-grained typed events emitted on the central Cordis bus.
- **Interceptors**: Pre/post execution hooks and waterfall modifications.
- **Isolation**: Clean execution boundaries and child fiber support.

---

## Services Index

- [SettingsService (`ctx.settings`)](./settings-service.md) - Configuration management & reactive updates.
- [AuthService (`ctx.auth`)](./auth-service.md) - Credential store & API key accessors.
- [AIService (`ctx.ai`)](./ai-service.md) - Model runtime & dynamic provider registration.
- [ToolRegistryService (`ctx.tools`)](./tool-registry-service.md) - Tool registration, masking, and execution pipeline.
- [SessionService (`ctx.session`)](./session-service.md) - Session factory, persistence, and tracking.
- [SkillsService (`ctx.skills`)](./skills-service.md) - Skill discovery and dynamic registration.
- [PromptsService (`ctx.prompts`)](./prompts-service.md) - Prompt template discovery and registration.
- [ExtensionService (`ctx.extensions`)](./extension-service.md) - Extension loader and runtime management.
- [PackageManagerService (`ctx.packageManager`)](./package-manager-service.md) - Package lifecycle & progress events.
- [AgentService (`ctx.agent`)](./agent-service.md) - AgentSession orchestration & event mapping.
