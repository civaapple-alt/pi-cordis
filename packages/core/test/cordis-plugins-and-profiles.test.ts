import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { describe, expect, it } from "vitest";
import { createPiContext } from "../src/core/cordis/index.ts";
import { BUILTIN_PROFILES, applyProfile, loadProfilesFromYaml, setupPluginHmr } from "@pi-cordis/profiles";

describe("Cordis Native Plugins and Profiles System", () => {
	it("should define standard built-in profiles", () => {
		expect(BUILTIN_PROFILES.default).toBeDefined();
		expect(BUILTIN_PROFILES.safe).toBeDefined();
		expect(BUILTIN_PROFILES.strict).toBeDefined();
		expect(BUILTIN_PROFILES.full).toBeDefined();
		expect(BUILTIN_PROFILES.minimal).toBeDefined();
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

	it("should support safe profile with safety-gate interceptor", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "safe" });

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
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "safe" });

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

	it("should support minimal profile without extra plugins", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "minimal" });
		const toolNames = ctx.tools.getToolNames();
		expect(toolNames).not.toContain("todo_write");
	});

	it("should provide /profile slash command with completions and switching handler", async () => {
		const { createProfileCommandExtension } = await import("../src/core/cordis/profile-command.ts");
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "minimal" });

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
		const completions = registeredCommand.getArgumentCompletions("s");
		expect(completions.some((c: any) => c.value === "safe")).toBe(true);
		expect(completions.some((c: any) => c.value === "strict")).toBe(true);

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

		await registeredCommand.handler("safe", mockUI);
		expect(notification).toContain('Switched to profile: "safe"');
		expect(notification).toContain("safety-gate");
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

		hmr.reloadCurrentProfile();

		expect(reloadFired).toBe(true);
		expect(updatedProfileName).toBe("custom-hmr");

		hmr.stop();
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
	});

	it("should register /btw command and setup OSC 777 terminal notifier", async () => {
		const { createBtwCommandExtension, setupTerminalNotifier } = await import("../src/core/cordis/profile-command.ts");
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "default" });

		let registeredCommand: any;
		const mockPi: any = {
			registerCommand: (name: string, def: any) => {
				registeredCommand = { name, ...def };
			},
		};

		const ext = createBtwCommandExtension(ctx);
		ext(mockPi);

		expect(registeredCommand).toBeDefined();
		expect(registeredCommand.name).toBe("btw");

		let notifyMsg = "";
		const mockUI: any = {
			hasUI: true,
			ui: {
				notify: (msg: string) => {
					notifyMsg = msg;
				},
			},
		};

		await registeredCommand.handler("why use Cordis?", mockUI);
		expect(notifyMsg).toContain("[btw answer]");

		// Test terminal notifier disposer
		const disposeNotifier = setupTerminalNotifier(ctx);
		expect(typeof disposeNotifier).toBe("function");
		disposeNotifier();
	});
});
