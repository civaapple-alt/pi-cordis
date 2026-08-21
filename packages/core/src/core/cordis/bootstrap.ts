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
import profilesPlugin, { applyProfile, setupPluginHmr, type BuiltinPluginName, type HmrManager } from "@pi-cordis/profiles";
import planModePlugin from "@pi-cordis/plugin-plan-mode";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

export interface CreatePiContextOptions {
	cwd?: string;
	agentDir?: string;
	sessionDir?: string;
	skillPaths?: string[];
	promptPaths?: string[];
	extensionPaths?: string[];
	allowModelNetwork?: boolean;
	signal?: AbortSignal;
	/** Initial Profile name, or `false` for a core-only embedding with no capability Profile. */
	profile?: string | false;
	planMode?: boolean;
	plugins?: Partial<Record<BuiltinPluginName, boolean | Record<string, unknown>>>;
	enableHmr?: boolean;
}

/** Bootstrap the Cordis control plane, optional capability Profile, and Pi-facing services. */
export async function createPiContext(options: CreatePiContextOptions = {}): Promise<Context> {
	const cwd = options.cwd ?? process.cwd();
	const agentDir = options.agentDir ?? getAgentDir();

	const ctx = new Context();
	try {
		// 1. Mount 10 core Pi services as Cordis plugins (Static Programmatic Loading)
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

		// 2. Mount session collaboration controls outside the switchable Profile
		// scope. Plan state therefore survives presentation changes such as PTC.
		ctx.plugin(planModePlugin, { initialActive: options.planMode ?? false });

		// 3. Mount profiles management plugin & apply active profile
		ctx.plugin(profilesPlugin);
		const profileName = options.profile ?? "default";
		if (profileName !== false) {
			await applyProfile(ctx, profileName, options.plugins, { cwd, agentDir });
		}

		// 4. Optional HMR Watcher for presets and packages/plugins
		if (options.enableHmr && profileName !== false) {
			const hmr = setupPluginHmr(ctx, profileName, {
				cwd,
				agentDir,
			});
			(ctx as any).hmrManager = hmr;
		}

		await Promise.resolve();
		await ctx.ai.init();

		return ctx;
	} catch (error) {
		await ctx.fiber.dispose();
		throw error;
	}
}
