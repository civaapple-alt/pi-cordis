import type { Context } from "@deepseek-ai/cordis";

export interface GitAutomationConfig {
	autoSuggestCommit?: boolean;
	conventionalCommits?: boolean;
}

export const name = "git-automation";
export const inject = ["tools"];

export function apply(ctx: Context, config: GitAutomationConfig = {}) {
	const conventionalCommits = config.conventionalCommits ?? true;

	const unregisterTool = ctx.tools.register({
		name: "git_smart_commit",
		description: "Generate structured conventional commit messages and automate git staging & commit workflow.",
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
					description: "Concise description of the change",
				},
				issueNumber: {
					type: "number",
					description: "Optional GitHub issue number (e.g. 42)",
				},
			},
			required: ["type", "message"],
		},
		execute: async (args: { type: string; scope?: string; message: string; issueNumber?: number }) => {
			const scopePart = args.scope ? `(${args.scope})` : "";
			const issuePart = args.issueNumber ? ` (#${args.issueNumber})` : "";
			const formattedMessage = `${args.type}${scopePart}: ${args.message}${issuePart}`;

			return {
				success: true,
				commitMessage: formattedMessage,
				conventional: conventionalCommits,
				instruction: `Ready to commit with: git commit -m "${formattedMessage}"`,
			};
		},
	});

	return () => {
		unregisterTool();
	};
}

export default { name, inject, apply };
