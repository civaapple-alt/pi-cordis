# Cordis Core Services Architecture & Documentation

English | [中文](README.zh.md)

This documentation provides complete architectural specifications, API contracts, and usage guides for the 10 native Cordis services in Pi-Cordis.

---

## Runtime Foundation

The services import Cordis from the official npm packages: `@deepseek-ai/cordis@^4.0.1`, `@deepseek-ai/cosmokit@^1.8.2`, and `@deepseek-ai/schemastery@^3.18.1`. The repository does not carry a local framework source copy, and tests resolve the same published packages used in production.

---

## Design Lenses

Pi-Cordis borrows the following architecture lenses from DSH without depending on its application runtime:
- **Capability Seams**: Explicitly declared service contracts accessible via `ctx.<service>`.
- **Reversibility**: Registrations owned by Pi-Cordis return Fiber-scoped disposers where the upstream API supports removal.
- **Reactive Bus**: Fine-grained typed events emitted on the central Cordis bus.
- **Interceptors**: Pre/post execution hooks and waterfall modifications.
- **Scoped composition**: Plugins are mounted in Cordis Fibers and Profiles own their exact mount handles.

These are lifecycle and composition properties, not a process security boundary. Each service page states whether it affects the interactive Pi runtime or only the SDK-side Cordis catalog.

---

## Services Index

- [SettingsService (`ctx.settings`)](./settings-service.md) - Configuration management & reactive updates.
- [AuthService (`ctx.auth`)](./auth-service.md) - Credential store & API key accessors.
- [AIService (`ctx.ai`)](./ai-service.md) - Model runtime & dynamic provider registration.
- [ToolRegistryService (`ctx.tools`)](./tool-registry-service.md) - Tool registration, masking, and execution pipeline.
- [SessionService (`ctx.session`)](./session-service.md) - Session factory, persistence, and tracking.
- [SkillsService (`ctx.skills`)](./skills-service.md) - Skill discovery and dynamic registration.
- [PromptsService (`ctx.prompts`)](./prompts-service.md) - Prompt template discovery and registration.
- [ExtensionService (`ctx.extensions`)](./extension-service.md) - Narrow Cordis-to-Pi runtime bridge.
- [PackageManagerService (`ctx.packageManager`)](./package-manager-service.md) - Package lifecycle & progress events.
- [AgentService (`ctx.agent`)](./agent-service.md) - SDK-side AgentSession ownership & event mapping.
