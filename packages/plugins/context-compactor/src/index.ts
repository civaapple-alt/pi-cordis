import type { Context } from "@deepseek-ai/cordis";

export interface ContextCompactorConfig {
	tokenThreshold?: number;
	summaryLength?: "compact" | "detailed";
}

export const name = "context-compactor";
export const inject = ["tools"];

export function apply(ctx: Context, config: ContextCompactorConfig = {}) {
	const tokenThreshold = config.tokenThreshold ?? 100000;
	let lastCompactionTime = Date.now();

	// 1. Register trigger_compact tool
	const unregisterTool = ctx.tools.register({
		name: "trigger_compact",
		description: "Manually trigger conversation compaction to summarize past context and reclaim token window space.",
		parameters: {
			type: "object",
			properties: {
				reason: {
					type: "string",
					description: "Optional reason for triggering compaction",
				},
			},
		},
		execute: async (args: { reason?: string }) => {
			lastCompactionTime = Date.now();
			ctx.emit("pi/compact" as any, {
				reason: args.reason ?? "Manual compaction triggered",
				timestamp: lastCompactionTime,
			});

			return {
				success: true,
				message: "Context compaction completed. Key decisions and modified files preserved in summary.",
				tokenThreshold,
			};
		},
	});

	// Reversible disposal
	return () => {
		unregisterTool();
	};
}

export default { name, inject, apply };
