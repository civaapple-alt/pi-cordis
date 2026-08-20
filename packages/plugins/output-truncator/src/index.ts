import type { Context } from "@deepseek-ai/cordis";

export interface OutputTruncatorConfig {
	maxBytes?: number;
	maxLines?: number;
}

export const name = "output-truncator";
export const inject = [];

export function truncateText(text: string, maxBytes: number = 50 * 1024, maxLines: number = 2000): { text: string; truncated: boolean } {
	if (!text || typeof text !== "string") return { text, truncated: false };

	const lines = text.split("\n");
	let isTruncated = false;
	let processedText = text;

	// Line count truncation
	if (lines.length > maxLines) {
		const keepLines = lines.slice(0, maxLines);
		const omitted = lines.length - maxLines;
		processedText = keepLines.join("\n") + `\n\n[... Truncated: ${omitted} lines omitted by @pi-cordis/plugin-output-truncator ...]`;
		isTruncated = true;
	}

	// Byte length truncation
	const byteLength = Buffer.byteLength(processedText, "utf-8");
	if (byteLength > maxBytes) {
		const truncatedSlice = processedText.slice(0, maxBytes);
		processedText = truncatedSlice + `\n\n[... Truncated: exceeded ${maxBytes} bytes limit ...]`;
		isTruncated = true;
	}

	return { text: processedText, truncated: isTruncated };
}

export function apply(ctx: Context, config: OutputTruncatorConfig = {}) {
	const maxBytes = config.maxBytes ?? 50 * 1024;
	const maxLines = config.maxLines ?? 2000;

	// Intercept tool result events to sanitize long output
	const removeHook = ctx.on("pi/tool-result" as any, async (event: { result: any }) => {
		if (!event || !event.result) return;

		if (typeof event.result === "string") {
			const res = truncateText(event.result, maxBytes, maxLines);
			event.result = res.text;
		} else if (typeof event.result === "object") {
			for (const key of Object.keys(event.result)) {
				if (typeof event.result[key] === "string") {
					const res = truncateText(event.result[key], maxBytes, maxLines);
					event.result[key] = res.text;
				}
			}
		}
	});

	return () => {
		removeHook();
	};
}

export default { name, inject, apply };
