import type { Context } from "@deepseek-ai/cordis";

export interface SessionHandoffConfig {
	autoArchiveOldSession?: boolean;
}

export const name = "session-handoff";
export const inject = ["tools"];

export function apply(ctx: Context, config: SessionHandoffConfig = {}) {
	const unregisterTool = ctx.tools.register({
		name: "session_handoff",
		description: "Package current goal, accomplishments, and next steps to smoothly transition to a fresh focused session.",
		parameters: {
			type: "object",
			properties: {
				newGoal: {
					type: "string",
					description: "The primary objective of the new focused session",
				},
				accomplishments: {
					type: "array",
					items: { type: "string" },
					description: "List of key milestones accomplished in this session",
				},
				nextSteps: {
					type: "array",
					items: { type: "string" },
					description: "List of immediate next steps for the new session",
				},
				criticalFiles: {
					type: "array",
					items: { type: "string" },
					description: "Important files relevant to the next goal",
				},
			},
			required: ["newGoal", "nextSteps"],
		},
		execute: async (args: {
			newGoal: string;
			accomplishments?: string[];
			nextSteps: string[];
			criticalFiles?: string[];
		}) => {
			const handoffPayload = {
				timestamp: new Date().toISOString(),
				newGoal: args.newGoal,
				accomplishments: args.accomplishments ?? [],
				nextSteps: args.nextSteps,
				criticalFiles: args.criticalFiles ?? [],
			};

			ctx.emit("pi/handoff" as any, handoffPayload);

			return {
				success: true,
				message: `Session handoff generated for goal: "${args.newGoal}". Context packaged and ready for new session.`,
				handoff: handoffPayload,
			};
		},
	});

	return () => {
		unregisterTool();
	};
}

export default { name, inject, apply };
