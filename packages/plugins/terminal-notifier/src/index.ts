import type { Context } from "@deepseek-ai/cordis";

export const name = "terminal-notifier";
export const inject = [];

export function apply(ctx: Context) {
	const emitOsc777 = (title: string, body: string) => {
		if (!process.stdout.isTTY) return;
		try {
			process.stdout.write(`\x1b]777;notify;${title};${body}\x07`);
		} catch {
			// Ignore terminal write errors
		}
	};

	const unregisterTool = ctx.on("pi/tool-call" as any, (evt: { name?: string; toolName?: string; hasUI?: boolean }) => {
		const tool = evt?.name ?? evt?.toolName;
		if (tool === "ask_question" && evt.hasUI !== false) {
			emitOsc777("Pi Agent", "Waiting for your answer...");
		}
	});

	const unregisterTurn = ctx.on("pi/turn-end", () => {
		emitOsc777("Pi Agent", "Turn completed.");
	});

	return () => {
		unregisterTool();
		unregisterTurn();
	};
}

export const TerminalNotifierPlugin = { name, inject, apply };
export default TerminalNotifierPlugin;
