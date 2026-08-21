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
	sessionId?: string;
	details?: {
		role: string;
		allowedTools?: string[];
		executionDepth: number;
		timeoutMs: number;
		executionTimeMs: number;
	};
	error?: string;
}

export const name = "subagent";
export const inject = ["tools"];

const ROLE_TOOL_MAP: Record<string, string[]> = {
	scout: ["read", "grep", "find", "ls"],
	researcher: ["read", "grep", "find", "ls"],
	reviewer: ["read", "grep", "find"],
	oracle: ["read", "grep", "find"],
	worker: ["read", "write", "edit", "bash"],
	implementer: ["read", "write", "edit", "bash"],
};

export function apply(ctx: Context, config: SubagentConfig = {}) {
	const maxDepth = config.maxDepth ?? 3;
	const timeoutMs = config.timeoutMs ?? 60000;
	let currentDepth = 0;

	// Register subagent tool on Cordis Tool Registry
	const unregister = ctx.tools.register({
		name: "subagent",
		description: "Private unavailable prototype. No agent execution driver is connected.",
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
					enum: ["scout", "researcher", "reviewer", "oracle", "worker", "implementer", "delegate"],
					description: "Persona/role name determining tool permissions (e.g. 'scout' for read-only recon, 'worker' for implementation)",
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
			const sess = result.sessionId ? ` [${result.sessionId.slice(0, 8)}]` : "";
			if (!theme?.fg) return `${success ? "✓" : "✗"} Subagent${sess} result in ${timeMs}ms: ${result.summary}`;
			return `${theme.fg(success ? "success" : "error", success ? `✓ Subagent${sess} result` : `✗ Subagent${sess} unavailable`)} ${theme.fg("dim", `(${timeMs}ms)`)}\n${theme.fg("foreground", result.summary)}`;
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

			const role = (args.role || "delegate").toLowerCase();
			const allowedTools = ROLE_TOOL_MAP[role] ?? config.allowedTools;

			return {
				task: args.task,
				success: false,
				summary: "Subagent execution is unavailable: no agent driver is connected to this private prototype.",
				error: "SUBAGENT_DRIVER_UNAVAILABLE",
				details: {
					role,
					allowedTools,
					executionDepth: depth,
					timeoutMs,
					executionTimeMs: Date.now() - startTime,
				},
			};
		},
	});

	// Reversible disposal
	return () => {
		unregister();
	};
}

export default { name, inject, apply };
