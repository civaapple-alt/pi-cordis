import type { Context } from "@deepseek-ai/cordis";

export interface QuestionOption {
	label: string;
	description?: string;
}

export interface AskQuestionConfig {
	defaultTimeoutMs?: number;
}

export const name = "ask-question";
export const inject = ["tools"];

export function apply(ctx: Context, config: AskQuestionConfig = {}) {
	const unregisterTool = ctx.tools.register({
		name: "ask_question",
		description: "Ask the user a clarifying question with selectable options or custom text input.",
		parameters: {
			type: "object",
			properties: {
				question: {
					type: "string",
					description: "The question to present to the user",
				},
				options: {
					type: "array",
					items: {
						type: "object",
						properties: {
							label: { type: "string", description: "Option label" },
							description: { type: "string", description: "Optional extra description" },
						},
						required: ["label"],
					},
					description: "List of options for the user to choose from",
				},
				allowCustom: {
					type: "boolean",
					description: "Whether to allow the user to type a custom answer",
				},
			},
			required: ["question", "options"],
		},
		execute: async (args: {
			question: string;
			options: QuestionOption[];
			allowCustom?: boolean;
		}) => {
			const optionLabels = args.options.map((o) => o.label);
			return {
				question: args.question,
				options: optionLabels,
				selected: optionLabels[0] ?? "Option 1",
				wasCustom: false,
			};
		},
	});

	return () => {
		unregisterTool();
	};
}

export default { name, inject, apply };
