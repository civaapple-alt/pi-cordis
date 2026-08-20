import type { Context } from "@deepseek-ai/cordis";

export interface SessionHandoffConfig {
	autoArchiveOldSession?: boolean;
}

export interface HandoffEnvelope {
	timestamp: string;
	sessionTitle?: string;
	newGoal: string;
	accomplishments: string[];
	nextSteps: string[];
	criticalFiles: string[];
	blockers?: string[];
	formattedMarkdown: string;
}

export const name = "session-handoff";
export const inject = ["tools"];

export function formatHandoffMarkdown(data: Omit<HandoffEnvelope, "formattedMarkdown">): string {
	let md = `# Session Handoff Briefing\n\n`;
	md += `**Timestamp:** ${data.timestamp}\n`;
	if (data.sessionTitle) md += `**Session:** ${data.sessionTitle}\n`;
	md += `**Target Goal:** ${data.newGoal}\n\n`;

	if (data.accomplishments.length > 0) {
		md += `## 🏆 Completed Accomplishments\n`;
		md += data.accomplishments.map((a) => `- ${a}`).join("\n") + "\n\n";
	}

	if (data.criticalFiles.length > 0) {
		md += `## 📁 Critical Files\n`;
		md += data.criticalFiles.map((f) => `- \`${f}\``).join("\n") + "\n\n";
	}

	if (data.nextSteps.length > 0) {
		md += `## 🚀 Immediate Next Steps\n`;
		md += data.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n") + "\n\n";
	}

	if (data.blockers && data.blockers.length > 0) {
		md += `## ⚠️ Blockers & Notes\n`;
		md += data.blockers.map((b) => `- ${b}`).join("\n") + "\n\n";
	}

	return md;
}

export function apply(ctx: Context, config: SessionHandoffConfig = {}) {
	const unregisterTool = ctx.tools.register({
		name: "session_handoff",
		description: "Package current goal, accomplishments, and next steps into a standardized Handoff Envelope for smooth transition to a fresh session.",
		parameters: {
			type: "object",
			properties: {
				newGoal: {
					type: "string",
					description: "The primary objective of the new focused session",
				},
				sessionTitle: {
					type: "string",
					description: "Optional title of the current session",
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
				blockers: {
					type: "array",
					items: { type: "string" },
					description: "Known obstacles or open questions",
				},
			},
			required: ["newGoal", "nextSteps"],
		},
		renderCall: (args: { newGoal: string; nextSteps?: string[] }, theme?: any) => {
			const stepsCount = args.nextSteps?.length ?? 0;
			if (!theme?.fg) return `📦 session_handoff -> "${args.newGoal}" (${stepsCount} next steps)`;
			return `${theme.fg("accent", theme.bold("📦 session_handoff "))} ${theme.fg("foreground", `-> "${args.newGoal}"`)} ${theme.fg("dim", `(${stepsCount} next steps)`)}`;
		},
		renderResult: (result: any, options?: any, theme?: any) => {
			const msg = result?.message ?? "Handoff ready";
			if (!theme?.fg) return `✓ ${msg}`;
			return `${theme.fg("success", "✓")} ${theme.fg("foreground", msg)}`;
		},
		execute: async (args: {
			newGoal: string;
			sessionTitle?: string;
			accomplishments?: string[];
			nextSteps: string[];
			criticalFiles?: string[];
			blockers?: string[];
		}) => {
			const rawData = {
				timestamp: new Date().toISOString(),
				sessionTitle: args.sessionTitle,
				newGoal: args.newGoal,
				accomplishments: args.accomplishments ?? [],
				nextSteps: args.nextSteps,
				criticalFiles: args.criticalFiles ?? [],
				blockers: args.blockers,
			};

			const formattedMarkdown = formatHandoffMarkdown(rawData);
			const envelope: HandoffEnvelope = {
				...rawData,
				formattedMarkdown,
			};

			ctx.emit("pi/handoff" as any, envelope);

			return {
				success: true,
				message: `Session handoff generated for goal: "${args.newGoal}". Standard envelope packaged.`,
				handoff: envelope,
			};
		},
	});

	return () => {
		unregisterTool();
	};
}

export default { name, inject, apply };
