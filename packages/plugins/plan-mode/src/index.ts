import type { Context } from "@deepseek-ai/cordis";

export interface PlanStep {
	id: number;
	title: string;
	status: "pending" | "in_progress" | "completed" | "failed";
	dependsOn?: number[];
	notes?: string;
}

export interface PlanModeConfig {
	autoBlockWrites?: boolean;
	injectGuidelines?: boolean;
}

export const name = "plan-mode";
export const inject = ["tools"];

export function calculateProgress(steps: PlanStep[]): { percentage: number; bar: string } {
	if (steps.length === 0) return { percentage: 0, bar: "[░░░░░░░░░░] 0%" };
	const completed = steps.filter((s) => s.status === "completed").length;
	const pct = Math.round((completed / steps.length) * 100);
	const filled = Math.round(pct / 10);
	const empty = 10 - filled;
	const bar = `[${"█".repeat(filled)}${"░".repeat(empty)}] ${pct}%`;
	return { percentage: pct, bar };
}

export function apply(ctx: Context, config: PlanModeConfig = {}) {
	const steps: PlanStep[] = [];
	let isPlanModeActive = true;
	const autoBlockWrites = config.autoBlockWrites ?? true;
	const injectGuidelines = config.injectGuidelines ?? true;

	// 1. Register plan_step tool
	const unregisterTool = ctx.tools.register({
		name: "plan_step",
		description: "Create, update, or finish implementation plan steps with dependency tracking and progress metrics.",
		parameters: {
			type: "object",
			properties: {
				action: {
					type: "string",
					enum: ["add", "update", "list", "finish"],
					description: "Action on plan steps",
				},
				id: { type: "number", description: "Step ID for update" },
				title: { type: "string", description: "Step description" },
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
				notes: { type: "string", description: "Optional notes/rationale" },
			},
			required: ["action"],
		},
		renderCall: (args: { action: string; title?: string; status?: string; id?: number }, theme?: any) => {
			const actionTag = args.action.toUpperCase();
			const desc = args.title ? `"${args.title}"` : args.id ? `#${args.id}` : "";
			if (!theme?.fg) return `🗺️ plan_step [${actionTag}] ${desc}`;
			return `${theme.fg("accent", theme.bold("🗺️ plan_step "))}${theme.fg("dim", `[${actionTag}]`)} ${theme.fg("foreground", desc)}`;
		},
		renderResult: (result: any, options?: any, theme?: any) => {
			const { bar } = calculateProgress(steps);
			const msg = result?.message ?? `Steps: ${steps.length}`;
			if (!theme?.fg) return `${msg} | Progress: ${bar}`;
			return `${theme.fg("success", msg)} ${theme.fg("dim", `| ${bar}`)}`;
		},
		execute: async (args: {
			action: string;
			id?: number;
			title?: string;
			status?: PlanStep["status"];
			dependsOn?: number[];
			notes?: string;
		}) => {
			if (args.action === "add" && args.title) {
				const id = steps.length + 1;
				const step: PlanStep = {
					id,
					title: args.title,
					status: args.status ?? "pending",
					dependsOn: args.dependsOn,
					notes: args.notes,
				};
				steps.push(step);
				const { bar } = calculateProgress(steps);
				return { message: `Added step #${id}: ${args.title}`, step, progress: bar };
			}

			if (args.action === "update" && args.id) {
				const step = steps.find((s) => s.id === args.id);
				if (step) {
					if (args.title) step.title = args.title;
					if (args.status) step.status = args.status;
					if (args.dependsOn) step.dependsOn = args.dependsOn;
					if (args.notes) step.notes = args.notes;
					const { bar } = calculateProgress(steps);
					return { message: `Updated step #${args.id} -> ${step.status}`, step, progress: bar };
				}
				return { error: `Step #${args.id} not found` };
			}

			if (args.action === "finish") {
				isPlanModeActive = false;
				(ctx as any).emit?.("pi/plan-completed", { totalSteps: steps.length });
				const { bar } = calculateProgress(steps);
				return { message: "Plan finalized. Exiting plan mode to proceed with execution.", progress: bar };
			}

			const { percentage, bar } = calculateProgress(steps);
			return {
				totalSteps: steps.length,
				progress: bar,
				percentage,
				isPlanModeActive,
				steps: [...steps],
			};
		},
	});

	// 2. Intercept mutating tools during active plan mode
	const removeToolInterceptor = ctx.on("pi/tool-call" as any, async (event: { name?: string; toolName?: string }) => {
		if (!isPlanModeActive || !autoBlockWrites) return;

		const toolName = event.toolName ?? event.name ?? "";
		const mutatingTools = ["write", "edit", "patch", "apply_patch"];
		if (mutatingTools.includes(toolName)) {
			throw new Error(`[plan-mode] File modification tool "${toolName}" is blocked while in Plan Mode. Finalize your plan via plan_step({ action: "finish" }) before making changes.`);
		}
	});

	// 3. Prompt injection of active plan
	let removePromptHook: (() => void) | undefined;
	if (injectGuidelines) {
		removePromptHook = ctx.on("pi/prompt-transform" as any, async (event: { prompt: string }) => {
			if (!isPlanModeActive && steps.length === 0) return;

			const { bar } = calculateProgress(steps);
			let planText = `\n\n## 🗺️ Current Implementation Plan (${bar}):\n`;
			if (steps.length === 0) {
				planText += "No steps added yet. Use `plan_step` to outline your strategy before making changes.\n";
			} else {
				planText += steps
					.map((s) => {
						const badge = s.status === "completed" ? "✓" : s.status === "in_progress" ? "▶" : s.status === "failed" ? "✗" : "⏳";
						const dep = s.dependsOn && s.dependsOn.length > 0 ? ` (depends on #${s.dependsOn.join(", #")})` : "";
						return `[${badge}] #${s.id}: ${s.title}${dep}`;
					})
					.join("\n") + "\n";
			}
			event.prompt += planText;
		});
	}

	// Reversible disposal
	return () => {
		unregisterTool();
		removeToolInterceptor();
		removePromptHook?.();
	};
}

export default { name, inject, apply };
