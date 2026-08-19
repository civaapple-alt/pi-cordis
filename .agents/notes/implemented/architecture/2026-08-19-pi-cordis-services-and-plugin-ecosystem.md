# Agent Note: Pi-Cordis Services Matrix and Extension Ecosystem Integration

Status: implemented

## Problem

Pi possesses a rich ecosystem of extensions, skills, prompts, and themes distributed through `https://pi.dev/packages`, npm, git repositories, and local directories. In Pi's native extension model, extensions export an `ExtensionFactory` that receives an `ExtensionAPI` with imperative methods like `registerTool`, `registerCommand`, `registerProvider`, and lifecycle event hooks (`before_agent_start`, `session_start`, `tool_call`, etc.).

When refactoring to the Cordis microkernel, we faced the challenge of:
1. Decomposing all internal subsystems into cohesive, reusable Cordis Services.
2. Providing seamless, backward-compatible execution for existing Pi extensions without requiring authors to rewrite them for Cordis.
3. Bridging Pi extension lifecycle calls and tool registrations into Cordis's event bus and service container.

## Decision

We implemented a ten-service Cordis matrix and an extension bridge layer:

1. **Ten Core Cordis Services**:
   - **`SettingsService` (`ctx.settings`)**: Manages user global (`~/.pi/agent/settings.json`) and project-local (`.pi/settings.json`) settings.
   - **`AuthService` (`ctx.auth`)**: Manages API keys, OAuth tokens, and credential persistence.
   - **`AIService` (`ctx.ai`)**: Wraps `ModelRuntime`, handles multi-provider model streaming, reasoning parameters, and token usage accounting.
   - **`ToolRegistryService` (`ctx.tools`)**: Registers built-in tools (`read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`) and dynamic custom tools.
   - **`SessionService` (`ctx.session`)**: Coordinates SQLite storage, session branching trees, resumption, and export.
   - **`SkillsService` (`ctx.skills`)**: Discovers prompt skills and directory skills.
   - **`PromptsService` (`ctx.prompts`)**: Manages prompt templates and variable interpolation.
   - **`ExtensionService` (`ctx.extensions`)**: Loads extensions and runs `ExtensionRunner`.
   - **`PackageManagerService` (`ctx.packageManager`)**: Implements `install`, `remove`, `update`, `list` across `pi.dev`, npm, git, and local sources.
   - **`AgentService` (`ctx.agent`)**: Coordinates agent loops and context execution.
2. **`pi.dev/packages` Ecosystem Compatibility & Event Bridging**:
   - `ExtensionService` transparently passes the standard `ExtensionAPI` to extension factories.
   - Tool registrations from extensions (`api.registerTool`) route to `ctx.tools.registerCustomTool()`.
   - Session and turn events from extensions hook directly into Cordis events (`pi/session-start`, `pi/tool-call`, `pi/model-change`, etc.).

## Alternatives considered

- **Forcing Extensions to Author Native Cordis Plugins Only**:
  - *Why not*: This would break existing extensions in the `pi.dev/packages` marketplace and require all third-party developers to rewrite their code. By bridging `ExtensionAPI` to Cordis, existing extensions work out of the box while new plugins can also be authored directly on Cordis `Context`.
- **Handling Package Management Outside the Cordis Container**:
  - *Why not*: Encapsulating package management into `ctx.packageManager` allows other Cordis plugins and CLI modes to programmatically install, update, and query extension packages through standard dependency injection.

## Consequences

- **Benefits**:
  - Full compatibility with existing extensions and packages from `pi.dev/packages`.
  - Every subsystem is inspectable and testable as an isolated Cordis service.
  - Zero disruption to users installing extensions via `pi install npm:@foo/bar` or `pi install git:github.com/...`.
- **Trade-offs**:
  - The runtime maintains a lightweight adapter layer between `ExtensionAPI` and Cordis events.
