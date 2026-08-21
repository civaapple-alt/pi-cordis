import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
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
		const agentDir = fs.mkdtempSync(path.join(os.tmpdir(), "picds-auth-test-"));
		let ctx: Awaited<ReturnType<typeof createPiContext>> | undefined;
		try {
			ctx = await createPiContext({ cwd: process.cwd(), agentDir, allowModelNetwork: false });
			let authUpdated = false;
			ctx.on("pi/auth-updated", () => {
				authUpdated = true;
			});

			await ctx.auth.setApiKey("test-provider", "sk-test-123456");
			expect(authUpdated).toBe(true);
			expect(await ctx.auth.getApiKey("test-provider")).toBe("sk-test-123456");
		} finally {
			await ctx?.fiber.dispose();
			fs.rmSync(agentDir, { recursive: true, force: true });
		}
	});

	it("2.1 AuthService: serializes concurrent writes without losing providers", async () => {
		const agentDir = fs.mkdtempSync(path.join(os.tmpdir(), "picds-auth-concurrency-test-"));
		let ctx: Awaited<ReturnType<typeof createPiContext>> | undefined;
		try {
			ctx = await createPiContext({ cwd: process.cwd(), agentDir, allowModelNetwork: false });
			await Promise.all([
				ctx.auth.setApiKey("first", "first-key"),
				ctx.auth.setApiKey("second", "second-key"),
			]);

			const stored = JSON.parse(fs.readFileSync(path.join(agentDir, "auth.json"), "utf8"));
			expect(stored).toEqual({
				first: { type: "api_key", key: "first-key" },
				second: { type: "api_key", key: "second-key" },
			});
		} finally {
			await ctx?.fiber.dispose();
			fs.rmSync(agentDir, { recursive: true, force: true });
		}
	});

	it("2.2 AuthService: rejects malformed storage without overwriting it", async () => {
		const agentDir = fs.mkdtempSync(path.join(os.tmpdir(), "picds-auth-invalid-test-"));
		const authPath = path.join(agentDir, "auth.json");
		fs.writeFileSync(authPath, "{broken", "utf8");
		let ctx: Awaited<ReturnType<typeof createPiContext>> | undefined;
		try {
			ctx = await createPiContext({ cwd: process.cwd(), agentDir, allowModelNetwork: false });
			await expect(ctx.auth.setApiKey("test-provider", "new-key")).rejects.toThrow(
				"Failed to read auth.json",
			);
			expect(fs.readFileSync(authPath, "utf8")).toBe("{broken");
			await expect(ctx.auth.has("test-provider")).rejects.toThrow("Failed to read auth.json");
		} finally {
			await ctx?.fiber.dispose();
			fs.rmSync(agentDir, { recursive: true, force: true });
		}
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

	it("4.1 ToolRegistryService: post hooks transform returned results", async () => {
		const ctx = await createPiContext({ cwd: process.cwd(), allowModelNetwork: false, profile: false });
		ctx.on("pi/tool-result", (event) => {
			event.result = { transformed: true, original: event.result };
		});
		ctx.tools.register({
			name: "transform_me",
			description: "result transform test",
			execute: async () => ({ value: 42 }),
		});

		await expect(ctx.tools.executeTool("transform_me", {})).resolves.toEqual({
			transformed: true,
			original: { value: 42 },
		});
	});

	it("4.2 ToolRegistryService: disposing shadow registrations restores the previous tool", async () => {
		const ctx = await createPiContext({ cwd: process.cwd(), allowModelNetwork: false, profile: false });
		const disposeFirst = ctx.tools.register({
			name: "shadowed",
			description: "first",
			execute: async () => "first",
		});
		const disposeSecond = ctx.tools.register({
			name: "shadowed",
			description: "second",
			execute: async () => "second",
		});

		await expect(ctx.tools.executeTool("shadowed", {})).resolves.toBe("second");
		disposeSecond();
		await expect(ctx.tools.executeTool("shadowed", {})).resolves.toBe("first");
		disposeFirst();
		expect(ctx.tools.has("shadowed")).toBe(false);
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
		const unregisterOverride = ctx.skills.registerSkill({
			name: "custom-deploy-skill",
			description: "Override",
		});
		expect(ctx.skills.getSkill("custom-deploy-skill")?.description).toBe("Override");

		unregister();
		expect(ctx.skills.getSkill("custom-deploy-skill")?.description).toBe("Override");
		unregisterOverride();
		expect(skillUnregistered).toBe("custom-deploy-skill");
		expect(ctx.skills.getSkill("custom-deploy-skill")).toBeUndefined();
	});

	it("7. PromptsService: loads Pi templates and restores shadowed dynamic registrations", async () => {
		const agentDir = fs.mkdtempSync(path.join(os.tmpdir(), "picds-prompts-test-"));
		fs.mkdirSync(path.join(agentDir, "prompts"), { recursive: true });
		fs.writeFileSync(
			path.join(agentDir, "prompts", "disk-review.md"),
			"---\ndescription: Review from disk\n---\nReview the staged changes.\n",
			"utf8",
		);
		const ctx = await createPiContext({ cwd: process.cwd(), agentDir, allowModelNetwork: false });
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
		expect(await ctx.prompts.getPrompt("review-pr")).toBeDefined();
		expect((await ctx.prompts.getPrompt("disk-review"))?.description).toBe("Review from disk");
		const unregisterOverride = ctx.prompts.registerPrompt({
			name: "review-pr",
			description: "Override review",
		});
		expect((await ctx.prompts.getPrompt("review-pr"))?.description).toBe("Override review");

		unregister();
		expect((await ctx.prompts.getPrompt("review-pr"))?.description).toBe("Override review");
		unregisterOverride();
		expect(await ctx.prompts.getPrompt("review-pr")).toBeUndefined();
		await ctx.fiber.dispose();
		fs.rmSync(agentDir, { recursive: true, force: true });
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
		const providers = new Map<string, unknown>();
		let switchedModel: unknown;
		const disposeProvider = ctx.ai.registerProvider("bridge-provider", {
			baseUrl: "https://bridge.invalid/v1",
			api: "openai-compatible",
		});

		const mockPi: any = {
			registerTool: () => {},
			registerCommand: () => {},
			on: (eventName: string, handler: Function) => {
				eventHandlers[eventName] = handler;
			},
			registerProvider: (name: string, config: unknown) => providers.set(name, config),
			unregisterProvider: (name: string) => providers.delete(name),
			setModel: async (model: unknown) => {
				switchedModel = model;
				return true;
			},
		};

		const bridge = ctx.extensions.createBridgeExtensionFactory();
		bridge.factory(mockPi);
		expect(providers.has("bridge-provider")).toBe(true);

		expect(eventHandlers["before_agent_start"]).toBeDefined();
		expect(eventHandlers["session_start"]).toBeDefined();
		expect(eventHandlers["agent_settled"]).toBeDefined();
		expect(eventHandlers["turn_start"]).toBeDefined();
		expect(eventHandlers["model_select"]).toBeDefined();

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

		const selectedModel = { provider: "deepseek", id: "deepseek-chat", api: "openai-completions" };
		eventHandlers["model_select"]({ model: selectedModel });
		expect(ctx.ai.activeModel).toBe(selectedModel);
		const switched = await ctx.ai.switchModel(selectedModel as any);
		expect(switched).toBe(true);
		expect(switchedModel).toBe(selectedModel);

		// Test lifecycle event forwarding
		let sessionStarted = false;
		let sessionReason = "";
		let bridgedSessionId = "";
		let agentSettled = false;
		let turnStarted = false;

		ctx.on("pi/session-start" as any, (event: { reason?: string; sessionId?: string }) => {
			sessionStarted = true;
			sessionReason = event.reason ?? "";
			bridgedSessionId = event.sessionId ?? "";
		});
		ctx.on("pi/agent-settled" as any, () => { agentSettled = true; });
		ctx.on("pi/turn-start" as any, () => { turnStarted = true; });

		eventHandlers["session_start"](
			{ reason: "startup" },
			{ sessionManager: { getSessionId: () => "interactive-session" } },
		);
		eventHandlers["agent_settled"]({});
		eventHandlers["turn_start"]({ turnIndex: 1, timestamp: Date.now() });

		expect(sessionStarted).toBe(true);
		expect(sessionReason).toBe("startup");
		expect(bridgedSessionId).toBe("interactive-session");
		expect(agentSettled).toBe(true);
		expect(turnStarted).toBe(true);

		const removeFailure = ctx.on("pi/prompt-transform" as any, () => {
			throw new Error("invalid supplemental rules");
		});
		await expect(eventHandlers["before_agent_start"]({ systemPrompt: "base", prompt: "user" }))
			.rejects.toThrow("invalid supplemental rules");
		removeFailure();
		disposeProvider();
		expect(providers.has("bridge-provider")).toBe(false);
	});

	it("11.0 ExtensionService: defers action methods until Pi binds the runtime and keeps failures observable", async () => {
		const ctx = await createPiContext({ cwd: process.cwd(), allowModelNetwork: false, profile: false });
		const bridge = ctx.extensions.createBridgeExtensionFactory();
		let sessionStart: Function | undefined;
		let runtimeReady = false;
		expect(() => bridge.factory({
			registerTool: () => {},
			registerCommand: () => {},
			on: (eventName: string, handler: Function) => {
				if (eventName === "session_start") sessionStart = handler;
			},
			setActiveTools: () => {
				if (!runtimeReady) {
					throw new Error("Extension runtime not initialized");
				}
				throw new Error("Pi tool visibility rejected");
			},
		})).not.toThrow();
		expect(sessionStart).toBeDefined();

		runtimeReady = true;
		expect(() => sessionStart?.({ reason: "startup" })).toThrow("Pi tool visibility rejected");
		await ctx.fiber.dispose();
	});

	it("11.1 ExtensionService: command bridges dispatch the active reversible registration", async () => {
		const ctx = await createPiContext({ cwd: process.cwd(), allowModelNetwork: false, profile: false });
		const commands = new Map<string, any>();
		ctx.extensions.createBridgeExtensionFactory().factory({
			registerTool: () => {},
			registerCommand: (name: string, definition: any) => commands.set(name, definition),
			on: () => {},
			setActiveTools: () => {},
		});

		const calls: string[] = [];
		const disposeFirst = ctx.extensions.registerCommand("temporary", {
			description: "first",
			handler: () => { calls.push("first"); },
		});
		const disposeSecond = ctx.extensions.registerCommand("temporary", {
			description: "second",
			handler: () => { calls.push("second"); },
		});
		const proxy = commands.get("temporary");
		await proxy.handler("", {});
		expect(calls).toEqual(["second"]);

		disposeFirst();
		await proxy.handler("", {});
		expect(calls).toEqual(["second", "second"]);

		let unavailable = "";
		disposeSecond();
		await proxy.handler("", { ui: { notify: (message: string) => { unavailable = message; } } });
		expect(unavailable).toContain("unavailable in the active profile");
		await ctx.fiber.dispose();
	});

	it("11.2 ExtensionService: submits user messages only through the live Pi runtime", async () => {
		const ctx = await createPiContext({ cwd: process.cwd(), allowModelNetwork: false, profile: false });
		const eventHandlers: Record<string, Function> = {};
		const submitted: Array<{ content: string; options?: { deliverAs?: string } }> = [];
		ctx.extensions.createBridgeExtensionFactory().factory({
			registerTool: () => {},
			registerCommand: () => {},
			on: (eventName: string, handler: Function) => {
				eventHandlers[eventName] = handler;
			},
			sendUserMessage: (content: string, options?: { deliverAs?: string }) => {
				submitted.push({ content, options });
			},
			setActiveTools: () => {},
		});

		expect(() => ctx.extensions.sendUserMessage("too early")).toThrow("runtime is not ready");
		eventHandlers.session_start({ reason: "startup" }, {});
		ctx.extensions.sendUserMessage("continue planning", { deliverAs: "steer" });
		expect(submitted).toEqual([{
			content: "continue planning",
			options: { deliverAs: "steer" },
		}]);

		eventHandlers.session_shutdown({ reason: "exit" });
		expect(() => ctx.extensions.sendUserMessage("too late")).toThrow("runtime is not ready");
		await ctx.fiber.dispose();
	});

	it("12. ExtensionService: returns Cordis tool-result transformations to Pi", async () => {
		const ctx = await createPiContext({ cwd: process.cwd(), allowModelNetwork: false, profile: false });
		const eventHandlers: Record<string, Function> = {};
		ctx.on("pi/tool-result", (event) => {
			const result = event.result as any;
			result.content[0].text = "transformed by Cordis";
		});

		ctx.extensions.createBridgeExtensionFactory().factory({
			registerTool: () => {},
			registerCommand: () => {},
			on: (eventName: string, handler: Function) => {
				eventHandlers[eventName] = handler;
			},
		});

		const transformed = await eventHandlers.tool_result({
			toolName: "read",
			input: { path: "README.md" },
			content: [{ type: "text", text: "original" }],
			details: undefined,
			isError: false,
		});

		expect(transformed.content[0].text).toBe("transformed by Cordis");
		expect(transformed.isError).toBe(false);
	});
});
