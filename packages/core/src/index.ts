// Re-export full upstream @earendil-works/pi-coding-agent capabilities
export * from "@earendil-works/pi-coding-agent";

// Export Cordis Microkernel & Core Services
export {
	createPiContext,
	type CreatePiContextOptions,
} from "./core/cordis/bootstrap.ts";

export {
	createProfileCommandExtension,
	createBtwCommandExtension,
	setupTerminalNotifier,
	TerminalNotifierPlugin,
	type ExtensionAPI,
} from "./core/cordis/profile-command.ts";

export {
	SettingsService,
	type SettingsServiceConfig,
} from "./core/cordis/services/settings-service.ts";

export {
	AuthService,
	type AuthServiceConfig,
} from "./core/cordis/services/auth-service.ts";

export {
	AIService,
	type AIServiceConfig,
} from "./core/cordis/services/ai-service.ts";

export {
	ToolRegistryService,
	type ToolRegistryServiceConfig,
	type ToolDef,
	type CordisPluginToolDef,
	type ToolFilterFn,
	allToolNames,
	createToolDefinition,
} from "./core/cordis/services/tool-registry-service.ts";

export {
	SessionService,
	type SessionServiceConfig,
} from "./core/cordis/services/session-service.ts";

export {
	SkillsService,
	type SkillsServiceConfig,
	type Skill,
} from "./core/cordis/services/skills-service.ts";

export {
	PromptsService,
	type PromptsServiceConfig,
	type PromptTemplate,
} from "./core/cordis/services/prompts-service.ts";

export {
	ExtensionService,
	type ExtensionServiceConfig,
} from "./core/cordis/services/extension-service.ts";

export {
	PackageManagerService,
	type PackageManagerServiceConfig,
	type ProgressCallback,
} from "./core/cordis/services/package-manager-service.ts";

export {
	AgentService,
} from "./core/cordis/services/agent-service.ts";
