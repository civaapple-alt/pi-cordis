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
		description: "Private unavailable prototype. Not connected to Pi's compaction driver.",
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
			const success = result?.success === true;
			if (!theme?.fg) return `${success ? "✓ Context compaction completed" : "✗ Context compaction unavailable"} (Threshold: ${tokenThreshold})`;
			return `${theme.fg(success ? "success" : "error", success ? "✓ Context compaction completed" : "✗ Context compaction unavailable")} ${theme.fg("dim", `(Token threshold: ${tokenThreshold})`)}`;
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

			return {
				success: false,
				error: "COMPACTION_DRIVER_UNAVAILABLE",
				message: "Compaction was not performed: this private prototype is not connected to Pi's native compaction driver.",
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
