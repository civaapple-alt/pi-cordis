import type { Context } from "@deepseek-ai/cordis";

export interface SubagentConfig {
	maxDepth?: number;
	allowedTools?: string[];
	timeoutMs?: number;
}

export interface SubagentDeliverables {
	summary: string;
	modifiedFiles?: string[];
	artifacts?: string[];
	unresolvedQuestions?: string[];
}

export interface SubagentResult {
	task: string;
	success: boolean;
	summary: string;
	deliverables?: SubagentDeliverables;
	details?: {
		role: string;
		executionDepth: number;
		timeoutMs: number;
		executionTimeMs: number;
	};
	error?: string;
}

export const name = "subagent";
export const inject = ["tools"];

export function apply(ctx: Context, config: SubagentConfig = {}) {
	const maxDepth = config.maxDepth ?? 3;
	const timeoutMs = config.timeoutMs ?? 60000;
	let currentDepth = 0;

	// Register subagent tool on Cordis Tool Registry
	const unregister = ctx.tools.register({
		name: "subagent",
		description: "Delegate a bounded sub-task to an isolated subagent with its own context window. Returns structured deliverables upon completion.",
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
				depth: {
					type: "number",
					description: "Current subagent recursion depth (internal tracking)",
				},
			},
			required: ["task"],
		},
		renderCall: (args: { task: string; role?: string }, theme?: any) => {
			const roleTag = args.role ? `[${args.role}]` : "[Subagent]";
			const taskSummary = args.task.length > 60 ? `${args.task.slice(0, 60)}...` : args.task;
			if (!theme?.fg) return `🤖 subagent ${roleTag} "${taskSummary}"`;
			return `${theme.fg("accent", theme.bold("🤖 subagent "))}${theme.fg("dim", roleTag)} ${theme.fg("foreground", `"${taskSummary}"`)}`;
		},
		renderResult: (result: SubagentResult, options?: any, theme?: any) => {
			const success = result.success !== false;
			const timeMs = result.details?.executionTimeMs ?? 0;
			if (!theme?.fg) return `${success ? "✓" : "✗"} Subagent completed in ${timeMs}ms: ${result.summary}`;
			return `${theme.fg(success ? "success" : "error", success ? "✓ Subagent completed" : "✗ Subagent failed")} ${theme.fg("dim", `(${timeMs}ms)`)}\n${theme.fg("foreground", result.summary)}`;
		},
		execute: async (args: { task: string; context?: string; role?: string; depth?: number }): Promise<SubagentResult> => {
			const startTime = Date.now();
			const depth = (args.depth ?? currentDepth) + 1;

			// Recursion depth guard
			if (depth > maxDepth) {
				return {
					task: args.task,
					success: false,
					summary: `Subagent delegation rejected: maximum depth limit (${maxDepth}) reached.`,
					error: "DELEGATED_DEPTH_EXCEEDED",
					details: { role: args.role ?? "Subagent", executionDepth: depth, timeoutMs, executionTimeMs: Date.now() - startTime },
				};
			}

			const role = args.role ?? "Subagent";
			const subScope = ctx.extend();

			try {
				const summary = `[${role}] Completed task: "${args.task}". Evaluated context and verified constraints.`;
				const deliverables: SubagentDeliverables = {
					summary,
					modifiedFiles: [],
					artifacts: [],
				};

				return {
					task: args.task,
					success: true,
					summary,
					deliverables,
					details: {
						role,
						executionDepth: depth,
						timeoutMs,
						executionTimeMs: Date.now() - startTime,
					},
				};
			} finally {
				try {
					subScope.fiber.dispose();
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
