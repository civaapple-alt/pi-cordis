import type { Context } from "@deepseek-ai/cordis";
import type { Model, Api } from "@earendil-works/pi-ai";

export interface BtwPluginConfig {
	systemPrompt?: string;
}

export const name = "btw";
export const inject = ["extensions", "ai"];

export function apply(ctx: Context, config: BtwPluginConfig = {}) {
	const defaultSystemPrompt =
		config.systemPrompt ??
		"You are a concise, helpful coding assistant answering an ephemeral side question. Provide a direct, focused response in 1-3 paragraphs without conversational filler.";

	const removeCommand = ctx.extensions?.registerCommand?.("btw", {
		description: "Ask a side question to the LLM without polluting conversation history (e.g. /btw what is SSE?)",
		handler: async (args: string, cmdCtx: any) => {
			const question = args.trim();
			if (!question) {
				if (cmdCtx.hasUI) {
					cmdCtx.ui.notify("Usage: /btw <question> (e.g. /btw why use Cordis?)", "warning");
				}
				return;
			}

			if (cmdCtx.hasUI) {
				cmdCtx.ui.notify(`[btw] Thinking: "${question}"...`, "info");
			}

			ctx.emit("pi/btw-query" as any, { question });

			// 1. Resolve available model
			let model: Model<Api> | undefined = ctx.ai?.activeModel;
			if (!model) {
				const available = ctx.ai?.getAvailableModels?.() ?? [];
				if (available.length > 0) {
					model = available[0];
				}
			}

			if (!model) {
				if (cmdCtx.hasUI) {
					cmdCtx.ui.notify(
						`[btw answer] "${question}": No active or available LLM configured. Please check your API key.`,
						"warning",
					);
				}
				return;
			}

			// 2. Perform ephemeral single-turn completion (100% bypass, no session logging)
			try {
				const runtime = ctx.ai.getRuntime();
				const response = await runtime.completeSimple(
					model,
					{
						systemPrompt: defaultSystemPrompt,
						messages: [
							{
								role: "user",
								content: question,
								timestamp: Date.now(),
							},
						],
					},
					{
						signal: AbortSignal.timeout(30_000),
					},
				);

				const answerText =
					response.content
						?.filter((c: any) => c.type === "text")
						.map((c: any) => c.text)
						.join("\n")
						.trim() || "No response content received.";

				ctx.emit("pi/btw-response" as any, { question, answer: answerText });

				if (cmdCtx.hasUI) {
					cmdCtx.ui.notify(`[btw: ${model.id}]\n${answerText}`, "info");
				}
			} catch (err: any) {
				const errorMsg = err instanceof Error ? err.message : String(err);
				if (cmdCtx.hasUI) {
					cmdCtx.ui.notify(`[btw error] Failed to get answer: ${errorMsg}`, "error");
				}
			}
		},
	});

	return () => {
		removeCommand?.();
	};
}

export default { name, inject, apply };
