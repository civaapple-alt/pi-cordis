import { describe, it, expect } from "vitest";
import { createPiContext } from "../src/core/cordis/index.ts";

describe("Pi-Cordis Microkernel Bootstrap & 10 Core Services (The 5 Pillars)", () => {
	it("boots Cordis Context and injects all 10 core Pi services", async () => {
		const ctx = await createPiContext({
			cwd: process.cwd(),
			allowModelNetwork: false,
		});

		expect(ctx).toBeDefined();
		expect(ctx.settings).toBeDefined();
		expect(ctx.auth).toBeDefined();
		expect(ctx.ai).toBeDefined();
		expect(ctx.tools).toBeDefined();
		expect(ctx.session).toBeDefined();
		expect(ctx.skills).toBeDefined();
		expect(ctx.prompts).toBeDefined();
		expect(ctx.extensions).toBeDefined();
		expect(ctx.packageManager).toBeDefined();
		expect(ctx.agent).toBeDefined();
	});

	it("1. SettingsService: reactive setting updates and pi/settings-updated event", async () => {
		const ctx = await createPiContext({ cwd: process.cwd(), allowModelNetwork: false });
		let updatedEvent: any = null;
		ctx.on("pi/settings-updated", (event) => {
			updatedEvent = event;
		});

		ctx.settings.update({ quiet: true });
		expect(updatedEvent).toBeDefined();
		expect(updatedEvent.changedKeys).toContain("quiet");
		expect(ctx.settings.getSetting("quiet")).toBe(true);
	});

	it("2. AuthService: credential accessors and pi/auth-updated event", async () => {
		const ctx = await createPiContext({ cwd: process.cwd(), allowModelNetwork: false });
		let authUpdated = false;
		ctx.on("pi/auth-updated", () => {
			authUpdated = true;
		});

		await ctx.auth.setApiKey("test-provider", "sk-test-123456");
		expect(authUpdated).toBe(true);
		expect(await ctx.auth.getApiKey("test-provider")).toBe("sk-test-123456");
	});

	it("3. AIService: dynamic provider registration with effect disposers", async () => {
		const ctx = await createPiContext({ cwd: process.cwd(), allowModelNetwork: false });
		let registeredEvent: any = null;
		let unregisteredEvent: any = null;

		ctx.on("pi/provider-registered", (evt) => {
			registeredEvent = evt;
		});
		ctx.on("pi/provider-unregistered", (name) => {
			unregisteredEvent = name;
		});

		// Dynamic register returns disposer
		const disposeProvider = ctx.ai.registerProvider("custom-mock-ai", {
			baseUrl: "https://mock.ai/v1",
			api: "openai-compatible",
		});

		expect(registeredEvent).toBeDefined();
		expect(registeredEvent.name).toBe("custom-mock-ai");

		disposeProvider();
		expect(unregisteredEvent).toBe("custom-mock-ai");
	});

	it("4. ToolRegistryService: executeTool pipeline with pre/post hooks", async () => {
		const ctx = await createPiContext({ cwd: process.cwd(), allowModelNetwork: false });
		let toolCallFired = false;
		let toolResultFired = false;

		ctx.on("pi/tool-call", () => {
			toolCallFired = true;
		});
		ctx.on("pi/tool-result", () => {
			toolResultFired = true;
		});

		const unregister = ctx.tools.registerCustomTool({
			name: "test_echo",
			description: "Echo test",
			execute: async (args: { text: string }) => ({ echoed: args.text }),
		});

		const result = await ctx.tools.executeTool("test_echo", { text: "hello cordis" });
		expect(result.echoed).toBe("hello cordis");
		expect(toolCallFired).toBe(true);
		expect(toolResultFired).toBe(true);

		unregister();
		expect(ctx.tools.has("test_echo")).toBe(false);
	});

	it("5. SessionService: session tracking, memory sessions, and pi/session-created event", async () => {
		const ctx = await createPiContext({ cwd: process.cwd(), allowModelNetwork: false });
		let createdSession: any = null;
		ctx.on("pi/session-created", (evt) => {
			createdSession = evt;
		});

		const mem = ctx.session.inMemory();
		expect(mem).toBeDefined();
		expect(createdSession).toBeDefined();
		expect(ctx.session.getActiveSessions().length).toBeGreaterThan(0);
	});

	it("6. SkillsService: dynamic skill registration with effect disposers", async () => {
		const ctx = await createPiContext({ cwd: process.cwd(), allowModelNetwork: false });
		let skillRegistered: any = null;
		let skillUnregistered: any = null;

		ctx.on("pi/skill-registered", (s) => {
			skillRegistered = s;
		});
		ctx.on("pi/skill-unregistered", (name) => {
			skillUnregistered = name;
		});

		const unregister = ctx.skills.registerSkill({
			name: "custom-deploy-skill",
			description: "Deploy to cloud",
			filePath: "/dummy/SKILL.md",
			baseDir: "/dummy",
			source: "custom",
		});

		expect(skillRegistered).toBeDefined();
		expect(skillRegistered.name).toBe("custom-deploy-skill");
		expect(ctx.skills.getSkill("custom-deploy-skill")).toBeDefined();

		unregister();
		expect(skillUnregistered).toBe("custom-deploy-skill");
		expect(ctx.skills.getSkill("custom-deploy-skill")).toBeUndefined();
	});

	it("7. PromptsService: dynamic prompt template registration with effect disposers", async () => {
		const ctx = await createPiContext({ cwd: process.cwd(), allowModelNetwork: false });
		let promptRegistered: any = null;
		ctx.on("pi/prompt-registered", (p) => {
			promptRegistered = p;
		});

		const unregister = ctx.prompts.registerPrompt({
			name: "review-pr",
			description: "Review a PR",
			template: "Please review this PR: {{diff}}",
			source: "custom",
		});

		expect(promptRegistered).toBeDefined();
		expect(promptRegistered.name).toBe("review-pr");
		expect(ctx.prompts.getPrompt("review-pr")).toBeDefined();

		unregister();
		expect(ctx.prompts.getPrompt("review-pr")).toBeUndefined();
	});

	it("8. ExtensionService & PackageManagerService: event streaming and progress callbacks", async () => {
		const ctx = await createPiContext({ cwd: process.cwd(), allowModelNetwork: false });
		let progressMessage = "";

		ctx.on("pi/package-progress", (evt) => {
			progressMessage = evt.message;
		});

		ctx.packageManager.setProgressCallback((msg) => {});
		(ctx.packageManager as any).manager.progressCallback?.("Installing cordis-plugin...");
		expect(progressMessage).toBe("Installing cordis-plugin...");
	});
});
