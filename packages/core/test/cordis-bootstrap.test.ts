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

		ctx.settings.update({ quietStartup: true });
		expect(updatedEvent).toBeDefined();
		expect(updatedEvent.changedKeys).toContain("quietStartup");
		expect(ctx.settings.getSetting("quietStartup")).toBe(true);
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

	it("9. ExtensionService: adapts plugin tool renderCall/renderResult strings to valid TUI Components", async () => {
		const ctx = await createPiContext({ cwd: process.cwd(), allowModelNetwork: false });
		let registeredTool: any = null;
		const mockPi: any = {
			registerTool: (t: any) => {
				registeredTool = t;
			},
			registerCommand: () => {},
			on: () => {},
		};

		const bridge = ctx.extensions.createBridgeExtensionFactory();
		bridge.factory(mockPi);

		ctx.tools.register({
			name: "test_custom_render_tool",
			description: "test",
			renderCall: (args: any) => `Calling with ${args.param}`,
			renderResult: (result: any) => `Result is ${result.val}`,
			execute: async (params: any) => ({ val: params.param * 2 }),
		});

		expect(registeredTool).toBeDefined();
		expect(registeredTool.name).toBe("test_custom_render_tool");

		// Test renderCall returns Component with .render(width)
		const callComp = registeredTool.renderCall({ param: 42 }, {}, {});
		expect(callComp).toBeDefined();
		expect(typeof callComp.render).toBe("function");
		const callLines = callComp.render(80);
		expect(callLines.join("\n")).toContain("Calling with 42");

		// Test renderResult returns Component with .render(width)
		const resultComp = registeredTool.renderResult({ details: { val: 84 } }, {}, {}, {});
		expect(resultComp).toBeDefined();
		expect(typeof resultComp.render).toBe("function");
		const resultLines = resultComp.render(80);
		expect(resultLines.join("\n")).toContain("Result is 84");
	});

	it("11. ExtensionService: bridges before_agent_start prompt transformation and session lifecycle events", async () => {
		const ctx = await createPiContext({ cwd: process.cwd(), allowModelNetwork: false });
		const eventHandlers: Record<string, Function> = {};

		const mockPi: any = {
			registerTool: () => {},
			registerCommand: () => {},
			on: (eventName: string, handler: Function) => {
				eventHandlers[eventName] = handler;
			},
		};

		const bridge = ctx.extensions.createBridgeExtensionFactory();
		bridge.factory(mockPi);

		expect(eventHandlers["before_agent_start"]).toBeDefined();
		expect(eventHandlers["session_start"]).toBeDefined();
		expect(eventHandlers["agent_settled"]).toBeDefined();
		expect(eventHandlers["turn_start"]).toBeDefined();

		// Test prompt transform hook
		ctx.on("pi/prompt-transform" as any, async (evt: { prompt: string }) => {
			evt.prompt += "\n[INJECTED_SYSTEM_GUIDELINE]";
		});

		const transformResult = await eventHandlers["before_agent_start"]({
			systemPrompt: "Base system prompt",
			prompt: "User query",
		});

		expect(transformResult).toBeDefined();
		expect(transformResult.systemPrompt).toContain("Base system prompt");
		expect(transformResult.systemPrompt).toContain("[INJECTED_SYSTEM_GUIDELINE]");

		// Test lifecycle event forwarding
		let sessionStarted = false;
		let agentSettled = false;
		let turnStarted = false;

		ctx.on("pi/session-start" as any, () => { sessionStarted = true; });
		ctx.on("pi/agent-settled" as any, () => { agentSettled = true; });
		ctx.on("pi/turn-start" as any, () => { turnStarted = true; });

		eventHandlers["session_start"]({ reason: "startup" });
		eventHandlers["agent_settled"]({});
		eventHandlers["turn_start"]({ turnIndex: 1, timestamp: Date.now() });

		expect(sessionStarted).toBe(true);
		expect(agentSettled).toBe(true);
		expect(turnStarted).toBe(true);
	});
});

