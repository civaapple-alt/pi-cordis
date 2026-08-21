import * as fs from "node:fs";
import * as path from "node:path";
import type { Context } from "@deepseek-ai/cordis";

export interface PlanStep {
	id: number;
	title: string;
	status: "pending" | "in_progress" | "completed" | "failed";
	dependsOn?: number[];
	notes?: string;
}

export interface ProposedChange {
	component?: string;
	path?: string;
	action?: "NEW" | "MODIFY" | "DELETE";
	description: string;
}

export interface PlanDocument {
	sessionId: string;
	title: string;
	overview?: string;
	userReviewRequired?: string;
	openQuestions?: string[];
	proposedChanges?: ProposedChange[];
	steps: PlanStep[];
	verificationPlan?: string;
	isApproved: boolean;
	walkthroughSummary?: string;
	planFilePath: string;
	walkthroughFilePath: string;
	updatedAt: number;
}

export interface PlanModeConfig {
	autoBlockWrites?: boolean;
	injectGuidelines?: boolean;
	planFilePath?: string;
	walkthroughFilePath?: string;
	cwd?: string;
}

export const name = "plan-mode";
export const inject = ["tools", "settings"];

export function calculateProgress(steps: PlanStep[]): { percentage: number; bar: string; completedCount: number } {
	if (steps.length === 0) return { percentage: 0, bar: "[░░░░░░░░░░] 0%", completedCount: 0 };
	const completedCount = steps.filter((s) => s.status === "completed").length;
	const pct = Math.round((completedCount / steps.length) * 100);
	const filled = Math.round(pct / 10);
	const empty = 10 - filled;
	const bar = `[${"█".repeat(filled)}${"░".repeat(empty)}] ${pct}%`;
	return { percentage: pct, bar, completedCount };
}

/**
 * Format structured PlanDocument into standard GitHub Flavored Markdown
 */
export function renderImplementationPlanMarkdown(plan: PlanDocument): string {
	const { bar, percentage, completedCount } = calculateProgress(plan.steps);
	const statusBadge = plan.isApproved ? "🟢 Approved (In Execution)" : "🟡 Pending User Review";

	let md = `# ${plan.title || "Implementation Plan"}\n\n`;
	md += `> **Session ID**: \`${plan.sessionId}\` | **Status**: ${statusBadge} | **Progress**: ${bar} (${completedCount}/${plan.steps.length} completed)\n\n`;

	if (plan.overview) {
		md += `## 概述与目标 (Overview & Background)\n\n${plan.overview.trim()}\n\n`;
	}

	if (plan.userReviewRequired || (plan.openQuestions && plan.openQuestions.length > 0)) {
		md += `## 用户审查与待确认项 (User Review Required & Open Questions)\n\n`;
		if (plan.userReviewRequired) {
			md += `> [!IMPORTANT]\n> ${plan.userReviewRequired.trim().replace(/\n/g, "\n> ")}\n\n`;
		}
		if (plan.openQuestions && plan.openQuestions.length > 0) {
			md += `### 待确认问题 (Open Questions)\n\n`;
			for (const q of plan.openQuestions) {
				md += `- [ ] ${q}\n`;
			}
			md += `\n`;
		}
	}

	if (plan.proposedChanges && plan.proposedChanges.length > 0) {
		md += `## 拟定修改清单 (Proposed Changes)\n\n`;
		md += `| 变更类型 | 目标文件 / 组件 | 修改说明与影响 |\n`;
		md += `| :--- | :--- | :--- |\n`;
		for (const change of plan.proposedChanges) {
			const tag = change.action ? `\`[${change.action}]\`` : "`[MODIFY]`";
			const target = change.path ? `\`${change.path}\`` : change.component ? `**${change.component}**` : "—";
			md += `| ${tag} | ${target} | ${change.description} |\n`;
		}
		md += `\n`;
	}

	md += `## 步骤进度与依赖图 (Execution Steps & Dependencies)\n\n`;
	if (plan.steps.length === 0) {
		md += `*暂无具体步骤，可通过 \`plan_step({ action: "add" })\` 增加。*\n\n`;
	} else {
		for (const s of plan.steps) {
			const badge = s.status === "completed" ? "✓" : s.status === "in_progress" ? "▶" : s.status === "failed" ? "✗" : "⏳";
			const dep = s.dependsOn && s.dependsOn.length > 0 ? ` *(依赖: #${s.dependsOn.join(", #")})*` : "";
			const note = s.notes ? ` — *${s.notes}*` : "";
			md += `- [${badge}] **#${s.id}**: ${s.title}${dep}${note}\n`;
		}
		md += `\n`;
	}

	if (plan.verificationPlan) {
		md += `## 验证计划 (Verification Plan)\n\n${plan.verificationPlan.trim()}\n\n`;
	}

	return md;
}

/**
 * Format Walkthrough summary markdown upon plan completion
 */
export function renderWalkthroughMarkdown(plan: PlanDocument): string {
	const { bar, completedCount } = calculateProgress(plan.steps);
	let md = `# ${plan.title || "Task Execution"} 实施成果与演练总结 (Walkthrough)\n\n`;
	md += `> **Session ID**: \`${plan.sessionId}\` | **Status**: ✅ Completed | **Final Progress**: ${bar} (${completedCount}/${plan.steps.length} steps)\n\n`;

	if (plan.walkthroughSummary) {
		md += `## 概述与交付成果 (Executive Summary)\n\n${plan.walkthroughSummary.trim()}\n\n`;
	}

	if (plan.proposedChanges && plan.proposedChanges.length > 0) {
		md += `## 核心变更详情 (Core Changes Summary)\n\n`;
		md += `| 变更类型 | 目标文件 / 组件 | 修改说明 |\n`;
		md += `| :--- | :--- | :--- |\n`;
		for (const change of plan.proposedChanges) {
			const tag = change.action ? `\`[${change.action}]\`` : "`[MODIFY]`";
			const target = change.path ? `\`${change.path}\`` : change.component ? `**${change.component}**` : "—";
			md += `| ${tag} | ${target} | ${change.description} |\n`;
		}
		md += `\n`;
	}

	md += `## 执行步骤最终状态\n\n`;
	for (const s of plan.steps) {
		const badge = s.status === "completed" ? "✓" : s.status === "failed" ? "✗" : "○";
		md += `- [${badge}] **#${s.id}**: ${s.title}\n`;
	}
	md += `\n`;

	if (plan.verificationPlan) {
		md += `## 验证计划记录 (Verification Plan Record)\n\n${plan.verificationPlan.trim()}\n`;
	}

	return md;
}

function writeDurableFile(filePath: string, content: string) {
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	fs.writeFileSync(filePath, content, "utf-8");
}

/**
 * Generate plan index file when multiple sessions have concurrent plans
 */
function syncMultiSessionIndex(baseDir: string, plans: Map<string, PlanDocument>) {
	const indexPath = path.join(baseDir, ".picds", "plans", "index.json");
	const indexData = Array.from(plans.values()).map((p) => ({
		sessionId: p.sessionId,
		title: p.title,
		isApproved: p.isApproved,
		stepsCount: p.steps.length,
		completedCount: p.steps.filter((s) => s.status === "completed").length,
		planFilePath: p.planFilePath,
		walkthroughFilePath: p.walkthroughFilePath,
		updatedAt: p.updatedAt,
	}));
	writeDurableFile(indexPath, `${JSON.stringify(indexData, null, 2)}\n`);
}

export function apply(ctx: Context, config: PlanModeConfig = {}) {
	const cwd = config.cwd ?? ctx.settings.getCwd();
	const basePlansDir = path.join(cwd, ".picds", "plans");

	const rootCtx = (ctx.root ?? ctx) as any;
	const plans: Map<string, PlanDocument> = (rootCtx._planModePlans ??= new Map<string, PlanDocument>());
	let activeSessionId = "default";

	let isPlanModeActive = true;
	const autoBlockWrites = config.autoBlockWrites ?? true;
	const injectGuidelines = config.injectGuidelines ?? true;

	const resolvePlanPaths = (sessionId: string) => {
		if (sessionId === "default" && config.planFilePath) {
			return {
				planFilePath: config.planFilePath,
				walkthroughFilePath: config.walkthroughFilePath ?? path.join(basePlansDir, "walkthrough.md"),
			};
		}

		if (sessionId === "default") {
			return {
				planFilePath: path.join(basePlansDir, "implementation_plan.md"),
				walkthroughFilePath: path.join(basePlansDir, "walkthrough.md"),
			};
		}

		// Concurrency-isolated session directory
		const sessionDir = path.join(basePlansDir, sessionId);
		return {
			planFilePath: path.join(sessionDir, "implementation_plan.md"),
			walkthroughFilePath: path.join(sessionDir, "walkthrough.md"),
		};
	};

	const getOrCreatePlan = (sessionId: string = activeSessionId): PlanDocument => {
		let plan = plans.get(sessionId);
		if (!plan) {
			const { planFilePath, walkthroughFilePath } = resolvePlanPaths(sessionId);
			plan = {
				sessionId,
				title: "Implementation Plan",
				steps: [],
				isApproved: false,
				planFilePath,
				walkthroughFilePath,
				updatedAt: Date.now(),
			};
			plans.set(sessionId, plan);
		}
		return plan;
	};

	const syncPlanToDisk = (plan: PlanDocument) => {
		plan.updatedAt = Date.now();
		const md = renderImplementationPlanMarkdown(plan);
		writeDurableFile(plan.planFilePath, md);

		// If this is default or the latest active session, sync the canonical plan.
		if (plan.sessionId === "default" || plan.sessionId === activeSessionId) {
			const canonicalPath = path.join(basePlansDir, "implementation_plan.md");
			if (canonicalPath !== plan.planFilePath) {
				writeDurableFile(canonicalPath, md);
			}
		}

		syncMultiSessionIndex(cwd, plans);
		return md;
	};

	// Track session switches
	const removeSessionStartHook = ctx.on("pi/session-start", (evt) => {
		const sId = evt?.sessionId;
		if (sId) {
			activeSessionId = sId;
			getOrCreatePlan(sId);
		}
	});

	// 1. Register plan_step tool with rich multi-session plan orchestration
	const unregisterTool = ctx.tools.register({
		name: "plan_step",
		description:
			"Create, update, inspect, or approve implementation plan documents (implementation_plan.md) and walkthroughs with multi-session concurrency isolation and dependency tracking.",
		parameters: {
			type: "object",
			properties: {
				action: {
					type: "string",
					enum: [
						"add",
						"update",
						"list",
						"set_plan",
						"request_review",
						"approve",
						"view",
						"get_plan",
						"list_sessions",
						"finish",
					],
					description:
						"Action to perform: 'set_plan' to set metadata, 'add' to add step, 'request_review' (MANDATORY when plan is ready to present the interactive User Approval modal in the terminal), 'approve' to approve, 'update' to update step status, 'finish' to generate walkthrough.",
				},
				sessionId: {
					type: "string",
					description: "Optional session ID to isolate concurrent multi-session plans",
				},
				id: { type: "number", description: "Step ID for update" },
				title: { type: "string", description: "Plan title or step description" },
				overview: { type: "string", description: "Overview and background context of the implementation plan" },
				userReviewRequired: { type: "string", description: "Items requiring user review or approval" },
				openQuestions: {
					type: "array",
					items: { type: "string" },
					description: "Clarifying questions or open design decisions for user",
				},
				proposedChanges: {
					type: "array",
					items: {
						type: "object",
						properties: {
							component: { type: "string" },
							path: { type: "string" },
							action: { type: "string", enum: ["NEW", "MODIFY", "DELETE"] },
							description: { type: "string" },
						},
						required: ["description"],
					},
					description: "List of files/components proposed to be created, modified, or deleted",
				},
				verificationPlan: { type: "string", description: "Verification and testing strategy" },
				status: {
					type: "string",
					enum: ["pending", "in_progress", "completed", "failed"],
					description: "Step status",
				},
				dependsOn: {
					type: "array",
					items: { type: "number" },
					description: "Optional step IDs this step depends on",
				},
				notes: { type: "string", description: "Optional notes or rationale" },
				summary: { type: "string", description: "Summary of completed work for walkthrough" },
			},
			required: ["action"],
		},
		renderCall: (args: any, theme?: any) => {
			const actionTag = (args?.action || "").toUpperCase();
			const sess = args?.sessionId ? `[${args.sessionId}] ` : "";
			let desc = "";
			if (args?.action === "add") desc = args?.title ? `"${args.title}"` : "Add Step";
			else if (args?.action === "update") desc = args?.id ? `#${args.id} -> ${args.status || "update"}` : "Update Step";
			else if (args?.action === "set_plan") desc = args?.title ? `"${args.title}"` : "Set Plan Metadata";
			else if (args?.action === "approve") desc = "Plan Approved (Unblocking Writes)";
			else if (args?.action === "request_review") desc = "Requesting User Review";
			else if (args?.action === "finish") desc = "Plan Finalized";
			else if (args?.action === "list" || args?.action === "get_plan") desc = "Inspect Plan";
			else if (args?.action === "list_sessions") desc = "List Sessions";

			const label = desc ? `${sess}${desc}` : `${sess}${actionTag}`;
			if (!theme?.fg) return `🗺️ plan_step [${actionTag}] ${label}`.trim();
			return `${theme.fg("accent", theme.bold("🗺️ plan_step "))}${theme.fg("dim", `[${actionTag}]`)} ${theme.fg("foreground", label)}`.trim();
		},
		renderResult: (result: any, options?: any, theme?: any) => {
			const targetPlan = getOrCreatePlan(result?.sessionId || activeSessionId);
			const steps = targetPlan?.steps || [];
			const { bar } = calculateProgress(steps);
			const msg = result?.message ?? `Steps: ${steps.length}`;
			const filePath = targetPlan?.planFilePath ? `| 📄 ${path.basename(targetPlan.planFilePath)}` : "";
			if (!theme?.fg) return `${msg} | ${bar} ${filePath}`.trim();
			return `${theme.fg("success", msg)} ${theme.fg("dim", `| ${bar} ${filePath}`)}`.trim();
		},
		execute: async (
			args: {
				action: string;
				sessionId?: string;
				id?: number;
				title?: string;
				overview?: string;
				userReviewRequired?: string;
				openQuestions?: string[];
				proposedChanges?: ProposedChange[];
				verificationPlan?: string;
				status?: PlanStep["status"];
				dependsOn?: number[];
				notes?: string;
				summary?: string;
			},
			execContext?: any,
		) => {
			const sId = args.sessionId || activeSessionId || "default";
			const planDoc = getOrCreatePlan(sId);

			// A. List All Concurrent Sessions
			if (args.action === "list_sessions") {
				const sessionList = Array.from(plans.values()).map((p) => {
					const { bar, percentage } = calculateProgress(p.steps);
					return {
						sessionId: p.sessionId,
						title: p.title,
						isApproved: p.isApproved,
						progress: bar,
						percentage,
						planFilePath: p.planFilePath,
						stepsCount: p.steps.length,
					};
				});
				return {
					totalSessions: plans.size,
					activeSessionId,
					sessions: sessionList,
				};
			}

			// B. Set Plan Metadata
			if (args.action === "set_plan") {
				if (args.title) planDoc.title = args.title;
				if (args.overview !== undefined) planDoc.overview = args.overview;
				if (args.userReviewRequired !== undefined) planDoc.userReviewRequired = args.userReviewRequired;
				if (args.openQuestions !== undefined) planDoc.openQuestions = args.openQuestions;
				if (args.proposedChanges !== undefined) planDoc.proposedChanges = args.proposedChanges;
				if (args.verificationPlan !== undefined) planDoc.verificationPlan = args.verificationPlan;

				const md = syncPlanToDisk(planDoc);
				const { bar } = calculateProgress(planDoc.steps);
				return {
					message: `Plan metadata updated for session [${sId}] and synced to ${planDoc.planFilePath}`,
					sessionId: sId,
					planFilePath: planDoc.planFilePath,
					progress: bar,
					isApproved: planDoc.isApproved,
					markdown: md,
				};
			}

			// C. Add Step
			if (args.action === "add" && args.title) {
				const id = planDoc.steps.length + 1;
				const step: PlanStep = {
					id,
					title: args.title,
					status: args.status ?? "pending",
					dependsOn: args.dependsOn,
					notes: args.notes,
				};
				planDoc.steps.push(step);
				syncPlanToDisk(planDoc);
				const { bar } = calculateProgress(planDoc.steps);
				return {
					message: `Added step #${id} to session [${sId}]: ${args.title}`,
					sessionId: sId,
					step,
					progress: bar,
					planFilePath: planDoc.planFilePath,
				};
			}

			// D. Update Step
			if (args.action === "update" && args.id) {
				const step = planDoc.steps.find((s) => s.id === args.id);
				if (step) {
					if (args.title) step.title = args.title;
					if (args.status) step.status = args.status;
					if (args.dependsOn) step.dependsOn = args.dependsOn;
					if (args.notes) step.notes = args.notes;
					syncPlanToDisk(planDoc);
					const { bar } = calculateProgress(planDoc.steps);
					return {
						message: `Updated step #${args.id} in session [${sId}] -> ${step.status}`,
						sessionId: sId,
						step,
						progress: bar,
						planFilePath: planDoc.planFilePath,
					};
				}
				return { error: `Step #${args.id} not found in session [${sId}]` };
			}

			// E. Request User Review / F. User Approval with Interactive UI Selection
			if (args.action === "request_review" || args.action === "approve") {
				const ui = execContext?.ctx?.ui;
				const hasUI = Boolean(execContext?.ctx?.hasUI && ui?.select);
				let userApproved = false;
				let userFeedback: string | undefined;

				let targetProfile: "default" | "ptc" = "default";
				if (hasUI && ui?.select) {
					const promptTitle = args.action === "approve"
						? `📋 用户已确认实施计划 [${planDoc.title}]，请选择执行模式：`
						: `📋 实施计划 [${planDoc.title}] 已就绪，请选择执行模式：`;

					const options = [
						"✅ 批准计划并自动切换至 Default 模式开始执行 (Approve & Switch to default)",
						"⚡ 批准计划并自动切换至 PTC 编程模式执行 (Approve & Switch to ptc / run_code)",
						"📝 提出修改意见并调整计划 (Provide feedback & adjust plan)",
						"💬 暂时不执行，我要先提问 (Ask questions / keep in plan mode)",
					];

					const chosen = await ui.select(promptTitle, options, { signal: execContext?.signal });
					if (chosen && chosen.startsWith("✅")) {
						userApproved = true;
						targetProfile = "default";
					} else if (chosen && chosen.startsWith("⚡")) {
						userApproved = true;
						targetProfile = "ptc";
					} else if (chosen && chosen.startsWith("📝") && ui.input) {
						const inputVal = await ui.input("请输入您的修改意见或需求调整：", "例如：增加夜间模式、调整性格维度分析...", { signal: execContext?.signal });
						if (inputVal && inputVal.trim()) {
							userFeedback = inputVal.trim();
						}
					}
				}

				if (userApproved) {
					planDoc.isApproved = true;
					const md = syncPlanToDisk(planDoc);
					const { bar } = calculateProgress(planDoc.steps);

					// Programmatically switch profile to targetProfile (default or ptc)
					await (ctx as any).parallel?.("pi/profile-switch", targetProfile);
					if (execContext?.ctx?.ui?.notify) {
						execContext.ctx.ui.notify(`已批准计划并自动切换至 ${targetProfile.toUpperCase()} 模式！`, "info");
					}
					(ctx as any).emit?.("pi/plan-approved", { sessionId: sId, plan: planDoc, targetProfile });

					const modeDesc = targetProfile === "ptc"
						? "Active profile has been automatically switched to 'ptc' (Programmatic Tool Calling with run_code dynamic TypeScript SDK). You may now execute the plan steps using run_code batch execution or file tools."
						: "Active profile has been automatically switched to 'default'. Full write/edit tools and git-guard checkpoints are now active. You may now begin implementing the plan steps.";

					return {
						message: `Implementation plan for session [${sId}] APPROVED by user! ${modeDesc}`,
						sessionId: sId,
						isApproved: true,
						autoSwitchedProfile: targetProfile,
						progress: bar,
						planFilePath: planDoc.planFilePath,
						markdown: md,
					};
				} else {
					planDoc.isApproved = false;
					const md = syncPlanToDisk(planDoc);
					const { bar } = calculateProgress(planDoc.steps);

					if (!hasUI && args.action === "approve") {
						return {
							status: "approval_unavailable",
							isApproved: false,
							message: "PLAN NOT APPROVED: interactive user confirmation is unavailable. The model cannot self-approve; the user must switch profiles explicitly.",
							sessionId: sId,
							progress: bar,
							planFilePath: planDoc.planFilePath,
							markdown: md,
						};
					}

					if (userFeedback) {
						return {
							status: "feedback_provided",
							isApproved: false,
							userFeedback,
							message: `🛑 PLAN NOT APPROVED: The user reviewed the plan and provided the following feedback:\n` +
								`"${userFeedback}"\n\n` +
								`YOU MUST NOT EXECUTE OR WRITE CODE. Update the implementation plan in \`${planDoc.planFilePath}\` to incorporate this feedback, and present the updated plan to the user.`,
							sessionId: sId,
							progress: bar,
							planFilePath: planDoc.planFilePath,
							markdown: md,
						};
					}

					return {
						status: "rejected",
						isApproved: false,
						message: `🛑 PLAN NOT APPROVED: The user selected to continue modifying the plan or discuss questions.\n` +
							`YOU MUST NOT WRITE CODE OR EXECUTE. DO NOT mark steps as in_progress or completed.\n` +
							`STOP immediately and ask the user what specific changes, adjustments, or questions they have regarding the plan.`,
						sessionId: sId,
						progress: bar,
						planFilePath: planDoc.planFilePath,
						markdown: md,
					};
				}
			}

			// G. View / Get Plan
			if (args.action === "view" || args.action === "get_plan") {
				const md = syncPlanToDisk(planDoc);
				const { bar, percentage } = calculateProgress(planDoc.steps);
				return {
					sessionId: sId,
					planTitle: planDoc.title,
					isApproved: planDoc.isApproved,
					totalSteps: planDoc.steps.length,
					progress: bar,
					percentage,
					planFilePath: planDoc.planFilePath,
					steps: [...planDoc.steps],
					markdown: md,
				};
			}

			// H. Finish & Generate Walkthrough
			if (args.action === "finish") {
				const incompleteSteps = planDoc.steps.filter((step) => step.status !== "completed");
				if (planDoc.steps.length === 0 || incompleteSteps.length > 0) {
					return {
						success: false,
						error: "PLAN_STEPS_INCOMPLETE",
						message: `Cannot finalize session [${sId}]: ${incompleteSteps.length || "no"} plan steps are incomplete.`,
						sessionId: sId,
					};
				}
				isPlanModeActive = false;
				planDoc.isApproved = true;
				if (args.summary) planDoc.walkthroughSummary = args.summary;

				// Generate walkthrough document
				const walkthroughMd = renderWalkthroughMarkdown(planDoc);
				writeDurableFile(planDoc.walkthroughFilePath, walkthroughMd);

				syncPlanToDisk(planDoc);
				(ctx as any).emit?.("pi/plan-completed", { sessionId: sId, totalSteps: planDoc.steps.length, plan: planDoc });
				const { bar } = calculateProgress(planDoc.steps);
				return {
					message: `Plan finalized for session [${sId}]. Walkthrough document generated at ${planDoc.walkthroughFilePath}`,
					sessionId: sId,
					progress: bar,
					walkthroughFilePath: planDoc.walkthroughFilePath,
					planFilePath: planDoc.planFilePath,
				};
			}

			// Default: list
			const { percentage, bar } = calculateProgress(planDoc.steps);
			return {
				sessionId: sId,
				totalSteps: planDoc.steps.length,
				progress: bar,
				percentage,
				isPlanModeActive,
				isApproved: planDoc.isApproved,
				planFilePath: planDoc.planFilePath,
				steps: [...planDoc.steps],
			};
		},
	});

	// 2. Intercept mutating tools during active plan mode before approval
	const removeToolInterceptor = ctx.on("pi/tool-call" as any, async (event: { name?: string; toolName?: string; sessionId?: string }) => {
		if (!isPlanModeActive || !autoBlockWrites) return;

		const sId = event.sessionId || activeSessionId || "default";
		const planDoc = getOrCreatePlan(sId);
		if (planDoc.isApproved) return; // Unblocked once plan is approved!

		const toolName = event.toolName ?? event.name ?? "";
		const mutatingTools = ["write", "edit", "patch", "apply_patch"];
		if (mutatingTools.includes(toolName)) {
			throw new Error(
				`[plan-mode] File modification tool "${toolName}" is blocked in session [${sId}] while in Plan Mode. ` +
				`Please present your implementation plan (${planDoc.planFilePath}) for user review and obtain approval (or switch to default mode via '/profile default') before making changes.`
			);
		}
	});

	// 3. Prompt injection of active plan and durable plan file path
	let removePromptHook: (() => void) | undefined;
	if (injectGuidelines) {
		removePromptHook = ctx.on("pi/prompt-transform" as any, async (event: { prompt: string; sessionId?: string }) => {
			const sId = event.sessionId || activeSessionId || "default";
			const planDoc = getOrCreatePlan(sId);

			if (!isPlanModeActive && planDoc.steps.length === 0) return;

			const { bar } = calculateProgress(planDoc.steps);
			const approvalTag = planDoc.isApproved ? "🟢 Approved" : "🟡 Pending User Approval";

			let planText = `\n\n## 🗺️ Current Implementation Plan [Session: ${sId}] (${approvalTag} | ${bar}):\n`;
			planText += `Plan Artifact: \`${planDoc.planFilePath}\`\n`;

			if (planDoc.steps.length === 0) {
				planText += "No steps added yet. Use `plan_step({ action: 'set_plan' | 'add' })` to formulate your strategy.\n";
			} else {
				planText += planDoc.steps
					.map((s) => {
						const badge = s.status === "completed" ? "✓" : s.status === "in_progress" ? "▶" : s.status === "failed" ? "✗" : "⏳";
						const dep = s.dependsOn && s.dependsOn.length > 0 ? ` (depends on #${s.dependsOn.join(", #")})` : "";
						return `[${badge}] #${s.id}: ${s.title}${dep}`;
					})
					.join("\n") + "\n";
			}

			planText += `\n> ⚠️ [Plan Mode Policy]: You are in read-only Plan Mode. Formulate/update the plan in \`${planDoc.planFilePath}\`. Do NOT attempt to write or edit files in this mode.\n`;
			planText += `> 🔴 MANDATORY: Once you have formulated the plan steps, you MUST call \`plan_step({ action: "request_review" })\` in your tool calls! Do NOT just ask in plain text. Calling \`plan_step({ action: "request_review" })\` is the ONLY way to pop up the interactive User Approval dialog in the terminal for the user to approve and switch modes.\n`;
			planText += `> 🛑 CRITICAL: If the user does NOT approve (chooses to modify the plan or ask questions), you MUST STOP immediately and respond to the user with questions or plan updates. NEVER proceed to execute steps or write code without user approval!\n`;

			event.prompt += planText;
		});
	}

	// Reversible disposal
	ctx.effect(() => () => {
		unregisterTool();
		removeToolInterceptor();
		removePromptHook?.();
		removeSessionStartHook();
	});

	return () => {
		unregisterTool();
		removeToolInterceptor();
		removePromptHook?.();
		removeSessionStartHook();
	};
}

export default { name, inject, apply };
