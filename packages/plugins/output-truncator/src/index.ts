import type { Context } from "@deepseek-ai/cordis";
import * as fs from "node:fs";
import * as path from "node:path";

export interface OutputTruncatorConfig {
	maxBytes?: number;
	maxLines?: number;
	headLines?: number;
	tailLines?: number;
	spillDir?: string;
	enableSpill?: boolean;
}

export interface TruncateResult {
	text: string;
	truncated: boolean;
	spillPath?: string;
	totalBytes: number;
	totalLines: number;
}

export const name = "output-truncator";
export const inject = ["settings"];

/**
 * Truncate oversized output with Head/Tail preservation and optional Spill persistence
 */
export function truncateTextWithSpill(
	text: string,
	options: {
		maxBytes?: number;
		maxLines?: number;
		headLines?: number;
		tailLines?: number;
		spillDir?: string;
		enableSpill?: boolean;
		cwd?: string;
	} = {},
): TruncateResult {
	if (!text || typeof text !== "string") {
		return { text: text ?? "", truncated: false, totalBytes: 0, totalLines: 0 };
	}

	const maxBytes = options.maxBytes ?? 50 * 1024;
	const maxLines = options.maxLines ?? 2000;
	const headCount = options.headLines ?? 30;
	const tailCount = options.tailLines ?? 20;
	const enableSpill = options.enableSpill ?? true;
	const cwd = options.cwd ?? process.cwd();

	const totalBytes = Buffer.byteLength(text, "utf-8");
	const lines = text.split("\n");
	const totalLines = lines.length;

	if (totalBytes <= maxBytes && totalLines <= maxLines) {
		return { text, truncated: false, totalBytes, totalLines };
	}

	let spillPath: string | undefined;

	// 1. Spill full output to disk if enabled
	if (enableSpill) {
		try {
			const targetDir = options.spillDir ?? path.join(cwd, ".pi", "spill");
			if (!fs.existsSync(targetDir)) {
				fs.mkdirSync(targetDir, { recursive: true });
			}
			const spillFilename = `spill_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.txt`;
			const fullSpillPath = path.join(targetDir, spillFilename);
			fs.writeFileSync(fullSpillPath, text, "utf-8");
			spillPath = path.relative(cwd, fullSpillPath).replace(/\\/g, "/");
		} catch {
			// If file writing fails, proceed with in-memory truncation
		}
	}

	// 2. Head / Tail line preservation
	let processedText: string;
	if (lines.length > (headCount + tailCount)) {
		const head = lines.slice(0, headCount).join("\n");
		const tail = lines.slice(-tailCount).join("\n");
		const omittedLines = lines.length - headCount - tailCount;

		let spillNotice = `\n\n[... Truncated: ${omittedLines} lines (${totalBytes} bytes) omitted by @pi-cordis/plugin-output-truncator ...]`;
		if (spillPath) {
			spillNotice += `\n[... Full output persisted to "${spillPath}". Use read(path="${spillPath}", offset=..., limit=...) to inspect sections ...]`;
		}
		spillNotice += "\n\n";

		processedText = head + spillNotice + tail;
	} else {
		// Single-line or few long lines exceeding byte limit
		const headBytes = Math.floor(maxBytes * 0.6);
		const tailBytes = Math.floor(maxBytes * 0.4);
		const head = text.slice(0, headBytes);
		const tail = text.slice(-tailBytes);

		let spillNotice = `\n\n[... Truncated: exceeded ${maxBytes} bytes limit ...]`;
		if (spillPath) {
			spillNotice += `\n[... Full output persisted to "${spillPath}". Use read(path="${spillPath}") to inspect ...]`;
		}
		spillNotice += "\n\n";

		processedText = head + spillNotice + tail;
	}

	return {
		text: processedText,
		truncated: true,
		spillPath,
		totalBytes,
		totalLines,
	};
}

export function apply(ctx: Context, config: OutputTruncatorConfig = {}) {
	const maxBytes = config.maxBytes ?? 50 * 1024;
	const maxLines = config.maxLines ?? 2000;
	const headLines = config.headLines ?? 30;
	const tailLines = config.tailLines ?? 20;
	const enableSpill = config.enableSpill ?? true;

	// Intercept tool result events to sanitize long output
	const removeHook = ctx.on("pi/tool-result" as any, async (event: { result: any }) => {
		if (!event || !event.result) return;
		const cwd = (ctx as any).settings?.getCwd?.() ?? process.cwd();

		if (typeof event.result === "string") {
			const res = truncateTextWithSpill(event.result, {
				maxBytes,
				maxLines,
				headLines,
				tailLines,
				enableSpill,
				cwd,
			});
			event.result = res.text;
		} else if (typeof event.result === "object") {
			for (const key of Object.keys(event.result)) {
				if (typeof event.result[key] === "string") {
					const res = truncateTextWithSpill(event.result[key], {
						maxBytes,
						maxLines,
						headLines,
						tailLines,
						enableSpill,
						cwd,
					});
					event.result[key] = res.text;
				}
			}
		}
	});

	return () => {
		removeHook();
	};
}

export { truncateTextWithSpill as truncateText };
export default { name, inject, apply };
