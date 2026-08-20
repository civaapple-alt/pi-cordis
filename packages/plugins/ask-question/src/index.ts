import type { Context } from "@deepseek-ai/cordis";

export interface QuestionOption {
	label: string;
	description?: string;
	preview?: string;
	note?: string;
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
	notes?: string;
}

export interface AskQuestionResult {
	answers: QuestionAnswer[];
	question?: string;
	options?: string[];
	selected?: string;
	wasCustom?: boolean;
	notes?: string;
}

export const name = "ask-question";
export const inject = ["tools"];

export function apply(ctx: Context, config: AskQuestionConfig = {}) {
	const unregisterTool = ctx.tools.register({
		name: "ask_question",
		description: "Ask the user one or more clarifying questions with selectable options, markdown previews, or custom text input.",
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
										preview: { type: "string", description: "Optional Markdown/Code diff preview content" },
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
							preview: { type: "string" },
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
			const hasPreview = args.questions?.some((q) => q.options?.some((o) => Boolean(o.preview)));
			const previewTag = hasPreview ? " [with preview]" : "";
			if (!theme?.fg) return `❓ ask_question (${count} question${count > 1 ? "s" : ""}${previewTag}): ${title}`;
			return `${theme.fg("accent", theme.bold("❓ ask_question "))}${theme.fg("dim", `(${count} question${count > 1 ? "s" : ""}${previewTag})`)}\n${theme.fg("foreground", title)}`;
		},
		renderResult: (result: AskQuestionResult, options?: any, theme?: any) => {
			const ans = result?.answers?.[0]?.selected?.join(", ") ?? result?.selected ?? "Answered";
			const noteText = result?.notes ? ` (Note: ${result.notes})` : "";
			if (!theme?.fg) return `✓ User answer: ${ans}${noteText}`;
			return `${theme.fg("success", "✓ User answer:")} ${theme.fg("foreground", ans)}${theme.fg("dim", noteText)}`;
		},
		execute: async (
			args: {
				questions?: QuestionItem[];
				question?: string;
				options?: QuestionOption[];
				allowCustom?: boolean;
			},
			execContext?: any,
		): Promise<AskQuestionResult> => {
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

			const answers: QuestionAnswer[] = [];
			const ui = execContext?.ctx?.ui;
			const hasUI = Boolean(execContext?.ctx?.hasUI && ui?.select);
			const signal = execContext?.signal;

			for (let idx = 0; idx < items.length; idx++) {
				const q = items[idx];
				const id = q.id ?? `q_${idx + 1}`;
				let selected: string[] = [];
				let custom: string | undefined;
				let notes: string | undefined;

				if (hasUI && ui && typeof ui.select === "function") {
					if (q.options && q.options.length > 0) {
						const optionMap = new Map<string, QuestionOption>();
						const displayLabels: string[] = [];

						for (const opt of q.options) {
							const display = opt.description ? `${opt.label} (${opt.description})` : opt.label;
							displayLabels.push(display);
							optionMap.set(display, opt);
							optionMap.set(opt.label, opt);
						}

						if (args.allowCustom !== false) {
							displayLabels.push("✍️ Other (Type custom answer)");
						}

						const chosen = await ui.select(q.question, displayLabels, { signal });

						if (chosen === "✍️ Other (Type custom answer)") {
							const inputVal = await ui.input(q.question, "Enter your answer...", { signal });
							const trimmed = inputVal?.trim();
							if (trimmed) {
								custom = trimmed;
								selected = [trimmed];
							} else {
								selected = [q.options[0]?.label ?? "Yes"];
								notes = q.options[0]?.note;
							}
						} else if (chosen) {
							const matched = optionMap.get(chosen);
							const label = matched?.label ?? chosen;
							selected = [label];
							notes = matched?.note;
						} else {
							// Cancelled by user
							selected = [q.options[0]?.label ?? "Cancelled"];
							notes = q.options[0]?.note;
						}
					} else {
						// Free-text question without options
						const inputVal = await ui.input(q.question, "Enter your answer...", { signal });
						const trimmed = inputVal?.trim();
						if (trimmed) {
							custom = trimmed;
							selected = [trimmed];
						} else {
							selected = ["No answer provided"];
						}
					}
				} else {
					// Non-interactive / Headless fallback (e.g. CI / automated tests)
					const firstOption = q.options?.[0]?.label ?? "Yes";
					selected = [firstOption];
					notes = q.options?.[0]?.note;
				}

				answers.push({
					id,
					selected,
					custom,
					notes,
				});
			}

			const primaryAnswer = answers[0]?.selected?.[0] ?? "";
			const primaryOptions = items[0]?.options?.map((o) => o.label) ?? [];

			return {
				answers,
				question: items[0]?.question,
				options: primaryOptions,
				selected: primaryAnswer,
				wasCustom: Boolean(answers[0]?.custom),
				notes: answers[0]?.notes,
			};
		},
	});

	return () => {
		unregisterTool();
	};
}

export default { name, inject, apply };

