import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { describe, expect, it } from "vitest";
import { createPiContext } from "../src/core/cordis/index.ts";
import { BUILTIN_PROFILES, applyProfile, loadProfilesFromYaml, setupPluginHmr } from "@pi-cordis/profiles";

describe("Cordis Native Plugins and Profiles System", () => {
	it("should keep only the two profiles that materially change the capability presentation", () => {
		expect(BUILTIN_PROFILES.default).toBeDefined();
		expect(BUILTIN_PROFILES.ptc).toBeDefined();
		expect(BUILTIN_PROFILES.plan).toBeUndefined();
		expect(Object.keys(BUILTIN_PROFILES)).toEqual(["default", "ptc"]);
	});

	it("should initialize Pi context with default profile (rules-injector + todo-tracker)", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "default" });

		// Verify core services exist
		expect(ctx.settings).toBeDefined();
		expect(ctx.ai).toBeDefined();
		expect(ctx.tools).toBeDefined();

		// Verify todo tools registered by todo-tracker
		const toolNames = ctx.tools.getToolNames();
		expect(toolNames).toContain("todo_write");
		expect(toolNames).toContain("todo_read");
		expect(toolNames).toContain("exit_plan_mode");
	});

	it("should support default profile with safety-gate interceptor", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "default" });

		// Trigger safety-gate on protected file write
		let blocked = false;
		try {
			await ctx.parallel("pi/tool-call", {
				name: "write",
				args: { path: ".env", content: "SECRET=123" },
			});
		} catch (err: any) {
			blocked = true;
			const msg = String(err) + (err.errors ? err.errors.map(String).join(" ") : "");
			expect(msg).toContain("safety-gate");
		}

		expect(blocked).toBe(true);
	});

	it("should block dangerous bash commands under safety-gate", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "default" });

		let blocked = false;
		try {
			await ctx.parallel("pi/tool-call", {
				name: "bash",
				args: { command: "rm -rf /" },
			});
		} catch (err: any) {
			blocked = true;
			const msg = String(err) + (err.errors ? err.errors.map(String).join(" ") : "");
			expect(msg).toContain("Dangerous command blocked");
		}

		expect(blocked).toBe(true);
	});

	it("should reject the removed plan profile with a direct mode migration", async () => {
		await expect(createPiContext({ allowModelNetwork: false, profile: "plan" })).rejects.toThrow(
			'Plan is session state. Use "picds --plan" or /plan instead',
		);
		await expect(createPiContext({ allowModelNetwork: false, profile: "minimal" })).rejects.toThrow(
			'Unknown profile "minimal"',
		);
	});

	it("should provide /profile slash command with completions and switching handler", async () => {
		const { createProfileCommandExtension } = await import("../src/core/cordis/profile-command.ts");
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "default" });

		let registeredCommand: any;
		const mockPi: any = {
			registerCommand: (name: string, def: any) => {
				registeredCommand = { name, ...def };
			},
		};

		const ext = createProfileCommandExtension(ctx);
		ext(mockPi);

		expect(registeredCommand).toBeDefined();
		expect(registeredCommand.name).toBe("profile");

		// Test autocompletions
		const completions = registeredCommand.getArgumentCompletions("p");
		expect(completions.some((c: any) => c.value === "plan")).toBe(false);
		expect(completions.some((c: any) => c.value === "ptc")).toBe(true);

		// Test switching via handler
		let notification = "";
		const mockUI: any = {
			hasUI: true,
			ui: {
				notify: (msg: string) => {
					notification = msg;
				},
			},
		};

		await registeredCommand.handler("ptc", mockUI);
		expect(notification).toContain('Switched to profile: "ptc"');
		expect(notification).toContain('Previous profile: "default"');
		expect(notification).toContain("Added: code-mode");
		expect(notification).toContain("Removed: btw, terminal-notifier");

		let selectorTitle = "";
		let selectorItems: string[] = [];
		await registeredCommand.handler("", {
			hasUI: true,
			ui: {
				select: async (title: string, items: string[]) => {
					selectorTitle = title;
					selectorItems = items;
					return undefined;
				},
			},
		});
		expect(selectorTitle).toContain("Current Profile: ptc");
		expect(selectorItems.some((item) => item.startsWith("● ptc -"))).toBe(true);
		expect(notification).toContain("code-mode");
		await expect(registeredCommand.handler("plan", mockUI)).rejects.toThrow("Plan is session state");
	});

	it("should load and merge custom profiles from YAML configuration", async () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-cordis-test-"));
		const yamlContent = `
profiles:
  custom-audit:
    description: "Custom audit profile"
    plugins:
      safety-gate:
        readOnly: true
      rules-injector: true
`;
		fs.writeFileSync(path.join(tmpDir, "cordis.yml"), yamlContent, "utf-8");

		const profiles = loadProfilesFromYaml(tmpDir);
		expect(profiles["custom-audit"]).toBeDefined();
		expect(profiles["custom-audit"].description).toBe("Custom audit profile");
		expect(profiles["custom-audit"].plugins["safety-gate"]).toEqual({ readOnly: true });

		// Cleanup
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it("should load directory-based presets with preset.yml and cordis.yml", async () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-cordis-preset-test-"));
		const presetDir = path.join(tmpDir, "presets", "reviewer");
		fs.mkdirSync(presetDir, { recursive: true });

		fs.writeFileSync(
			path.join(presetDir, "preset.yml"),
			"name: 代码审查模式\ndescription: 专属代码审查与诊断预设\n",
			"utf-8",
		);

		fs.writeFileSync(
			path.join(presetDir, "cordis.yml"),
			"- name: '@pi-cordis/plugin-safety-gate'\n  config:\n    readOnly: true\n- name: '@pi-cordis/plugin-rules-injector'\n",
			"utf-8",
		);

		const profiles = loadProfilesFromYaml(tmpDir);
		expect(profiles.reviewer).toBeDefined();
		expect(profiles.reviewer.name).toBe("代码审查模式");
		expect(profiles.reviewer.description).toBe("专属代码审查与诊断预设");
		expect(profiles.reviewer.plugins["safety-gate"]).toEqual({ readOnly: true });
		expect(profiles.reviewer.plugins["rules-injector"]).toBe(true);

		// Cleanup
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it("prefers project .picds presets and does not merge legacy .pi when both exist", () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-cordis-profile-priority-"));
		try {
			const legacyDir = path.join(tmpDir, ".pi", "presets", "review");
			const picdsDir = path.join(tmpDir, ".picds", "presets", "review");
			fs.mkdirSync(legacyDir, { recursive: true });
			fs.mkdirSync(picdsDir, { recursive: true });
			fs.writeFileSync(path.join(legacyDir, "cordis.yml"), "- name: '@pi-cordis/plugin-plan-mode'\n");
			fs.writeFileSync(path.join(picdsDir, "cordis.yml"), "- name: '@pi-cordis/plugin-safety-gate'\n");

			const profiles = loadProfilesFromYaml(tmpDir);
			expect(profiles.review.plugins["safety-gate"]).toBe(true);
			expect(profiles.review.plugins["plan-mode"]).toBeUndefined();
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it("fails fast on malformed profile YAML without disposing the active profile", async () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-cordis-invalid-profile-"));
		const presetDir = path.join(tmpDir, "presets", "broken");
		fs.mkdirSync(presetDir, { recursive: true });
		fs.writeFileSync(path.join(presetDir, "cordis.yml"), "- name: [unterminated", "utf8");
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "default" });
		try {
			expect(ctx.tools.has("todo_write")).toBe(true);
			expect(() => loadProfilesFromYaml(tmpDir)).toThrow("Failed to parse profile YAML");
			await expect(applyProfile(ctx, "broken", undefined, { cwd: tmpDir })).rejects.toThrow(
				"Failed to parse profile YAML",
			);
			expect(ctx.tools.has("todo_write")).toBe(true);
		} finally {
			await ctx.fiber.dispose();
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it("rejects unknown profile plugins without disposing the active profile", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "default" });
		expect(ctx.tools.has("todo_write")).toBe(true);

		await expect(
			applyProfile(ctx, "default", { "not-a-real-plugin": true } as any),
		).rejects.toThrow("unsupported Cordis plugins");
		expect(ctx.tools.has("todo_write")).toBe(true);
	});

	it("rejects unknown profile names instead of silently loading default", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "default" });
		await expect(applyProfile(ctx, "typo-profile")).rejects.toThrow('Unknown profile "typo-profile"');
		expect(ctx.tools.has("todo_write")).toBe(true);
	});

	it("should support HMR reload of presets and active plugins", async () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-cordis-hmr-test-"));
		const presetDir = path.join(tmpDir, "presets", "custom-hmr");
		fs.mkdirSync(presetDir, { recursive: true });

		fs.writeFileSync(
			path.join(presetDir, "preset.yml"),
			"name: HMR Test\ndescription: HMR Description\n",
			"utf-8",
		);

		fs.writeFileSync(
			path.join(presetDir, "cordis.yml"),
			"- name: '@pi-cordis/plugin-todo-tracker'\n",
			"utf-8",
		);

		const ctx = await createPiContext({
			cwd: tmpDir,
			allowModelNetwork: false,
			profile: "custom-hmr",
			enableHmr: true,
		});

		let reloadFired = false;
		let updatedProfileName = "";

		ctx.on("pi/hmr-preset-update" as any, (evt: any) => {
			reloadFired = true;
			updatedProfileName = evt.profileName;
		});

		// Trigger reload
		const hmr = (ctx as any).hmrManager;
		expect(hmr).toBeDefined();
		const profileCommand = ctx.extensions.getRegisteredCommands().get("profile")!;
		await profileCommand.handler("default", { hasUI: false, cwd: tmpDir });
		expect(hmr.currentProfileName).toBe("default");
		await profileCommand.handler("custom-hmr", { hasUI: false, cwd: tmpDir });
		expect(hmr.currentProfileName).toBe("custom-hmr");

		// Update preset YAML file content
		fs.writeFileSync(
			path.join(presetDir, "cordis.yml"),
			"- name: '@pi-cordis/plugin-safety-gate'\n  config:\n    readOnly: true\n",
			"utf-8",
		);

		await hmr.reloadCurrentProfile();

		expect(reloadFired).toBe(true);
		expect(updatedProfileName).toBe("custom-hmr");
		hmr.activeForks.set("broken", { dispose: async () => { throw new Error("dispose failed"); } });
		await expect(hmr.reloadCurrentProfile()).rejects.toThrow("failed to dispose 1 hot-loaded plugin Fiber");
		hmr.activeForks.delete("broken");

		await hmr.stop();
		// Cleanup
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it("should detect and reject circular dependencies in todo-tracker", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "default" });
		const tool = ctx.tools.get("todo_write");

		// Add task 1
		await tool!.execute({ action: "add", id: "t1", title: "Task 1" });

		// Add task 2 depending on task 1
		await tool!.execute({ action: "add", id: "t2", title: "Task 2", dependsOn: ["t1"] });

		// Attempt to make task 1 depend on task 2 (creates cycle t1 -> t2 -> t1)
		const cycleRes = await tool!.execute({ action: "update", id: "t1", dependsOn: ["t2"] });
		expect(cycleRes.error).toContain("Cyclic dependency detected");

		// Attempt self-dependency
		const selfDepRes = await tool!.execute({ action: "add", id: "t3", title: "Task 3", dependsOn: ["t3"] });
		expect(selfDepRes.error).toContain("cannot depend on itself");

		const duplicateRes = await tool!.execute({ action: "add", id: "t1", title: "Duplicate" });
		expect(duplicateRes.error).toContain("already exists");

		const blockedRes = await tool!.execute({ action: "update", id: "t2", status: "in_progress" });
		expect(blockedRes.error).toContain("blocked by incomplete dependencies: t1");
		const atomicFailure = await tool!.execute({
			action: "update",
			id: "t2",
			title: "Must not be committed",
			dependsOn: ["missing"],
			status: "in_progress",
		});
		expect(atomicFailure.error).toContain("blocked by incomplete dependencies: missing");
		const afterAtomicFailure = await ctx.tools.get("todo_read")!.execute({});
		expect(afterAtomicFailure.todos.find((todo: any) => todo.id === "t2")).toMatchObject({
			title: "Task 2",
			dependsOn: ["t1"],
		});
		await tool!.execute({ action: "update", id: "t1", status: "completed" });
		const unblockedRes = await tool!.execute({ action: "update", id: "t2", status: "in_progress" });
		expect(unblockedRes.item.status).toBe("in_progress");
	});

	it("keeps todo state isolated by Pi session and stable across Profile switches", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "default" });
		const forSession = (sessionId: string) => ({
			ctx: { sessionManager: { getSessionId: () => sessionId } },
		});
		await ctx.tools.get("todo_write")!.execute(
			{ action: "add", id: "session-task", title: "Session A task" },
			forSession("session-a"),
		);
		expect((await ctx.tools.get("todo_read")!.execute({}, forSession("session-a"))).total).toBe(1);
		expect((await ctx.tools.get("todo_read")!.execute({}, forSession("session-b"))).total).toBe(0);

		const profile = ctx.extensions.getRegisteredCommands().get("profile")!;
		await profile.handler("ptc", { hasUI: false });
		await profile.handler("default", { hasUI: false });
		expect((await ctx.tools.get("todo_read")!.execute({}, forSession("session-a"))).todos[0].title)
			.toBe("Session A task");
		await ctx.fiber.dispose();
	});

	it("should register /btw command and setup OSC 777 terminal notifier", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "default" });

		// 1. Verify ExtensionService collected commands from plugins
		const commands = ctx.extensions.getRegisteredCommands();
		expect(commands.has("profile")).toBe(true);
		expect(commands.has("btw")).toBe(true);

		// 2. Verify createBridgeExtensionFactory bridges commands to pi
		const bridge = ctx.extensions.createBridgeExtensionFactory();
		expect(bridge.name).toBe("cordis-bridge");
		expect(bridge.hidden).toBe(true);

		const registeredInPi = new Map<string, any>();
		const toolsRegisteredInPi = new Map<string, any>();
		const mockPi: any = {
			registerCommand: (name: string, def: any) => {
				registeredInPi.set(name, def);
			},
			registerTool: (toolDef: any) => {
				toolsRegisteredInPi.set(toolDef.name, toolDef);
			},
		};
		bridge.factory(mockPi);

		expect(registeredInPi.has("profile")).toBe(true);
		expect(registeredInPi.has("btw")).toBe(true);

		// Verify custom tools and search tools bridged to Pi
		expect(toolsRegisteredInPi.has("grep")).toBe(true);
		expect(toolsRegisteredInPi.has("find")).toBe(true);
		expect(toolsRegisteredInPi.has("ls")).toBe(true);
		expect(toolsRegisteredInPi.has("ask_question")).toBe(true);
		expect(toolsRegisteredInPi.has("todo_write")).toBe(true);
		expect(toolsRegisteredInPi.has("exit_plan_mode")).toBe(true);

		// 3. Test /btw handler without active model
		let notifyMsg = "";
		const mockUI: any = {
			hasUI: true,
			ui: {
				notify: (msg: string) => {
					notifyMsg = msg;
				},
			},
		};

		const btwDef = registeredInPi.get("btw");
		await btwDef.handler("why use Cordis?", mockUI);
		expect(notifyMsg).toContain("[btw answer]");
		expect(notifyMsg).toContain("No active or available LLM configured");

		// 4. Test /btw handler with mock AI runtime
		const mockModel = { id: "test-model", provider: "mock", api: "mock" };
		ctx.ai.activeModel = mockModel as any;
		(ctx.ai.getRuntime() as any).completeSimple = async () => ({
			content: [{ type: "text", text: "Cordis provides a modular microkernel architecture." }],
		});

		let queryEventReceived = false;
		let responseEventReceived = false;
		ctx.on("pi/btw-query" as any, () => { queryEventReceived = true; });
		ctx.on("pi/btw-response" as any, () => { responseEventReceived = true; });

		await btwDef.handler("what is Cordis?", mockUI);
		expect(notifyMsg).toContain("[btw: test-model]");
		expect(notifyMsg).toContain("Cordis provides a modular microkernel architecture.");
		expect(queryEventReceived).toBe(true);
		expect(responseEventReceived).toBe(true);
	});

	it("should dynamically mask tools and expose run_code when switching to ptc profile", async () => {
		const ctx = await createPiContext({ profile: "default" });

		let activeToolsInPi: string[] = [];
		let sessionStart: Function | undefined;
		const mockPi: any = {
			registerCommand: () => {},
			registerTool: () => {},
			on: (eventName: string, handler: Function) => {
				if (eventName === "session_start") sessionStart = handler;
			},
			setActiveTools: (tools: string[]) => {
				activeToolsInPi = tools;
			},
		};

		const bridge = ctx.extensions.createBridgeExtensionFactory();
		bridge.factory(mockPi);
		expect(activeToolsInPi).toEqual([]);
		sessionStart?.({ reason: "startup" });

		expect(activeToolsInPi).toContain("grep");
		expect(activeToolsInPi).toContain("ask_question");

		// Switch to ptc profile
		const profileDef = ctx.extensions.getRegisteredCommands().get("profile");
		expect(profileDef).toBeDefined();

		await profileDef!.handler("ptc", { hasUI: false });

		// In PTC mode, raw tools are masked, and run_code is active
		expect(activeToolsInPi).toContain("run_code");
		expect(activeToolsInPi).not.toContain("read");
		expect(activeToolsInPi).not.toContain("bash");
		expect(activeToolsInPi).not.toContain("edit");
		expect(activeToolsInPi).not.toContain("grep");

		// Switch back to default
		await profileDef!.handler("default", { hasUI: false });
		expect(activeToolsInPi).toContain("read");
		expect(activeToolsInPi).toContain("bash");
		expect(activeToolsInPi).not.toContain("run_code");
	});

	it("should keep Plan state and exit_plan_mode stable across Profile switches", async () => {
		const ctx = await createPiContext({ profile: "default" });
		const planCommand = ctx.extensions.getRegisteredCommands().get("plan");
		expect(planCommand).toBeDefined();
		await planCommand!.handler("on", { hasUI: false });

		const promptBefore = { prompt: "Base prompt" };
		await ctx.serial("pi/prompt-transform", promptBefore);
		expect(promptBefore.prompt).toContain("## Plan mode");
		expect(ctx.tools.has("exit_plan_mode")).toBe(true);

		const profileDef = ctx.extensions.getRegisteredCommands().get("profile");
		await profileDef!.handler("ptc", { hasUI: false });
		expect(ctx.tools.has("exit_plan_mode")).toBe(true);
		expect(ctx.tools.has("run_code")).toBe(true);

		const promptInPtc = { prompt: "PTC prompt" };
		await ctx.serial("pi/prompt-transform", promptInPtc);
		expect(promptInPtc.prompt).toContain("## Plan mode");
		expect(promptInPtc.prompt).toContain("Programmatic Tool Calling");

		await profileDef!.handler("default", { hasUI: false });
		expect(ctx.tools.has("exit_plan_mode")).toBe(true);

		const approved = await ctx.tools.get("exit_plan_mode")!.execute(
			{ plan: "# Refactor database\n\n1. Add transaction wrapper." },
			{
				ctx: {
					hasUI: true,
					ui: { select: async () => "Approve and leave Plan mode", notify: () => {} },
				},
			},
		);
		expect(approved.details.approved).toBe(true);

		const promptAfter = { prompt: "After approval" };
		await ctx.serial("pi/prompt-transform", promptAfter);
		expect(promptAfter.prompt).toBe("After approval");

		await ctx.fiber.dispose();
	});
});
