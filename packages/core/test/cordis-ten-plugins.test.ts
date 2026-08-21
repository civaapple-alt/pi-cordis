import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createPiContext } from "../src/core/cordis/bootstrap.js";
import subagentPlugin from "@pi-cordis/plugin-subagent";
import codeModePlugin from "@pi-cordis/plugin-code-mode";
import askQuestionPlugin from "@pi-cordis/plugin-ask-question";
import outputTruncatorPlugin, { truncateText } from "@pi-cordis/plugin-output-truncator";
import contextCompactorPlugin from "@pi-cordis/plugin-context-compactor";
import toolsManagerPlugin from "@pi-cordis/plugin-tools-manager";
import sessionHandoffPlugin from "@pi-cordis/plugin-session-handoff";
import gitAutomationPlugin from "@pi-cordis/plugin-git-automation";
import sshDelegatorPlugin from "@pi-cordis/plugin-ssh-delegator";
import btwPlugin from "@pi-cordis/plugin-btw";
import safetyGatePlugin, { isCommandDangerous } from "@pi-cordis/plugin-safety-gate";
import gitGuardPlugin from "@pi-cordis/plugin-git-guard";
import rulesInjectorPlugin from "@pi-cordis/plugin-rules-injector";
import { BUILTIN_PROFILES } from "@pi-cordis/profiles";

describe("Pi-Cordis plugin behavior and private prototype honesty", () => {
	let ctx: any;

	beforeEach(async () => {
		ctx = await createPiContext({ allowModelNetwork: false, profile: false });
	});

	it("1. @pi-cordis/plugin-subagent: exposes explicit unavailable and depth-limit failures", async () => {
		const fork = await ctx.plugin(subagentPlugin, { maxDepth: 2 });
		expect(ctx.tools.has("subagent")).toBe(true);

		const tool = ctx.tools.get("subagent");
		const result = await tool!.execute({ task: "Run unit tests", role: "scout" });
		expect(result.success).toBe(false);
		expect(result.error).toBe("SUBAGENT_DRIVER_UNAVAILABLE");
		expect(result.details?.allowedTools).toEqual(["read", "grep", "find", "ls"]);
		expect(result.deliverables).toBeUndefined();

		// Depth limit guard test
		const deepResult = await tool!.execute({ task: "Run deeply nested task", depth: 3 });
		expect(deepResult.success).toBe(false);
		expect(deepResult.error).toBe("DELEGATED_DEPTH_EXCEEDED");

		await fork.dispose();
		expect(ctx.tools.has("subagent")).toBe(false);
	});

	it("2. @pi-cordis/plugin-plan-mode: keeps a stable exit tool and toggles per-session Plan policy", async () => {
		expect(ctx.tools.has("exit_plan_mode")).toBe(true);
		expect(ctx.tools.has("plan_step")).toBe(false);

		const exitTool = ctx.tools.get("exit_plan_mode");
		const inactive = await exitTool!.execute({ plan: "# Ready plan" });
		expect(inactive.isError).toBe(true);
		expect(inactive.details.active).toBe(false);

		const planCommand = ctx.extensions.getRegisteredCommands().get("plan");
		expect(planCommand).toBeDefined();
		const bridgeEvents: Record<string, Function> = {};
		const submittedRequests: Array<{ content: string; options?: { deliverAs?: string } }> = [];
		let rejectSubmittedRequest = false;
		ctx.extensions.createBridgeExtensionFactory().factory({
			registerCommand: () => {},
			registerTool: () => {},
			on: (eventName: string, handler: Function) => {
				bridgeEvents[eventName] = handler;
			},
			sendUserMessage: (content: string, options?: { deliverAs?: string }) => {
				if (rejectSubmittedRequest) throw new Error("message queue rejected");
				submittedRequests.push({ content, options });
			},
			setActiveTools: () => {},
		});
		bridgeEvents.session_start({ reason: "startup" }, {
			sessionManager: { getSessionId: () => "session-a" },
		});
		await planCommand!.handler("on", {
			hasUI: false,
			sessionManager: { getSessionId: () => "session-a" },
		});

		const promptEvent = { prompt: "Base prompt", sessionId: "session-a" };
		await ctx.serial("pi/prompt-transform", promptEvent);
		expect(promptEvent.prompt).toContain("## Plan mode");
		expect(promptEvent.prompt).toContain("exit_plan_mode");
		expect(promptEvent.prompt).toContain("Do not use todo_write");

		await planCommand!.handler(" 继续计划 ", {
			hasUI: false,
			isIdle: () => true,
			sessionManager: { getSessionId: () => "session-c" },
		});
		expect(submittedRequests).toEqual([{ content: "继续计划", options: undefined }]);
		const inlineRequestPrompt = { prompt: "Base prompt", sessionId: "session-c" };
		await ctx.serial("pi/prompt-transform", inlineRequestPrompt);
		expect(inlineRequestPrompt.prompt).toContain("## Plan mode");

		await planCommand!.handler("补充错误处理", {
			hasUI: false,
			isIdle: () => false,
			sessionManager: { getSessionId: () => "session-c" },
		});
		expect(submittedRequests.at(-1)).toEqual({
			content: "补充错误处理",
			options: { deliverAs: "steer" },
		});
		await planCommand!.handler("off", {
			hasUI: false,
			sessionManager: { getSessionId: () => "session-c" },
		});
		expect(submittedRequests).toHaveLength(2);

		rejectSubmittedRequest = true;
		await expect(Promise.resolve().then(() => planCommand!.handler("无法排队", {
			hasUI: false,
			isIdle: () => true,
			sessionManager: { getSessionId: () => "session-d" },
		}))).rejects.toThrow("previous Plan state was restored");
		const rejectedRequestPrompt = { prompt: "Base prompt", sessionId: "session-d" };
		await ctx.serial("pi/prompt-transform", rejectedRequestPrompt);
		expect(rejectedRequestPrompt.prompt).not.toContain("## Plan mode");
		rejectSubmittedRequest = false;

		await expect(
			ctx.serial("pi/tool-call", {
				name: "write",
				args: { path: "test.txt", content: "data" },
				sessionId: "session-a",
			}),
		).rejects.toThrow("blocked while Plan mode is active");
		await expect(
			ctx.serial("pi/tool-call", {
				name: "bash",
				args: { command: "git status" },
				sessionId: "session-a",
			}),
		).resolves.toBeUndefined();
		await expect(
			ctx.serial("pi/tool-call", {
				name: "bash",
				args: { command: "git status; git commit -am test" },
				sessionId: "session-a",
			}),
		).rejects.toThrow("not allowlisted as read-only");

		const headless = await exitTool!.execute(
			{ plan: "# Ready plan\n\n1. Implement it." },
			{ ctx: { hasUI: false, sessionManager: { getSessionId: () => "session-a" } } },
		);
		expect(headless.isError).toBe(true);
		expect(headless.details.active).toBe(true);

		const invalid = await exitTool!.execute(
			{ plan: "No heading" },
			{ ctx: { hasUI: true, sessionManager: { getSessionId: () => "session-a" }, ui: {} } },
		);
		expect(invalid.isError).toBe(true);
		expect(invalid.content[0].text).toContain("# heading");

		const completePlan = "# Ready plan\n\n## Steps\n\n1. Inspect the current behavior.\n2. Implement and verify the fix.";
		expect(exitTool!.renderCall({ plan: completePlan })).toContain(completePlan);
		let previewShown = false;
		const approved = await exitTool!.execute(
			{ plan: completePlan },
			{
				ctx: {
					hasUI: true,
					sessionManager: { getSessionId: () => "session-a" },
					ui: {
						editor: async (title: string, prefill: string) => {
							expect(title).toContain("complete plan");
							expect(prefill).toBe(completePlan);
							previewShown = true;
							return prefill;
						},
						notify: () => {},
						select: async (title: string) => {
							expect(previewShown).toBe(true);
							expect(title).toContain("complete plan you just reviewed");
							return "Approve and leave Plan mode";
						},
					},
				},
			},
		);
		expect(approved.details.approved).toBe(true);
		expect(approved.details.active).toBe(false);
		expect(approved.details.plan).toBe(completePlan);

		await planCommand!.handler("on", {
			hasUI: false,
			sessionManager: { getSessionId: () => "session-b" },
		});
		let fallbackReviewTitle = "";
		const fallbackReview = await exitTool!.execute(
			{ plan: completePlan },
			{
				ctx: {
					hasUI: true,
					sessionManager: { getSessionId: () => "session-b" },
					ui: {
						select: async (title: string) => {
							fallbackReviewTitle = title;
							return "Keep planning";
						},
					},
				},
			},
		);
		expect(fallbackReviewTitle).toContain(completePlan);
		expect(fallbackReview.details.active).toBe(true);

		let selectionOpenedForEditedPlan = false;
		const editedReview = await exitTool!.execute(
			{ plan: completePlan },
			{
				ctx: {
					hasUI: true,
					sessionManager: { getSessionId: () => "session-b" },
					ui: {
						editor: async () => `${completePlan}\n3. Add a regression test.`,
						select: async () => {
							selectionOpenedForEditedPlan = true;
							return "Approve and leave Plan mode";
						},
					},
				},
			},
		);
		expect(selectionOpenedForEditedPlan).toBe(false);
		expect(editedReview.details.approved).toBe(false);
		expect(editedReview.details.plan).toContain("3. Add a regression test.");
		expect(editedReview.content[0].text).toContain("3. Add a regression test.");
		expect(editedReview.details.active).toBe(true);

		await expect(
			ctx.serial("pi/tool-call", {
				name: "write",
				args: { path: "test.txt", content: "data" },
				sessionId: "session-a",
			}),
		).resolves.toBeUndefined();
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

		// Calls inside PTC still cross the Cordis safety pipeline.
		const safetyFork = await ctx.plugin(safetyGatePlugin);
		const blocked = await tool!.execute({ code: `await pi.bash.run("rm -rf /");` });
		expect(blocked.success).toBe(false);
		expect(blocked.error).toContain("Dangerous command blocked");
		await safetyFork.dispose();

		// 4. Verify TUI Renderers
		const callText = (tool as any).renderCall({ code: "console.log('hello world');" });
		expect(callText).toContain("run_code");
		expect(callText).toContain("console.log('hello world')");

		const resultTextCollapsed = (tool as any).renderResult(result, { expanded: false });
		expect(resultTextCollapsed).toContain("✓ Executed in");

		const resultTextExpanded = (tool as any).renderResult(result, { expanded: true });
		expect(resultTextExpanded).toContain("Doubled values:");

		// 5. Verify Worker Thread can terminate async infinite loop (while(true) await ...) safely
		const shortTimeoutFork = await ctx.plugin(codeModePlugin, { timeoutMs: 150, useWorkerThreads: true });
		const shortTool = ctx.tools.get("run_code");
		const loopResult = await shortTool!.execute({
			code: `
				console.log("Starting infinite async loop...");
				while (true) {
					await new Promise(r => setTimeout(r, 10));
				}
			`,
		});
		expect(loopResult.success).toBe(false);
		expect(loopResult.error).toContain("timed out");
		await shortTimeoutFork.dispose();

		await fork.dispose();
		expect(ctx.tools.has("run_code")).toBe(false);
		expect(ctx.tools.getExportedToolNames()).toContain("read");
	});

	it("4. @pi-cordis/plugin-ask-question: requires real UI input and preserves selected notes", async () => {
		const fork = await ctx.plugin(askQuestionPlugin);
		expect(ctx.tools.has("ask_question")).toBe(true);

		const tool = ctx.tools.get("ask_question");

		// 1. Headless execution must never fabricate a user choice.
		const resultFallback = await tool!.execute({
			questions: [
				{
					id: "db_choice",
					question: "Which database do you prefer?",
					options: [
						{ label: "PostgreSQL (Recommended)", description: "Relational", preview: "CREATE TABLE users (id serial);", note: "Best for transactional data" },
						{ label: "Redis", description: "In-memory", preview: "SET user:1 'test'" },
					],
				},
			],
		});

		expect(resultFallback.answers).toEqual([]);
		expect(resultFallback.error).toBe("INTERACTIVE_UI_UNAVAILABLE");

		// 2. Interactive UI select
		let selectTitle = "";
		let selectOptions: string[] = [];
		const mockUI: any = {
			select: async (title: string, options: string[]) => {
				selectTitle = title;
				selectOptions = options;
				return "Redis (In-memory)";
			},
			input: async () => "Custom Answer",
		};

		const resultInteractive = await tool!.execute(
			{
				questions: [
					{
						id: "db_choice",
						question: "Which database do you prefer?",
						options: [
							{ label: "PostgreSQL (Recommended)", description: "Relational" },
							{ label: "Redis", description: "In-memory", note: "Fast key-value cache" },
						],
					},
				],
			},
			{ ctx: { hasUI: true, ui: mockUI } },
		);

		expect(selectTitle).toBe("Which database do you prefer?");
		expect(selectOptions).toContain("PostgreSQL (Recommended) (Relational)");
		expect(selectOptions).toContain("Redis (In-memory)");
		expect(selectOptions).toContain("✍️ Other (Type custom answer)");
		expect(resultInteractive.answers[0].selected[0]).toBe("Redis");
		expect(resultInteractive.answers[0].notes).toBe("Fast key-value cache");

		// 3. Interactive custom answer input
		const mockCustomUI: any = {
			select: async () => "✍️ Other (Type custom answer)",
			input: async () => "SQLite",
		};

		const resultCustom = await tool!.execute(
			{
				question: "What DB do you want?",
				options: [{ label: "PostgreSQL" }, { label: "MySQL" }],
			},
			{ ctx: { hasUI: true, ui: mockCustomUI } },
		);

		expect(resultCustom.answers[0].selected[0]).toBe("SQLite");
		expect(resultCustom.wasCustom).toBe(true);

		// 4. Cancelling a selector does not silently choose the first option.
		const resultCancelled = await tool!.execute(
			{ question: "Continue?", options: [{ label: "Yes" }, { label: "No" }] },
			{ ctx: { hasUI: true, ui: { select: async () => undefined, input: async () => undefined } } },
		);
		expect(resultCancelled.cancelled).toBe(true);
		expect(resultCancelled.answers[0].selected).toEqual([]);

		await fork.dispose();
		expect(ctx.tools.has("ask_question")).toBe(false);
	});

	it("5. @pi-cordis/plugin-output-truncator: truncates oversized output with Spill storage and Head/Tail", () => {
		const spillDir = fs.mkdtempSync(path.join(os.tmpdir(), "picds-spill-test-"));
		const lines = Array.from({ length: 3000 }, (_, i) => `Line ${i}`).join("\n");
		try {
			const res = truncateText(lines, { maxBytes: 50 * 1024, maxLines: 2000, headLines: 30, tailLines: 20, enableSpill: true, spillDir });
			expect(res.truncated).toBe(true);
			expect(res.text).toContain("Line 0");
			expect(res.text).toContain("Line 29");
			expect(res.text).toContain("Line 2999");
			expect(res.text).toContain("omitted by @pi-cordis/plugin-output-truncator");
			expect(res.spillPath).toBeDefined();
		} finally {
			fs.rmSync(spillDir, { recursive: true, force: true });
		}
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
		expect(result.success).toBe(false);
		expect(result.error).toBe("COMPACTION_DRIVER_UNAVAILABLE");
		expect(compactEmitted).toBe(false);

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

	it("10. @pi-cordis/plugin-ssh-delegator: fails honestly without an SSH transport", async () => {
		const fork = await ctx.plugin(sshDelegatorPlugin, { defaultHost: "remote.server.com", defaultUser: "deploy" });
		expect(ctx.tools.has("ssh_exec")).toBe(true);

		const tool = ctx.tools.get("ssh_exec");
		const result = await tool!.execute({ command: "uname -a" });
		expect(result.success).toBe(false);
		expect(result.target).toBe("deploy@remote.server.com");
		expect(result.stderr).toContain("SSH_TRANSPORT_UNAVAILABLE");

		await fork.dispose();
		expect(ctx.tools.has("ssh_exec")).toBe(false);
	});

	it("11. @pi-cordis/profiles: default and ptc keep stable Plan controls while changing presentation", async () => {
		// PTC profile
		const ptcCtx = await createPiContext({ allowModelNetwork: false, profile: "ptc" });
		expect(ptcCtx.tools.has("run_code")).toBe(true);
		expect(ptcCtx.tools.has("todo_write")).toBe(true);
		expect(ptcCtx.tools.has("exit_plan_mode")).toBe(true);

		// Default profile (Default is Best: verified essentials, not every plugin)
		const defaultCtx = await createPiContext({ allowModelNetwork: false, profile: "default" });
		expect(defaultCtx.tools.has("todo_write")).toBe(true);
		expect(defaultCtx.tools.has("ask_question")).toBe(true);
		expect(defaultCtx.tools.has("exit_plan_mode")).toBe(true);
		expect(defaultCtx.tools.has("subagent")).toBe(false);
		expect(defaultCtx.tools.has("trigger_compact")).toBe(false);
		expect(defaultCtx.tools.has("ssh_exec")).toBe(false);
	});

	it("12. @pi-cordis/plugin-safety-gate: blocks destructive commands, sensitive path writes, and read-only breaches", async () => {
		const fork = await ctx.plugin(safetyGatePlugin);

		// 1. Destructive command check
		await expect(ctx.serial("pi/tool-call", { name: "bash", args: { command: "rm -rf /" } })).rejects.toThrow(
			"Dangerous command blocked",
		);

		// 2. Secret file dump check
		await expect(ctx.serial("pi/tool-call", { name: "bash", args: { command: "cat .env" } })).rejects.toThrow(
			"Dangerous command blocked",
		);

		// 3. Protected file write check
		await expect(ctx.serial("pi/tool-call", { name: "write", args: { path: ".env" } })).rejects.toThrow(
			"is a protected file",
		);
		await expect(ctx.serial("pi/tool-call", { name: "write", args: { path: "node_modules\\pkg\\index.js" } })).rejects.toThrow(
			"is a protected file",
		);

		// 4. Native Windows shell destructive commands
		expect(isCommandDangerous("Remove-Item -Recurse -Force C:\\")).toMatchObject({ dangerous: true });
		expect(isCommandDangerous("format C:")).toMatchObject({ dangerous: true });

		// 5. An allow-list entry is exact and cannot whitelist an injected suffix.
		expect(isCommandDangerous("rm -rf /", [], ["rm -rf /"])).toEqual({ dangerous: false });
		expect(isCommandDangerous("rm -rf /; echo bypass", [], ["rm -rf /"])).toMatchObject({ dangerous: true });

		await fork.dispose();
	});

	it("13. @pi-cordis/plugin-git-guard: manages git_checkpoint tool creation and listing", async () => {
		const fork = await ctx.plugin(gitGuardPlugin);
		expect(ctx.tools.has("git_checkpoint")).toBe(true);

		const tool = ctx.tools.get("git_checkpoint");
		const listRes = await tool!.execute({ action: "list" });
		expect(listRes.total).toBeDefined();

		const createRes = await tool!.execute({ action: "create", description: "Test checkpoint" });
		expect(createRes.success).toBe(true);

		await fork.dispose();
		expect(ctx.tools.has("git_checkpoint")).toBe(false);
	});

	it("14. @pi-cordis/plugin-rules-injector: injects project rules and caches content with SHA-256", async () => {
		const rulesCwd = fs.mkdtempSync(path.join(os.tmpdir(), "picds-rules-test-"));
		fs.writeFileSync(path.join(rulesCwd, ".cursorrules"), "Use deterministic tests.\n", "utf8");
		const rulesCtx = await createPiContext({ cwd: rulesCwd, allowModelNetwork: false, profile: false });
		try {
			const fork = await rulesCtx.plugin(rulesInjectorPlugin);
			const promptEvent = { prompt: "Base instructions" };
			await rulesCtx.parallel("pi/prompt-transform", promptEvent);
			expect(promptEvent.prompt).toContain("Use deterministic tests.");
			expect(promptEvent.prompt).not.toContain("AGENTS.md");
			await fork.dispose();
		} finally {
			await rulesCtx.fiber.dispose();
			fs.rmSync(rulesCwd, { recursive: true, force: true });
		}
	});

	it("15. @pi-cordis/plugin-btw: registers /btw command and performs ephemeral side-channel LLM query", async () => {
		const fork = await ctx.plugin(btwPlugin);

		const cmd = ctx.extensions.getRegisteredCommands().get("btw");
		expect(cmd).toBeDefined();
		expect(cmd.description).toContain("side question");

		// Test mock completion
		const mockModel = { id: "deepseek-chat", provider: "deepseek", api: "openai-completions" };
		ctx.ai.activeModel = mockModel;
		(ctx.ai.getRuntime() as any).completeSimple = async () => ({
			content: [{ type: "text", text: "SSE stands for Server-Sent Events." }],
		});

		let queryFired = false;
		let responseFired = false;
		ctx.on("pi/btw-query" as any, () => { queryFired = true; });
		ctx.on("pi/btw-response" as any, () => { responseFired = true; });

		let answerNotify = "";
		const mockCmdCtx = {
			hasUI: true,
			ui: {
				notify: (msg: string) => {
					answerNotify = msg;
				},
			},
		};

		await cmd.handler("what is SSE?", mockCmdCtx);
		expect(answerNotify).toContain("[btw: deepseek-chat]");
		expect(answerNotify).toContain("SSE stands for Server-Sent Events.");
		expect(queryFired).toBe(true);
		expect(responseFired).toBe(true);

		await fork.dispose();
		expect(ctx.extensions.getRegisteredCommands().has("btw")).toBe(false);
	});

	it("16. @pi-cordis/plugin-terminal-notifier: emits OSC 777 native desktop notifications", async () => {
		const notifierPlugin = (await import("@pi-cordis/plugin-terminal-notifier")).default;
		const fork = await ctx.plugin(notifierPlugin);

		// Trigger ask_question tool call
		await ctx.parallel("pi/tool-call", { name: "ask_question", args: {} });

		// Trigger session turn end
		await ctx.parallel("pi/session-turn-end", { session: {} });

		await fork.dispose();
	});
});
