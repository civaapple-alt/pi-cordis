export interface RenderOptions {
	expanded?: boolean;
	isPartial?: boolean;
}

/**
 * Render tool invocation call header for run_code
 */
export function renderCodeModeCall(args: { code?: string }, theme?: any): string {
	const code = args?.code ?? "";
	const lines = code.trim().split("\n");
	const lineCount = lines.length;
	const preview = lines.slice(0, 4).join("\n");
	const moreCount = lineCount > 4 ? ` ... (${lineCount - 4} more lines)` : "";

	if (!theme || typeof theme.fg !== "function") {
		return `⚡ run_code (${lineCount} lines)\n${preview}${moreCount}`;
	}

	let text = theme.fg("accent", theme.bold?.("⚡ run_code ") ?? "⚡ run_code ");
	text += theme.fg("dim", `(${lineCount} lines)`);
	text += "\n" + theme.fg("muted", preview);
	if (moreCount) {
		text += "\n" + theme.fg("dim", moreCount);
	}
	return text;
}

/**
 * Render tool execution result card for run_code
 */
export function renderCodeModeResult(result: any, options: RenderOptions = {}, theme?: any): string {
	const details = result?.details ?? result ?? {};
	const success = details.success !== false;
	const timeMs = details.executionTimeMs ?? 0;
	const output = (details.output ?? "").trim();
	const error = details.error;
	const backend = details.backend ?? "unknown";
	const backendLabel = details.degraded ? `${backend}, degraded` : backend;

	if (!theme || typeof theme.fg !== "function") {
		if (!success) {
			return `✗ Failed in ${timeMs}ms [${backendLabel}]: ${error}\n${output}`;
		}
		if (!options.expanded) {
			const firstLine = output.split("\n")[0] || "(No output)";
			return `✓ Executed in ${timeMs}ms [${backendLabel}]: ${firstLine}`;
		}
		return `✓ Executed in ${timeMs}ms [${backendLabel}]\n${output}`;
	}

	let text = "";
	if (success) {
		text += theme.fg("success", `✓ Executed in ${timeMs}ms [${backendLabel}]`);
	} else {
		text += theme.fg("error", `✗ Failed in ${timeMs}ms [${backendLabel}]: ${error ?? "Unknown error"}`);
	}

	if (!options.expanded) {
		const firstLine = output.split("\n")[0] || "";
		if (firstLine) {
			const preview = firstLine.length > 80 ? `${firstLine.slice(0, 80)}...` : firstLine;
			text += theme.fg("dim", ` → ${preview}`);
		}
	} else {
		text += "\n" + theme.fg("dim", "─".repeat(40));
		if (output) {
			text += "\n" + output;
		}
		if (error) {
			text += "\n" + theme.fg("error", `[Error] ${error}`);
		}
	}

	return text;
}
