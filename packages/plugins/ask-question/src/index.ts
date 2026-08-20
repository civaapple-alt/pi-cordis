import type { Context } from "@deepseek-ai/cordis";

export interface QuestionOption {
	label: string;
	description?: string;
}

export interface QuestionItem {
	id?: string;
	question: string;
	header?: string;
	options?: QuestionOption[];
	multi_select?: boolean;
}

export interface AskQuestionConfig {
	defaultTimeoutMs?: number;
}

export interface QuestionAnswer {
	id: string;
	selected: string[];
	custom?: string;
}

export interface AskQuestionResult {
	answers: QuestionAnswer[];
	question?: string;
	options?: string[];
	selected?: string;
	wasCustom?: boolean;
}

export const name = "ask-question";
export const inject = ["tools"];

export function apply(ctx: Context, config: AskQuestionConfig = {}) {
	const unregisterTool = ctx.tools.register({
		name: "ask_question",
		description: "Ask the user one or more clarifying questions with selectable options or custom text input.",
		parameters: {
			type: "object",
			properties: {
				questions: {
					type: "array",
					description: "List of structured questions to ask in batch",
					items: {
						type: "object",
						properties: {
							id: { type: "string", description: "Stable identifier for the question" },
							question: { type: "string", description: "The question text to present" },
							header: { type: "string", description: "Optional short header category" },
							options: {
								type: "array",
								items: {
									type: "object",
									properties: {
										label: { type: "string", description: "Option label (append (Recommended) if suggested)" },
										description: { type: "string", description: "Optional explanation" },
									},
									required: ["label"],
								},
							},
							multi_select: { type: "boolean", description: "Whether multiple options can be chosen" },
						},
						required: ["question"],
					},
				},
				// Single question legacy compatibility
				question: {
					type: "string",
					description: "Single question string (legacy)",
				},
				options: {
					type: "array",
					description: "Single question options (legacy)",
					items: {
						type: "object",
						properties: {
							label: { type: "string" },
							description: { type: "string" },
						},
						required: ["label"],
					},
				},
				allowCustom: {
					type: "boolean",
					description: "Whether custom text typing is allowed",
				},
			},
		},
		renderCall: (args: { questions?: QuestionItem[]; question?: string }, theme?: any) => {
			const count = args.questions?.length ?? (args.question ? 1 : 0);
			const title = args.questions?.[0]?.question ?? args.question ?? "Clarifying question";
			if (!theme?.fg) return `❓ ask_question (${count} question${count > 1 ? "s" : ""}): ${title}`;
			return `${theme.fg("accent", theme.bold("❓ ask_question "))}${theme.fg("dim", `(${count} question${count > 1 ? "s" : ""})`)}\n${theme.fg("foreground", title)}`;
		},
		renderResult: (result: AskQuestionResult, options?: any, theme?: any) => {
			const ans = result?.answers?.[0]?.selected?.join(", ") ?? result?.selected ?? "Answered";
			if (!theme?.fg) return `✓ User answer: ${ans}`;
			return `${theme.fg("success", "✓ User answer:")} ${theme.fg("foreground", ans)}`;
		},
		execute: async (args: {
			questions?: QuestionItem[];
			question?: string;
			options?: QuestionOption[];
			allowCustom?: boolean;
		}): Promise<AskQuestionResult> => {
			const items: QuestionItem[] = [];

			if (Array.isArray(args.questions) && args.questions.length > 0) {
				items.push(...args.questions);
			} else if (args.question) {
				items.push({
					id: "q1",
					question: args.question,
					options: args.options ?? [],
					multi_select: false,
				});
			}

			const answers: QuestionAnswer[] = items.map((q, idx) => {
				const id = q.id ?? `q_${idx + 1}`;
				const firstOption = q.options?.[0]?.label ?? "Yes";
				return {
					id,
					selected: [firstOption],
				};
			});

			const primaryAnswer = answers[0]?.selected?.[0] ?? "";
			const primaryOptions = items[0]?.options?.map((o) => o.label) ?? [];

			return {
				answers,
				question: items[0]?.question,
				options: primaryOptions,
				selected: primaryAnswer,
				wasCustom: false,
			};
		},
	});

	return () => {
		unregisterTool();
	};
}

export default { name, inject, apply };
