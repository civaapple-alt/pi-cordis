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
import safetyGatePlugin from "@pi-cordis/plugin-safety-gate";
import gitGuardPlugin from "@pi-cordis/plugin-git-guard";
import rulesInjectorPlugin from "@pi-cordis/plugin-rules-injector";
import { BUILTIN_PROFILES } from "@pi-cordis/profiles";

describe("Pi-Cordis Top 10 Priority Native Built-in Plugins", () => {
	let ctx: any;

	beforeEach(async () => {
		ctx = await createPiContext({ allowModelNetwork: false, profile: "minimal" });
	});

	it("1. @pi-cordis/plugin-subagent: registers subagent tool, allocates isolated session, enforces role tool slicing, and guards depth limits", async () => {
		const fork = await ctx.plugin(subagentPlugin, { maxDepth: 2 });
		expect(ctx.tools.has("subagent")).toBe(true);

		const tool = ctx.tools.get("subagent");
		const result = await tool!.execute({ task: "Run unit tests", role: "scout" });
		expect(result.success).toBe(true);
		expect(result.summary).toContain("[SCOUT]");
		expect(result.summary).toContain("Run unit tests");
		expect(result.details?.allowedTools).toEqual(["read", "grep", "find", "ls"]);
		expect(result.deliverables).toBeDefined();

		// Depth limit guard test
		const deepResult = await tool!.execute({ task: "Run deeply nested task", depth: 3 });
		expect(deepResult.success).toBe(false);
		expect(deepResult.error).toBe("DELEGATED_DEPTH_EXCEEDED");

		await fork.dispose();
		expect(ctx.tools.has("subagent")).toBe(false);
	});

	it("2. @pi-cordis/plugin-plan-mode: manages plan steps, generates implementation_plan.md, gates approval, and emits walkthrough", async () => {
		const fork = await ctx.plugin(planModePlugin);
		expect(ctx.tools.has("plan_step")).toBe(true);

		const tool = ctx.tools.get("plan_step");

		// 1. Set comprehensive plan metadata
		const setRes = await tool!.execute({
			action: "set_plan",
			title: "Database Migration & Service Upgrade",
			overview: "Refactor core services to implement The 5 Pillars",
			userReviewRequired: "Confirm if backward compatibility shims are needed",
			openQuestions: ["Should SQLite retain WAL mode?"],
			proposedChanges: [
				{ action: "MODIFY", path: "src/db.ts", description: "Update schema version" },
			],
			verificationPlan: "Run all vitest suites",
		});
		expect(setRes.planFilePath).toBeDefined();
		expect(setRes.markdown).toContain("# Database Migration & Service Upgrade");
		expect(setRes.markdown).toContain("Confirm if backward compatibility shims");

		// 2. Add step 1 and step 2
		const addRes1 = await tool!.execute({ action: "add", title: "Analyze database schema" });
		expect(addRes1.step.title).toBe("Analyze database schema");
		expect(addRes1.step.status).toBe("pending");

		const addRes2 = await tool!.execute({ action: "add", title: "Run migration", dependsOn: [1] });
		expect(addRes2.step.dependsOn).toEqual([1]);

		// 3. Verify write tool blocking before user approval
		let writeBlocked = false;
		try {
			await ctx.parallel("pi/tool-call", { name: "write", args: { path: "test.txt", content: "data" } });
		} catch (err: any) {
			writeBlocked = true;
			const msg = String(err) + (err.errors ? err.errors.map(String).join(" ") : "");
			expect(msg).toContain("blocked in session [default]");
		}
		expect(writeBlocked).toBe(true);

		// 4. Request review and approve
		const reviewRes = await tool!.execute({ action: "request_review" });
		expect(reviewRes.isApproved).toBe(false);
		expect(reviewRes.markdown).toContain("Pending User Review");

		const approveRes = await tool!.execute({ action: "approve" });
		expect(approveRes.isApproved).toBe(true);

		// 5. Verify write tool is now unblocked
		let writeAllowed = true;
		try {
			await ctx.parallel("pi/tool-call", { name: "write", args: { path: "test.txt", content: "data" } });
		} catch {
			writeAllowed = false;
		}
		expect(writeAllowed).toBe(true);

		// 6. Update step 1 to completed and view plan
		await tool!.execute({ action: "update", id: 1, status: "completed" });
		const viewRes = await tool!.execute({ action: "view" });
		expect(viewRes.percentage).toBe(50);
		expect(viewRes.markdown).toContain("[✓] **#1**: Analyze database schema");

		// 7. Prompt transform check
		const promptEvent = { prompt: "Base prompt" };
		await ctx.parallel("pi/prompt-transform", promptEvent);
		expect(promptEvent.prompt).toContain("Current Implementation Plan");
		expect(promptEvent.prompt).toContain("50%");
		expect(promptEvent.prompt).toContain("Analyze database schema");

		// 8. Multi-session concurrency test
		// Session B has an unapproved plan
		await tool!.execute({
			action: "set_plan",
			sessionId: "session_b",
			title: "Session B Plan",
			overview: "Isolated concurrent plan for session B",
		});
		await tool!.execute({ action: "add", sessionId: "session_b", title: "Session B Step 1" });

		const listSessionsRes = await tool!.execute({ action: "list_sessions" });
		expect(listSessionsRes.totalSessions).toBeGreaterThanOrEqual(2);
		expect(listSessionsRes.sessions.some((s: any) => s.sessionId === "session_b")).toBe(true);

		// Verify Session B blocks write while default session is approved
		let sessionBBlocked = false;
		try {
			await ctx.parallel("pi/tool-call", { name: "write", sessionId: "session_b", args: { path: "b.txt", content: "data" } });
		} catch (err: any) {
			sessionBBlocked = true;
			const msg = String(err) + (err.errors ? err.errors.map(String).join(" ") : "");
			expect(msg).toContain("blocked in session [session_b]");
		}
		expect(sessionBBlocked).toBe(true);

		// 9. Finish plan mode and generate walkthrough
		const finishRes = await tool!.execute({ action: "finish", summary: "Database migration successfully completed." });
		expect(finishRes.message).toContain("Plan finalized");
		expect(finishRes.walkthroughFilePath).toBeDefined();

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

	it("4. @pi-cordis/plugin-ask-question: registers ask_question tool with preview and note support", async () => {
		const fork = await ctx.plugin(askQuestionPlugin);
		expect(ctx.tools.has("ask_question")).toBe(true);

		const tool = ctx.tools.get("ask_question");
		const result = await tool!.execute({
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

		expect(result.answers).toBeDefined();
		expect(result.answers[0].id).toBe("db_choice");
		expect(result.answers[0].selected[0]).toContain("PostgreSQL");
		expect(result.answers[0].notes).toBe("Best for transactional data");

		await fork.dispose();
		expect(ctx.tools.has("ask_question")).toBe(false);
	});

	it("5. @pi-cordis/plugin-output-truncator: truncates oversized output with Spill storage and Head/Tail", () => {
		const lines = Array.from({ length: 3000 }, (_, i) => `Line ${i}`).join("\n");
		const res = truncateText(lines, { maxBytes: 50 * 1024, maxLines: 2000, headLines: 30, tailLines: 20, enableSpill: true });
		expect(res.truncated).toBe(true);
		expect(res.text).toContain("Line 0");
		expect(res.text).toContain("Line 29");
		expect(res.text).toContain("Line 2999");
		expect(res.text).toContain("omitted by @pi-cordis/plugin-output-truncator");
		expect(res.spillPath).toBeDefined();
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

	it("11. @pi-cordis/profiles: default, plan, and ptc profiles mount all required plugins cleanly", async () => {
		// Plan profile
		const planCtx = await createPiContext({ allowModelNetwork: false, profile: "plan" });
		expect(planCtx.tools.has("plan_step")).toBe(true);
		expect(planCtx.tools.has("todo_write")).toBe(true);

		// PTC profile
		const ptcCtx = await createPiContext({ allowModelNetwork: false, profile: "ptc" });
		expect(ptcCtx.tools.has("run_code")).toBe(true);
		expect(ptcCtx.tools.has("todo_write")).toBe(true);

		// Default profile (Default is Best: full capabilities)
		const defaultCtx = await createPiContext({ allowModelNetwork: false, profile: "default" });
		expect(defaultCtx.tools.has("subagent")).toBe(true);
		expect(defaultCtx.tools.has("todo_write")).toBe(true);
		expect(defaultCtx.tools.has("ask_question")).toBe(true);
		expect(defaultCtx.tools.has("manage_tools")).toBe(true);
		expect(defaultCtx.tools.has("session_handoff")).toBe(true);
		expect(defaultCtx.tools.has("git_smart_commit")).toBe(true);
		expect(defaultCtx.tools.has("ssh_exec")).toBe(true);
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
		const fork = await ctx.plugin(rulesInjectorPlugin);

		const promptEvent = { prompt: "Base instructions" };
		await ctx.parallel("pi/prompt-transform", promptEvent);

		// If AGENTS.md or CLAUDE.md exists in repo, it should be injected
		expect(promptEvent.prompt.length).toBeGreaterThan("Base instructions".length);

		await fork.dispose();
	});

	it("15. @pi-cordis/plugin-btw: registers /btw command and performs ephemeral side-channel LLM query", async () => {
		const btwPlugin = (await import("@pi-cordis/plugin-btw")).default;
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
