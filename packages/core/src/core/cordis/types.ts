import type { AgentSession, SessionManager } from "@earendil-works/pi-coding-agent";
import type { Model } from "@earendil-works/pi-ai";
import type { Settings } from "./services/settings-service.ts";
import type { ToolDef } from "./services/tool-registry-service.ts";
import type { Skill } from "./services/skills-service.ts";
import type { PromptTemplate } from "./services/prompts-service.ts";
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
		// Session lifecycle
		"pi/session-start"(session: AgentSession): void;
		"pi/session-before"(event: { session: AgentSession; prompt: string }): void;
		"pi/session-after"(event: { session: AgentSession }): void;
		"pi/session-turn-start"(event: { session: AgentSession; prompt: string }): void;
		"pi/session-turn-end"(event: { session: AgentSession; response?: unknown }): void;
		"pi/session-created"(event: { session: SessionManager; cwd: string }): void;
		"pi/session-forked"(event: { session: SessionManager; sourcePath: string }): void;
		"pi/session-closed"(event: { id: string }): void;

		// Tool lifecycle & execution
		"pi/tool-registered"(tool: ToolDef): void;
		"pi/tool-unregistered"(name: string): void;
		"pi/tool-call"(event: { toolName?: string; name?: string; args: Record<string, unknown> }): void;
		"pi/tool-result"(event: { toolName?: string; name?: string; args?: Record<string, unknown>; result: unknown }): void;

		// AI & Model lifecycle
		"pi/model-change"(model: Model<any>): void;
		"pi/provider-registered"(event: { name: string; config?: any }): void;
		"pi/provider-unregistered"(name: string): void;

		// Settings & Auth
		"pi/settings-updated"(event: { settings: Settings; changedKeys: string[] }): void;
		"pi/auth-updated"(event: { provider?: string }): void;

		// Resources & Extensions
		"pi/skill-registered"(skill: Skill): void;
		"pi/skill-unregistered"(name: string): void;
		"pi/prompt-registered"(prompt: PromptTemplate): void;
		"pi/extension-loaded"(result: any): void;
		"pi/command-registered"(event: { name: string; definition: any }): void;
		"pi/command-unregistered"(name: string): void;

		// Package Manager
		"pi/package-installed"(event: { source: string; local?: boolean }): void;
		"pi/package-removed"(event: { source: string; local?: boolean }): void;
		"pi/package-updated"(event: { source?: string }): void;
		"pi/package-progress"(event: { message: string }): void;

		// Prompts & Features
		"pi/prompt-transform"(event: { prompt: string }): void;
		"pi/compact"(event: { reason: string; timestamp: number; modifiedFiles?: string[]; keyDecisions?: string[]; resolvedIssues?: string[]; pendingBlockers?: string[] }): void;
		"pi/handoff"(event: Record<string, unknown>): void;
		"pi/plan-completed"(event: { totalSteps: number }): void;
	}
}
