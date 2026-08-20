import type { Context } from "@deepseek-ai/cordis";

export interface ContextCompactorConfig {
	tokenThreshold?: number;
	summaryLength?: "compact" | "detailed";
}

export interface CompactionData {
	reason: string;
	timestamp: number;
	modifiedFiles?: string[];
	keyDecisions?: string[];
	resolvedIssues?: string[];
	pendingBlockers?: string[];
}

export const name = "context-compactor";
export const inject = ["tools"];

export function apply(ctx: Context, config: ContextCompactorConfig = {}) {
	const tokenThreshold = config.tokenThreshold ?? 100000;
	let lastCompactionTime = Date.now();

	// 1. Register trigger_compact tool
	const unregisterTool = ctx.tools.register({
		name: "trigger_compact",
		description: "Trigger structured conversation compaction to summarize past context across 4 core dimensions and reclaim token budget.",
		parameters: {
			type: "object",
			properties: {
				reason: {
					type: "string",
					description: "Contextual reason or milestone for triggering compaction",
				},
				modifiedFiles: {
					type: "array",
					items: { type: "string" },
					description: "List of modified files to preserve in memory",
				},
				keyDecisions: {
					type: "array",
					items: { type: "string" },
					description: "Architectural and design decisions to retain",
				},
				resolvedIssues: {
					type: "array",
					items: { type: "string" },
					description: "List of resolved problems or bugs",
				},
				pendingBlockers: {
					type: "array",
					items: { type: "string" },
					description: "Unresolved issues or immediate blockers",
				},
			},
		},
		renderCall: (args: { reason?: string }, theme?: any) => {
			const r = args?.reason ? `"${args.reason}"` : "Manual trigger";
			if (!theme?.fg) return `🗜️ trigger_compact: ${r}`;
			return `${theme.fg("accent", theme.bold("🗜️ trigger_compact "))}${theme.fg("dim", `(${r})`)}`;
		},
		renderResult: (result: any, options?: any, theme?: any) => {
			if (!theme?.fg) return `✓ Context compaction completed (Threshold: ${tokenThreshold})`;
			return `${theme.fg("success", "✓ Context compaction completed")} ${theme.fg("dim", `(Token threshold: ${tokenThreshold})`)}`;
		},
		execute: async (args: {
			reason?: string;
			modifiedFiles?: string[];
			keyDecisions?: string[];
			resolvedIssues?: string[];
			pendingBlockers?: string[];
		}) => {
			lastCompactionTime = Date.now();
			const data: CompactionData = {
				reason: args.reason ?? "Manual compaction triggered",
				timestamp: lastCompactionTime,
				modifiedFiles: args.modifiedFiles ?? [],
				keyDecisions: args.keyDecisions ?? [],
				resolvedIssues: args.resolvedIssues ?? [],
				pendingBlockers: args.pendingBlockers ?? [],
			};

			ctx.emit("pi/compact" as any, data);

			return {
				success: true,
				message: "Context compaction completed. Structured 4-dimensional summary preserved.",
				tokenThreshold,
				compaction: data,
			};
		},
	});

	// Reversible disposal
	return () => {
		unregisterTool();
	};
}

export default { name, inject, apply };
