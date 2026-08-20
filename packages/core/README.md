# @pi-cordis/core

English | [中文](README.zh.md)

Pi-Cordis core control plane and Cordis microkernel service mesh. It directly consumes official `@earendil-works/pi-coding-agent` dependencies from npm, wrapping upstream capabilities into 10 reactive Cordis services, and providing the zero-collision `picds` CLI binary with isolated `~/.picds` user directory.

## 4-Layer Architecture Topology

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

## 10 Core Cordis Services

1. **`ctx.settings` (`SettingsService`)**: Hierarchical settings management & `pi/settings-updated` events;
2. **`ctx.auth` (`AuthService`)**: Isolated credential management & `pi/auth-updated` events;
3. **`ctx.ai` (`AIService`)**: Model runtime, dynamic provider registration, and reversible disposers;
4. **`ctx.tools` (`ToolRegistryService`)**: Coding tool registry, Code Mode filters, and lifecycle interceptors;
5. **`ctx.session` (`SessionService`)**: Persistent/in-memory session tree delegation (`/fork`, `/resume`, `inMemory`);
6. **`ctx.skills` (`SkillsService`)**: Dynamic Markdown skill injection and lifecycle management;
7. **`ctx.prompts` (`PromptsService`)**: Prompt template loading and dynamic registration;
8. **`ctx.extensions` (`ExtensionService`)**: TypeScript extension discovery and runtime bridge;
9. **`ctx.packageManager` (`PackageManagerService`)**: Package install/remove and progress notifications;
10. **`ctx.agent` (`AgentService`)**: Agent loop orchestration and multi-turn event propagation.

## CLI & User Directory Isolation

- **Executable Binary**: `picds` (primary 5-letter command) and `picordis` (full name). The `pi` binary is deliberately omitted to prevent PATH collisions with locally installed native Pi;
- **Configuration Directory**: Global `~/.picds/agent/`, with project-level `<cwd>/.picds/` prioritizing local config and gracefully falling back to `<cwd>/.pi/`.
