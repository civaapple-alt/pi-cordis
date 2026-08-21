import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { describe, expect, it } from "vitest";
import { createPiContext } from "../src/core/cordis/index.ts";
import { BUILTIN_PROFILES, applyProfile, loadProfilesFromYaml, setupPluginHmr } from "@pi-cordis/profiles";

describe("Cordis Native Plugins and Profiles System", () => {
	it("should define 3 standard canonical presets", () => {
		expect(BUILTIN_PROFILES.default).toBeDefined();
		expect(BUILTIN_PROFILES.plan).toBeDefined();
		expect(BUILTIN_PROFILES.ptc).toBeDefined();
		expect(Object.keys(BUILTIN_PROFILES)).toEqual(["default", "plan", "ptc"]);
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

	it("should support plan profile with read-only protection", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "plan" });
		const toolNames = ctx.tools.getToolNames();
		expect(toolNames).toContain("plan_step");
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
		expect(completions.some((c: any) => c.value === "plan")).toBe(true);
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

		await registeredCommand.handler("plan", mockUI);
		expect(notification).toContain('Switched to profile: "plan"');
		expect(notification).toContain("plan-mode");
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
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "minimal" });
		await expect(applyProfile(ctx, "typo-profile")).rejects.toThrow('Unknown profile "typo-profile"');
		expect(ctx.tools.has("todo_write")).toBe(false);
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

		// Update preset YAML file content
		fs.writeFileSync(
			path.join(presetDir, "cordis.yml"),
			"- name: '@pi-cordis/plugin-safety-gate'\n  config:\n    readOnly: true\n",
			"utf-8",
		);

		await hmr.reloadCurrentProfile();

		expect(reloadFired).toBe(true);
		expect(updatedProfileName).toBe("custom-hmr");

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
		await tool!.execute({ action: "update", id: "t1", status: "completed" });
		const unblockedRes = await tool!.execute({ action: "update", id: "t2", status: "in_progress" });
		expect(unblockedRes.item.status).toBe("in_progress");
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
		const mockPi: any = {
			registerCommand: () => {},
			registerTool: () => {},
			setActiveTools: (tools: string[]) => {
				activeToolsInPi = tools;
			},
		};

		const bridge = ctx.extensions.createBridgeExtensionFactory();
		bridge.factory(mockPi);

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

	it("should keep planning controls scoped to plan mode while preserving state", async () => {
		const profileCwd = fs.mkdtempSync(path.join(os.tmpdir(), "picds-profile-plan-test-"));
		const ctx = await createPiContext({ profile: "plan", cwd: profileCwd });

		const tool = ctx.tools.get("plan_step");
		expect(tool).toBeDefined();

		// Formulate plan in plan mode
		await tool!.execute({
			action: "set_plan",
			title: "Refactor Database Module",
			overview: "Upgrade schema and add transactions",
		});
		await tool!.execute({ action: "add", title: "Write transaction wrapper" });

		// Verify plan created in plan mode
		const viewResPlan = await tool!.execute({ action: "view" });
		expect(viewResPlan.planTitle).toBe("Refactor Database Module");
		expect(viewResPlan.totalSteps).toBe(1);

		// Switch to ptc mode
		const profileDef = ctx.extensions.getRegisteredCommands().get("profile");
		await profileDef!.handler("ptc", { hasUI: false });

		// PTC exposes only execution-oriented controls.
		expect(ctx.tools.has("plan_step")).toBe(false);

		// Switch to default mode
		await profileDef!.handler("default", { hasUI: false });
		expect(ctx.tools.has("plan_step")).toBe(false);

		// Switching back to plan restores the plugin and its module-level plan state.
		await profileDef!.handler("plan", { hasUI: false });
		const viewRestored = await ctx.tools.get("plan_step")!.execute({ action: "view" });
		expect(viewRestored.planTitle).toBe("Refactor Database Module");
		expect(viewRestored.totalSteps).toBe(1);

		await ctx.tools.get("plan_step")!.execute({ action: "update", id: 1, status: "completed" });
		const viewUpdated = await ctx.tools.get("plan_step")!.execute({ action: "view" });
		expect(viewUpdated.percentage).toBe(100);

		await ctx.fiber.dispose();
		fs.rmSync(profileCwd, { recursive: true, force: true });
	});
});
