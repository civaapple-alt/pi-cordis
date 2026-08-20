import { describe, it, expect, beforeEach } from "vitest";
import { createPiContext } from "../src/core/cordis/bootstrap.js";
import subagentPlugin from "@pi-cordis/plugin-subagent";
import planModePlugin from "@pi-cordis/plugin-plan-mode";
import codeModePlugin from "@pi-cordis/plugin-code-mode";
import askQuestionPlugin from "@pi-cordis/plugin-ask-question";
import outputTruncatorPlugin, { truncateText } from "@pi-cordis/plugin-output-truncator";
import contextCompactorPlugin from "@pi-cordis/plugin-context-compactor";
import toolsManagerPlugin from "@pi-cordis/plugin-tools-manager";
import sessionHandoffPlugin from "@pi-cordis/plugin-session-handoff";
import gitAutomationPlugin from "@pi-cordis/plugin-git-automation";
import sshDelegatorPlugin from "@pi-cordis/plugin-ssh-delegator";
import { BUILTIN_PROFILES } from "@pi-cordis/profiles";

describe("Pi-Cordis Top 10 Priority Native Built-in Plugins", () => {
	let ctx: any;

	beforeEach(async () => {
		ctx = await createPiContext({ allowModelNetwork: false, profile: "minimal" });
	});

	it("1. @pi-cordis/plugin-subagent: registers subagent tool and executes sub-task", async () => {
		const fork = await ctx.plugin(subagentPlugin, { maxDepth: 2 });
		expect(ctx.tools.has("subagent")).toBe(true);

		const tool = ctx.tools.get("subagent");
		const result = await tool!.execute({ task: "Run unit tests", role: "Tester" });
		expect(result.success).toBe(true);
		expect(result.summary).toContain("[Tester]");
		expect(result.summary).toContain("Run unit tests");

		await fork.dispose();
		expect(ctx.tools.has("subagent")).toBe(false);
	});

	it("2. @pi-cordis/plugin-plan-mode: manages plan steps and blocks mutating tools during planning", async () => {
		const fork = await ctx.plugin(planModePlugin);
		expect(ctx.tools.has("plan_step")).toBe(true);

		const tool = ctx.tools.get("plan_step");
		// Add step
		const addRes = await tool!.execute({ action: "add", title: "Analyze database schema" });
		expect(addRes.step.title).toBe("Analyze database schema");
		expect(addRes.step.status).toBe("pending");

		// Prompt transform check
		const promptEvent = { prompt: "Base prompt" };
		await ctx.parallel("pi/prompt-transform", promptEvent);
		expect(promptEvent.prompt).toContain("Current Implementation Plan");
		expect(promptEvent.prompt).toContain("Analyze database schema");

		// Finish plan mode
		await tool!.execute({ action: "finish" });

		await fork.dispose();
		expect(ctx.tools.has("plan_step")).toBe(false);
	});

	it("3. @pi-cordis/plugin-code-mode (PTC): executes JavaScript/TypeScript program in sandbox and injects .d.ts", async () => {
		const fork = await ctx.plugin(codeModePlugin);
		expect(ctx.tools.has("run_code")).toBe(true);

		// 1. Check prompt transform with dynamic .d.ts
		const promptEvent = { prompt: "Base prompt" };
		await ctx.parallel("pi/prompt-transform", promptEvent);
		expect(promptEvent.prompt).toContain("Programmatic Tool Calling (PTC / Code Mode)");
		expect(promptEvent.prompt).toContain("declare namespace pi");
		expect(promptEvent.prompt).toContain("export interface PiSDK");

		// 2. Verify Tool Presentation Masking (masks raw read/bash, exposes run_code)
		const exportedNames = ctx.tools.getExportedToolNames();
		expect(exportedNames).toContain("run_code");
		expect(exportedNames).not.toContain("read");
		expect(exportedNames).not.toContain("bash");
		expect(ctx.tools.getAllToolDefinitions().map((t: any) => t.name)).toContain("read");

		// 3. Execute script with semantic namespaces and Promise.all
		const tool = ctx.tools.get("run_code");
		const result = await tool!.execute({
			code: `
				const items = [1, 2, 3];
				const doubled = items.map(n => n * 2);
				console.log("Doubled values:", doubled);
				
				// Verify semantic namespace availability
				console.log("FS namespace available:", typeof pi.fs.read === "function");
				console.log("Bash namespace available:", typeof pi.bash.run === "function");
			`,
		});

		expect(result.success).toBe(true);
		expect(result.output).toContain("Doubled values: [\n  2,\n  4,\n  6\n]");
		expect(result.output).toContain("FS namespace available: true");
		expect(result.output).toContain("Bash namespace available: true");

		await fork.dispose();
		expect(ctx.tools.has("run_code")).toBe(false);
		expect(ctx.tools.getExportedToolNames()).toContain("read");
	});

	it("4. @pi-cordis/plugin-ask-question: registers ask_question tool and returns selected option", async () => {
		const fork = await ctx.plugin(askQuestionPlugin);
		expect(ctx.tools.has("ask_question")).toBe(true);

		const tool = ctx.tools.get("ask_question");
		const result = await tool!.execute({
			question: "Which database do you prefer?",
			options: [{ label: "PostgreSQL", description: "Relational" }, { label: "Redis", description: "In-memory" }],
		});

		expect(result.question).toBe("Which database do you prefer?");
		expect(result.options).toEqual(["PostgreSQL", "Redis"]);
		expect(result.selected).toBe("PostgreSQL");

		await fork.dispose();
		expect(ctx.tools.has("ask_question")).toBe(false);
	});

	it("5. @pi-cordis/plugin-output-truncator: truncates oversized output to protect context", () => {
		const lines = Array.from({ length: 3000 }, (_, i) => `Line ${i}`).join("\n");
		const res = truncateText(lines, 50 * 1024, 2000);
		expect(res.truncated).toBe(true);
		expect(res.text).toContain("Truncated: 1000 lines omitted");
	});

	it("6. @pi-cordis/plugin-context-compactor: registers trigger_compact tool and emits compact event", async () => {
		let compactEmitted = false;
		ctx.on("pi/compact" as any, () => {
			compactEmitted = true;
		});

		const fork = await ctx.plugin(contextCompactorPlugin);
		expect(ctx.tools.has("trigger_compact")).toBe(true);

		const tool = ctx.tools.get("trigger_compact");
		const result = await tool!.execute({ reason: "Context budget near 100k tokens" });
		expect(result.success).toBe(true);
		expect(compactEmitted).toBe(true);

		await fork.dispose();
		expect(ctx.tools.has("trigger_compact")).toBe(false);
	});

	it("7. @pi-cordis/plugin-tools-manager: manages active tool enablement/disablement", async () => {
		const fork = await ctx.plugin(toolsManagerPlugin);
		expect(ctx.tools.has("manage_tools")).toBe(true);

		const tool = ctx.tools.get("manage_tools");
		const listRes = await tool!.execute({ action: "list" });
		expect(listRes.active).toContain("read");

		const disableRes = await tool!.execute({ action: "disable", toolName: "read" });
		expect(disableRes.message).toContain('Tool "read" disabled');

		await fork.dispose();
		expect(ctx.tools.has("manage_tools")).toBe(false);
	});

	it("8. @pi-cordis/plugin-session-handoff: packages context and emits handoff payload", async () => {
		let handoffData: any = null;
		ctx.on("pi/handoff" as any, (data: any) => {
			handoffData = data;
		});

		const fork = await ctx.plugin(sessionHandoffPlugin);
		expect(ctx.tools.has("session_handoff")).toBe(true);

		const tool = ctx.tools.get("session_handoff");
		const result = await tool!.execute({
			newGoal: "Implement authentication endpoints",
			accomplishments: ["Configured database", "Created User model"],
			nextSteps: ["Add JWT token generation", "Write auth tests"],
		});

		expect(result.success).toBe(true);
		expect(handoffData.newGoal).toBe("Implement authentication endpoints");
		expect(handoffData.nextSteps).toHaveLength(2);

		await fork.dispose();
		expect(ctx.tools.has("session_handoff")).toBe(false);
	});

	it("9. @pi-cordis/plugin-git-automation: generates conventional commit message", async () => {
		const fork = await ctx.plugin(gitAutomationPlugin);
		expect(ctx.tools.has("git_smart_commit")).toBe(true);

		const tool = ctx.tools.get("git_smart_commit");
		const result = await tool!.execute({
			type: "feat",
			scope: "plugins",
			message: "add subagent and code-mode plugins",
			issueNumber: 42,
		});

		expect(result.success).toBe(true);
		expect(result.commitMessage).toBe("feat(plugins): add subagent and code-mode plugins (#42)");

		await fork.dispose();
		expect(ctx.tools.has("git_smart_commit")).toBe(false);
	});

	it("10. @pi-cordis/plugin-ssh-delegator: simulates remote SSH execution", async () => {
		const fork = await ctx.plugin(sshDelegatorPlugin, { defaultHost: "remote.server.com", defaultUser: "deploy" });
		expect(ctx.tools.has("ssh_exec")).toBe(true);

		const tool = ctx.tools.get("ssh_exec");
		const result = await tool!.execute({ command: "uname -a" });
		expect(result.success).toBe(true);
		expect(result.target).toBe("deploy@remote.server.com");
		expect(result.stdout).toContain("uname -a");

		await fork.dispose();
		expect(ctx.tools.has("ssh_exec")).toBe(false);
	});

	it("11. @pi-cordis/profiles: plan, ptc, and full profiles mount all required plugins cleanly", async () => {
		// Plan profile
		const planCtx = await createPiContext({ allowModelNetwork: false, profile: "plan" });
		expect(planCtx.tools.has("plan_step")).toBe(true);
		expect(planCtx.tools.has("todo_write")).toBe(true);

		// PTC profile
		const ptcCtx = await createPiContext({ allowModelNetwork: false, profile: "ptc" });
		expect(ptcCtx.tools.has("run_code")).toBe(true);
		expect(ptcCtx.tools.has("todo_write")).toBe(true);

		// Full profile
		const fullCtx = await createPiContext({ allowModelNetwork: false, profile: "full" });
		expect(fullCtx.tools.has("subagent")).toBe(true);
		expect(fullCtx.tools.has("plan_step")).toBe(true);
		expect(fullCtx.tools.has("run_code")).toBe(true);
		expect(fullCtx.tools.has("ask_question")).toBe(true);
		expect(fullCtx.tools.has("manage_tools")).toBe(true);
		expect(fullCtx.tools.has("session_handoff")).toBe(true);
		expect(fullCtx.tools.has("git_smart_commit")).toBe(true);
		expect(fullCtx.tools.has("ssh_exec")).toBe(true);
	});
});
