# Pi-Cordis Core Services Directory

English | [中文](README.zh.md)

This directory contains the 10 native core Cordis Services that power the Pi-Cordis agent kernel. Each service adheres to **The 5 Pillars of DSH Architecture**:

1. **Capability Seam**: Strong typed definitions, decoupled providers, and consumer APIs.
2. **Reversibility & Fiber Teardown**: Declarative registrations with `this.ctx.effect()` returning disposers.
3. **Reactive Event Bus**: Comprehensive lifecycle event emissions on the Cordis context bus.
4. **Waterfall & Serial Interceptor Chains**: Pre/post execution hooks and stream transformations.
5. **Context Isolation**: Safe sub-scope branching with `ctx.extend()` and zero side effects.

---

## The 10 Core Services

| Service Name | Key on `ctx` | File | Description |
| :--- | :--- | :--- | :--- |
| **SettingsService** | `ctx.settings` | [`settings-service.ts`](./settings-service.ts) | Reactive global and project configuration management, hot updates, and `pi/settings-updated` events. |
| **AuthService** | `ctx.auth` | [`auth-service.ts`](./auth-service.ts) | Credential accessors, provider API key resolution, and `pi/auth-updated` event broadcasts. |
| **AIService** | `ctx.ai` | [`ai-service.ts`](./ai-service.ts) | Dynamic model provider registration with effect disposers, model switching, and `pi/model-change` events. |
| **ToolRegistryService** | `ctx.tools` | [`tool-registry-service.ts`](./tool-registry-service.ts) | Built-in & custom tool definitions, presentation masking filters, and `executeTool` pipeline with hooks. |
| **SessionService** | `ctx.session` | [`session-service.ts`](./session-service.ts) | Session factory & tracking, memory sessions, and `pi/session-created`/`forked`/`closed` events. |
| **SkillsService** | `ctx.skills` | [`skills-service.ts`](./skills-service.ts) | Filesystem skill loader, dynamic skill registration, and `pi/skill-registered` events. |
| **PromptsService** | `ctx.prompts` | [`prompts-service.ts`](./prompts-service.ts) | Prompt template loader, dynamic template registration, and `pi/prompt-registered` events. |
| **ExtensionService** | `ctx.extensions` | [`extension-service.ts`](./extension-service.ts) | Extension bundle loader, loaded tool/command registries, and `pi/extension-loaded` events. |
| **PackageManagerService** | `ctx.packageManager` | [`package-manager-service.ts`](./package-manager-service.ts) | Package installation, removal, update, and real-time progress events (`pi/package-progress`). |
| **AgentService** | `ctx.agent` | [`agent-service.ts`](./agent-service.ts) | AgentSession creation, lifecycle orchestration, and turn event mappings (`pi/session-turn-start/end`). |

---

## Detailed Documentation

For comprehensive usage guides and API references for each service, see:
[`packages/core/docs/cordis/services/`](../../../../docs/cordis/services/README.md)
