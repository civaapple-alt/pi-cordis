import type { Context } from "@deepseek-ai/cordis";

export interface PlanStep {
	id: number;
	title: string;
	status: "pending" | "in_progress" | "completed" | "failed";
	notes?: string;
}

export interface PlanModeConfig {
	autoBlockWrites?: boolean;
	injectGuidelines?: boolean;
}

export const name = "plan-mode";
export const inject = ["tools"];

export function apply(ctx: Context, config: PlanModeConfig = {}) {
	const steps: PlanStep[] = [];
	let isPlanModeActive = true;
	const autoBlockWrites = config.autoBlockWrites ?? true;
	const injectGuidelines = config.injectGuidelines ?? true;

	// 1. Register plan_step tool
	const unregisterTool = ctx.tools.register({
		name: "plan_step",
		description: "Create or update implementation plan steps during planning phase.",
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
				notes: { type: "string", description: "Optional notes/rationale" },
			},
			required: ["action"],
		},
		execute: async (args: { action: string; id?: number; title?: string; status?: PlanStep["status"]; notes?: string }) => {
			if (args.action === "add" && args.title) {
				const id = steps.length + 1;
				const step: PlanStep = { id, title: args.title, status: args.status ?? "pending", notes: args.notes };
				steps.push(step);
				return { message: `Added plan step #${id}: ${args.title}`, step };
			}

			if (args.action === "update" && args.id) {
				const step = steps.find((s) => s.id === args.id);
				if (step) {
					if (args.title) step.title = args.title;
					if (args.status) step.status = args.status;
					if (args.notes) step.notes = args.notes;
					return { message: `Updated plan step #${args.id}`, step };
				}
				return { error: `Step #${args.id} not found` };
			}

			if (args.action === "finish") {
				isPlanModeActive = false;
				return { message: "Plan completed. Exiting plan mode to proceed with execution." };
			}

			return { totalSteps: steps.length, steps: [...steps] };
		},
	});

	// 2. Intercept mutating tools during active plan mode
	const removeToolInterceptor = ctx.on("pi/tool-call", async (event: { name: string; args: Record<string, unknown> }) => {
		if (!isPlanModeActive || !autoBlockWrites) return;

		const mutatingTools = ["write", "edit", "patch", "apply_patch"];
		if (mutatingTools.includes(event.name)) {
			throw new Error(`[plan-mode] File modification tool "${event.name}" is blocked while in Plan Mode. Please finalize your plan first.`);
		}
	});

	// 3. Prompt injection of active plan
	let removePromptHook: (() => void) | undefined;
	if (injectGuidelines) {
		removePromptHook = ctx.on("pi/prompt-transform", async (event: { prompt: string }) => {
			if (!isPlanModeActive && steps.length === 0) return;

			let planText = "\n\n## 🗺️ Current Implementation Plan:\n";
			if (steps.length === 0) {
				planText += "No steps added yet. Use `plan_step` to outline your strategy before making changes.\n";
			} else {
				planText += steps.map((s) => `[${s.status.toUpperCase()}] #${s.id}: ${s.title}`).join("\n") + "\n";
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
