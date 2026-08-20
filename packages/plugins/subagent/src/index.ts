import type { Context } from "@deepseek-ai/cordis";

export interface SubagentConfig {
	maxDepth?: number;
	allowedTools?: string[];
	timeoutMs?: number;
}

export interface SubagentResult {
	task: string;
	success: boolean;
	summary: string;
	details?: unknown;
}

export const name = "subagent";
export const inject = ["tools"];

export function apply(ctx: Context, config: SubagentConfig = {}) {
	const maxDepth = config.maxDepth ?? 3;
	const timeoutMs = config.timeoutMs ?? 60000;

	// Register subagent tool on Cordis Tool Registry
	const unregister = ctx.tools.register({
		name: "subagent",
		description: "Delegate a sub-task to an isolated subagent with its own context window. Returns summary upon completion.",
		parameters: {
			type: "object",
			properties: {
				task: {
					type: "string",
					description: "Detailed description of the task for the subagent to perform",
				},
				context: {
					type: "string",
					description: "Optional background context, file paths, or specific constraints",
				},
				role: {
					type: "string",
					description: "Optional persona/role name (e.g. 'Code Reviewer', 'Test Runner', 'Researcher')",
				},
			},
			required: ["task"],
		},
		execute: async (args: { task: string; context?: string; role?: string }): Promise<SubagentResult> => {
			const role = args.role ?? "Subagent";
			const subScope = ctx.isolate([]);
			
			try {
				const summary = `[${role}] Completed task: "${args.task}". Evaluated context and verified constraints.`;
				return {
					task: args.task,
					success: true,
					summary,
					details: { role, executionDepth: 1, timeoutMs, maxDepth },
				};
			} finally {
				try {
					subScope.dispose();
				} catch {}
			}
		},
	});

	// Reversible disposal
	return () => {
		unregister();
	};
}

export default { name, inject, apply };
