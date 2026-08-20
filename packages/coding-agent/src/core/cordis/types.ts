import type { AgentSession } from "../agent-session.ts";
import type { Model } from "@earendil-works/pi-ai";
import type { SettingsService } from "./services/settings-service.ts";
import type { AuthService } from "./services/auth-service.ts";
import type { AIService } from "./services/ai-service.ts";
import type { ToolRegistryService } from "./services/tool-registry-service.ts";
import type { SessionService } from "./services/session-service.ts";
import type { AgentService } from "./services/agent-service.ts";
import type { SkillsService } from "./services/skills-service.ts";
import type { PromptsService } from "./services/prompts-service.ts";
import type { ExtensionService } from "./services/extension-service.ts";
import type { PackageManagerService } from "./services/package-manager-service.ts";

declare module "@deepseek-ai/cordis" {
	interface Context {
		settings: SettingsService;
		auth: AuthService;
		ai: AIService;
		tools: ToolRegistryService;
		session: SessionService;
		agent: AgentService;
		skills: SkillsService;
		prompts: PromptsService;
		extensions: ExtensionService;
		packageManager: PackageManagerService;
	}

	interface Events {
		"pi/session-start"(session: AgentSession): void;
		"pi/session-before"(event: { session: AgentSession; prompt: string }): void;
		"pi/session-after"(event: { session: AgentSession }): void;
		"pi/tool-call"(event: { toolName?: string; name?: string; args: Record<string, unknown> }): void;
		"pi/tool-result"(event: { toolName?: string; name?: string; args?: Record<string, unknown>; result: unknown }): void;
		"pi/model-change"(model: Model<any>): void;
		"pi/prompt-transform"(event: { prompt: string }): void;
		"pi/compact"(event: { reason: string; timestamp: number }): void;
		"pi/handoff"(event: Record<string, unknown>): void;
	}
}
