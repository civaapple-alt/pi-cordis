# AGENTS.md

Pi-Cordis is a plugin-based terminal coding agent harness on the official Cordis npm packages: **everything is a plugin**. Read [Architecture Notes](.agents/notes/README.md) before changing `packages/` or `presets/`.

---

## 4-Layer Architecture Stance

Pi-Cordis adheres to a strict 4-layer decoupling model. Never bypass intermediate layers or re-clone upstream sources:

```
Level 4: Presets & Plugins   — presets/* (default, plan, ptc) & packages/plugins/* (13 published capabilities, profiles, 3 private prototypes)
Level 3: Microkernel Mesh    — packages/core (@pi-cordis/core: 10 Cordis services, EventBus, picds CLI)
Level 2: Coding Agent Spec   — @earendil-works/pi-coding-agent (TUI canvas, prompt templates, agent loop)
Level 1: Generic Agent Core  — @earendil-works/pi-agent-core (LLM adapters, tool execution primitives)
```

---

## Repository layout

```
presets/     Scenario-driven capability presets (preset.yml + cordis.yml)
  default/     Default is Best standard development mode
  plan/        Strict read-only planning and audit mode
  ptc/         Programmatic Tool Calling (TypeScript SDK + timeout-isolated Worker)
packages/
  core/        @pi-cordis/core: microkernel bootstrapper, 10 Core Services, picds CLI
    docs/        10 Core Services detailed API contracts and guides
    src/         createPiContext, profile-command, 10 Cordis services, types
    test/        Cordis bootstrap and integration test suites
  plugins/     @pi-cordis/plugin-* native Cordis plugin workspaces
    safety-gate/        Destructive command & protected path interception
    git-guard/          Dirty workspace warning & atomic git stash checkpoints
    todo-tracker/       4-state task progression & adaptive prompt compression
    rules-injector/     Automatic project rules discovery & SHA-256 caching
    code-mode/          PTC mode: dynamic .d.ts + timeout-isolated Worker (not a permission sandbox)
    ask-question/       Interactive multi-question batching & recommended selection
    plan-mode/          Step state machine, progress bar & mutating tool blocker
    output-truncator/   Head/tail preservation & .picds/spill/ overflow persistence
    context-compactor/  Private prototype; not connected to Pi compaction
    subagent/           Private prototype; no production agent driver
    session-handoff/    Standardized handoff envelope & markdown briefings
    git-automation/     Staged diff semantic analysis & Conventional Commits
    ssh-delegator/      Private prototype; no production SSH transport
    tools-manager/      Dynamic capability slicing & tool visibility toggling
    profiles/           YAML profile loader, preset composer & dual-track HMR
.agents/     Agent workflows and Architecture Decision Records (notes/)
  notes/       implemented/ (active ADRs), archived/ (frozen snapshots)
CHANGELOG.md Progressively updated changelog (Keep a Changelog)
```

---

## Commands

```sh
pnpm install            # pnpm workspaces, node >=22.19
pnpm test               # vitest unit and integration tests across core and plugins
pnpm run check          # TypeScript strict typecheck (tsc --noEmit)
pnpm picds              # launch interactive terminal (Default is Best mode)
pnpm picds --profile plan # launch in read-only plan mode
pnpm picds --profile ptc  # launch in programmatic tool calling mode
pnpm picordis           # alias command for picds
```

---

## Secrets / .env

Real-API runs read `DEEPSEEK_API_KEY`, optional `DEEPSEEK_BASE_URL`, and root `.env`. Never commit credentials.

---

## Conventions

- **Package Naming**: Every published project package is `@pi-cordis/<name>`; the microkernel remains owned and published by DeepSeek as `@deepseek-ai/*`.
- **Direct Upstream Ingestion**: Upstream `@earendil-works/pi-*` packages (`pi-coding-agent`, `pi-agent-core`, `pi-ai`, `pi-tui`) and `@deepseek-ai/cordis`, `@deepseek-ai/cosmokit`, and `@deepseek-ai/schemastery` are consumed directly from npm. Never clone or vendor upstream source into this repository.
- **Registrations are Effects**: Every dynamic registration (tools, skills, prompts, providers) goes through `ctx.effect()` / `ctx.on()`; registration methods MUST return a `Disposer` function for clean Fiber teardown.
- **Explicit Dependency Injection (`inject`)**: Plugins declare `export const inject = ['tools', 'settings']`; services declare `static provide = 'serviceName'`.
- **10 Core Services Seams**:
  - `ctx.settings` (`SettingsService`): Global and project settings management; emits `pi/settings-updated`.
  - `ctx.auth` (`AuthService`): Credential and API key storage; emits `pi/auth-updated`.
  - `ctx.ai` (`AIService`): Upstream Pi multi-model runtime & dynamic provider registry; emits `pi/model-change`.
  - `ctx.tools` (`ToolRegistryService`): 7 built-in tools, dynamic tools, presentation masking, and hooked `executeTool` pipeline.
  - `ctx.session` (`SessionService`): Persistent & in-memory session management; emits `pi/session-created`/`closed`.
  - `ctx.skills` (`SkillsService`): File-based and dynamic skill discovery; emits `pi/skill-registered`.
  - `ctx.prompts` (`PromptsService`): Prompt template engine and dynamic template registry; emits `pi/prompt-registered`.
  - `ctx.extensions` (`ExtensionService`): Loads Pi extensions and bridges `ExtensionAPI` to Cordis events.
  - `ctx.packageManager` (`PackageManagerService`): Installs extensions from `pi.dev`, npm, git; streams `pi/package-progress`.
  - `ctx.agent` (`AgentService`): Agent multi-turn inference loop orchestration & turn lifecycle events.
- **Anti-Bypass Rule**: Never instantiate `new Agent()` or call upstream core classes directly in business logic. Always route through `ctx.agent` or `createPiContext()`.
- **CLI & User Space Isolation**:
  - Executable binaries are `picds` and `picordis`. Never register `pi` to avoid PATH collisions with native Pi installations.
  - Global user configuration lives in `~/.picds/agent/` (`settings.json`, `auth.json`, `sessions/`, `presets/`).
  - Pi-Cordis control-plane configuration prioritizes `<cwd>/.picds/` and falls back to `<cwd>/.pi/` only where documented; Pi-owned resources retain upstream paths.
- **Typed Events Declaration Merging**: Extend the Cordis event bus via `declare module "@deepseek-ai/cordis" { interface Events { ... } }` in `packages/core/src/core/cordis/types.ts`.
- **ESM Everywhere**: `"type": "module"` across all packages. Use package names across packages and explicit `.ts` in local relative imports.
- **Cross-Platform Defensiveness**:
  - Windows file URLs must use `pathToFileURL(p).href` for ESM dynamic imports.
  - Symlink creation on Windows must safely fall back to Junction or catch `EPERM`.
- **Agent Notes Rule**: Non-trivial architectural changes, refactors, or new plugins MUST include an Agent Note under `.agents/notes/implemented/` in the same PR. Archived notes are frozen in `.agents/notes/archived/`.
- **Testing Policy**: All new services and plugins must provide unit tests under `test/` verifying lifecycle, event propagation, and disposer cleanup.

---

## Progressive Disclosure & Troubleshooting Navigation (渐进式信息披露与排查突破口)

When developing, verifying features, or debugging issues, follow this index to navigate to the exact Service API Specs (`packages/core/docs/cordis/services/`) and Architectural Decision Records (`.agents/notes/implemented/`):

### 1. Capability Domains & Documentation Map (领域与文档映射)

| 功能领域 (Domain) | 核心服务文档 (Service Docs) | 核心架构决策记录 (ADR / Agent Notes) |
| :--- | :--- | :--- |
| **工具桥接与 LLM 可见性**<br>(Tool Bridge & LLM Visibility) | [ToolRegistryService](packages/core/docs/cordis/services/tool-registry-service.zh.md)<br>[ExtensionService](packages/core/docs/cordis/services/extension-service.zh.md) | [双向工具桥接中枢与动态工具遮罩](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-bidirectional-tool-bridge-and-interactive-ui.zh.md) |
| **终端 UI 交互与弹窗**<br>(Terminal UI Modals & Inputs) | [ExtensionService](packages/core/docs/cordis/services/extension-service.zh.md) | [终端双向 UI 交互与上下文规范](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-bidirectional-tool-bridge-and-interactive-ui.zh.md)<br>[TUI 交互与控制面工程取舍](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-tui-and-control-plane-tradeoffs.zh.md) |
| **预设切换与工具遮罩**<br>(Profile Switching & Tool Masking) | [ExtensionService](packages/core/docs/cordis/services/extension-service.zh.md) | [编程化调用 PTC 架构](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-ptc-code-mode-architecture-proposal.zh.md)<br>[“Default is Best” 极简预设重构](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-minimalist-presets-and-default-is-best-philosophy.zh.md) |
| **依赖注入与权限沙箱**<br>(IoC & Inject Sandboxing) | [微内核服务概览](packages/core/docs/cordis/services/README.zh.md) | [能力接缝、显式注入 (inject) 与 TUI 桥接](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-capability-seams-inject-and-tui-bridge.zh.md) |
| **可逆副作用与插件生命周期**<br>(Reversible Effects & Disposers) | [微内核服务概览](packages/core/docs/cordis/services/README.zh.md) | [可逆副作用与 Disposer 模式深度实践](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-reversible-side-effects-and-disposer-pattern.zh.md)<br>[双轨 HMR 热重载架构](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-loader-and-dual-track-hmr-architecture.zh.md) |
| **零污染旁路问答**<br>(Side-channel Ephemeral Query) | [AIService](packages/core/docs/cordis/services/ai-service.zh.md)<br>[ExtensionService](packages/core/docs/cordis/services/extension-service.zh.md) | [斜杠命令原生插件化与零污染 /btw 问答](.agents/notes/implemented/feature/2026-08-20-pi-cordis-native-slash-commands-and-ephemeral-btw-architecture.zh.md) |
| **多智能体与会话物理隔离**<br>(Subagent & Session Isolation) | [SessionService](packages/core/docs/cordis/services/session-service.zh.md)<br>[AgentService](packages/core/docs/cordis/services/agent-service.zh.md) | [原生 Subagent 插件轻量增强实现](.agents/notes/implemented/feature/2026-08-20-pi-cordis-subagent-plugin-lean-enhancement.zh.md) |
| **智能体自我认知与自省**<br>(Self-Inspection & Reflection) | [SettingsService](packages/core/docs/cordis/services/settings-service.zh.md)<br>[PromptsService](packages/core/docs/cordis/services/prompts-service.zh.md) | [智能体自我认知架构演进与知识沉淀](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-agent-self-inspection-and-introspection-architecture.zh.md) |
| **代码库精简与上游解耦**<br>(Decoupling & 4-Layer Pyramid) | [核心层概览](packages/core/docs/cordis/services/README.zh.md) | [核心层 (@pi-cordis/core) 上游解耦与 4 层架构落地](.agents/notes/implemented/simplification/2026-08-20-pi-cordis-core-decoupling-and-layered-architecture.zh.md) |

---

### 2. Common Symptoms & Diagnostic Breakthroughs (常见故障诊断与排查突破口)

1. **LLM 无法感知插件自定义工具（LLM 只能看到部分内置工具）**：
   - **根因**：CLI 传入了 `--tools` 参数，触发上游 `AgentSession` 的 `allowedToolNames` 严格白名单过滤；
   - **突破口**：检查 `packages/core/src/cli.ts` 确保不向上游传递硬编码 `--tools`，并确保 `ExtensionService.createBridgeExtensionFactory()` 注册了 `grep, find, ls` 与 `ctx.tools.getCustomTools()`。
2. **工具调用时未弹出终端选择框，直接返回假定默认值（如 `ask_question` 未弹窗）**：
   - **根因**：工具 `execute()` 内部使用了模拟静态返回值，未从 `execContext.ctx.ui` 获取真实终端 UI 句柄；
   - **突破口**：在 `tool.execute(args, execContext)` 中解构 `execContext?.ctx?.ui`，调用 `ui.select()` / `ui.input()` / `ui.confirm()`，并用 `execContext?.ctx?.hasUI` 提供非交互环境回退。
3. **切换 Profile（如 `/profile ptc`）后工具未遮罩或旧工具残留**：
   - **根因**：切换预设时旧插件 Fiber 未调用 `ctx.registry.delete` 销毁，或未调用 `pi.setActiveTools()` 同步生效列表；
   - **突破口**：检查 `packages/plugins/profiles/src/index.ts` 中的 `applyProfile` 异步生命周期管理，以及 `ExtensionService.syncActiveTools()`。
4. **运行时抛出 `Error: cannot get property "xxx" without inject`**：
   - **根因**：Cordis Proxy 属性访问权限拦截，插件在未声明 `inject = ["xxx"]` 的情况下试图访问 `ctx.xxx`；
   - **突破口**：在插件顶部补充 `export const inject = ["xxx"]`；对于终端 UI 句柄，切勿访问 `ctx.ui`，应从 `cmdCtx.ui`（命令）或 `execContext.ctx.ui`（工具）中获取。
5. **代码修改后测试报错 `cannot get property "tools" without inject`**：
   - **根因**：服务类（`Service`）或插件未声明静态或导出的 `inject`；
   - **突破口**：在服务类中添加 `static inject = ["tools"]` 或 `export const inject = ["tools"]`。

---

## Defensive patterns

1. **Fiber Scope Disposers**: Always clean up listeners, timers, and tool registrations inside returned disposer callbacks.
2. **Context Extension**: Use `ctx.extend()` when creating child fibers or subagents to prevent state leakage to parent contexts.
3. **Graceful Upstream Fallbacks**: When accessing upstream optional properties, use explicit optional chaining and fallback defaults.

---

## Type safety and documentation

- Everything compiles under `strict: true` with `noImplicitAny`.
- Function-like exports include concise JSDoc documenting parameters and return types.
- Code changes must accompany updated README, service documentation in `packages/core/docs/cordis/services/`, and `CHANGELOG.md` records.
- Files end with exactly one trailing newline.

---

## Upstream dependency policy

Cordis, CosmoKit, and Schemastery are public npm dependencies. Keep their semver ranges explicit, update them through pnpm, and verify every upgrade via `pnpm test && pnpm run check`. Do not recreate a local `vendor/` source tree.
