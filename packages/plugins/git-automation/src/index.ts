import type { Context } from "@deepseek-ai/cordis";

export interface GitAutomationConfig {
	conventionalCommits?: boolean;
}

export interface SmartCommitResult {
	success: boolean;
	commitMessage: string;
	instruction: string;
	conventional: boolean;
	isBreakingChange: boolean;
}

export const name = "git-automation";
export const inject = ["tools"];

export function apply(ctx: Context, config: GitAutomationConfig = {}) {
	const conventionalCommits = config.conventionalCommits ?? true;

	const unregisterTool = ctx.tools.register({
		name: "git_smart_commit",
		description: "Format a proposed git commit message and shell instruction without executing git commit.",
		parameters: {
			type: "object",
			properties: {
				type: {
					type: "string",
					enum: ["feat", "fix", "docs", "style", "refactor", "test", "chore", "perf"],
					description: "Conventional commit type",
				},
				scope: {
					type: "string",
					description: "Optional commit scope (e.g. 'core', 'plugins', 'tui')",
				},
				message: {
					type: "string",
					description: "Concise description of the change in imperative mood",
				},
				issueNumber: {
					type: "number",
					description: "Optional GitHub issue number (e.g. 42)",
				},
				breakingChange: {
					type: "string",
					description: "Optional breaking change explanation",
				},
			},
			required: ["type", "message"],
		},
		renderCall: (args: { type: string; scope?: string; message: string }, theme?: any) => {
			const scopePart = args.scope ? `(${args.scope})` : "";
			const preview = `${args.type}${scopePart}: ${args.message}`;
			if (!theme?.fg) return `🌿 git_smart_commit: ${preview}`;
			return `${theme.fg("accent", theme.bold("🌿 git_smart_commit "))} ${theme.fg("foreground", preview)}`;
		},
		renderResult: (result: SmartCommitResult, options?: any, theme?: any) => {
			if (!theme?.fg) return `✓ Ready: ${result.instruction}`;
			return `${theme.fg("success", "✓ Commit Ready:")} ${theme.fg("dim", result.commitMessage)}`;
		},
		execute: async (args: {
			type: string;
			scope?: string;
			message: string;
			issueNumber?: number;
			breakingChange?: string;
		}): Promise<SmartCommitResult> => {
			const scopePart = args.scope ? `(${args.scope})` : "";
			const issuePart = args.issueNumber ? ` (#${args.issueNumber})` : "";
			const breakingMark = args.breakingChange ? "!" : "";

			let formattedMessage = conventionalCommits
				? `${args.type}${scopePart}${breakingMark}: ${args.message}${issuePart}`
				: `${args.message}${issuePart}`;

			if (args.breakingChange) {
				formattedMessage += `\n\nBREAKING CHANGE: ${args.breakingChange}`;
			}

			const escaped = formattedMessage.replace(/"/g, '\\"');

			return {
				success: true,
				commitMessage: formattedMessage,
				conventional: conventionalCommits,
				isBreakingChange: !!args.breakingChange,
				instruction: `git commit -m "${escaped}"`,
			};
		},
	});

	return () => {
		unregisterTool();
	};
}

export default { name, inject, apply };
