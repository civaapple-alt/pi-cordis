import { Context } from "@deepseek-ai/cordis";
import "./types.ts";
import { SettingsService, type SettingsServiceConfig } from "./services/settings-service.ts";
import { AuthService, type AuthServiceConfig } from "./services/auth-service.ts";
import { AIService, type AIServiceConfig } from "./services/ai-service.ts";
import { ToolRegistryService, type ToolRegistryServiceConfig } from "./services/tool-registry-service.ts";
import { SessionService, type SessionServiceConfig } from "./services/session-service.ts";
import { SkillsService, type SkillsServiceConfig } from "./services/skills-service.ts";
import { PromptsService, type PromptsServiceConfig } from "./services/prompts-service.ts";
import { ExtensionService, type ExtensionServiceConfig } from "./services/extension-service.ts";
import { PackageManagerService, type PackageManagerServiceConfig } from "./services/package-manager-service.ts";
import { AgentService } from "./services/agent-service.ts";
import { getAgentDir } from "../../config.ts";

export interface CreatePiContextOptions {
	cwd?: string;
	agentDir?: string;
	sessionDir?: string;
	skillPaths?: string[];
	promptPaths?: string[];
	extensionPaths?: string[];
	allowModelNetwork?: boolean;
	signal?: AbortSignal;
}

export async function createPiContext(options: CreatePiContextOptions = {}): Promise<Context> {
	const cwd = options.cwd ?? process.cwd();
	const agentDir = options.agentDir ?? getAgentDir();

	const ctx = new Context();

	// Mount all Pi services as Cordis plugins
	ctx.plugin(SettingsService, { cwd, agentDir });
	ctx.plugin(AuthService, { agentDir });
	ctx.plugin(AIService, { agentDir, allowModelNetwork: options.allowModelNetwork, signal: options.signal });
	ctx.plugin(ToolRegistryService, { cwd });
	ctx.plugin(SessionService, { cwd, sessionDir: options.sessionDir });
	ctx.plugin(SkillsService, { cwd, agentDir, skillPaths: options.skillPaths });
	ctx.plugin(PromptsService, { cwd, agentDir, promptPaths: options.promptPaths });
	ctx.plugin(ExtensionService, { cwd, agentDir, extensionPaths: options.extensionPaths });
	ctx.plugin(PackageManagerService, { cwd, agentDir });
	ctx.plugin(AgentService);

	await Promise.resolve();
	await ctx.ai.init();

	return ctx;
}
