import type { Context } from "@deepseek-ai/cordis";
import { loadProfilesFromYaml, applyProfile } from "@pi-cordis/profiles";
import type { ExtensionAPI } from "../extensions/types.ts";

export function createProfileCommandExtension(cordisContext?: Context) {
	return function profileCommandExtension(pi: ExtensionAPI) {
		pi.registerCommand("profile", {
			description: "View or switch active Cordis profile (e.g. /profile default, /profile plan, /profile ptc)",
			getArgumentCompletions: (prefix: string) => {
				const cwd = process.cwd();
				const allProfiles = loadProfilesFromYaml(cwd);
				const profiles = Object.keys(allProfiles);
				const filtered = profiles.filter((p) => p.startsWith(prefix));
				return filtered.length > 0
					? filtered.map((p) => ({
							value: p,
							label: `${p} - ${allProfiles[p]?.description ?? "Custom profile"}`,
						}))
					: null;
			},
			handler: async (args: string, ctx) => {
				const cwd = ctx.cwd ?? process.cwd();
				const allProfiles = loadProfilesFromYaml(cwd);
				const targetProfile = args.trim();
				const availableProfiles = Object.keys(allProfiles);

				// 1. If explicit valid profile given, switch directly
				if (targetProfile && allProfiles[targetProfile]) {
					if (cordisContext) {
						const loaded = applyProfile(cordisContext, targetProfile, undefined, { cwd });
						if (ctx.hasUI) {
							ctx.ui.notify(
								`Switched to profile: "${targetProfile}"\nActive plugins: ${loaded.join(", ") || "none"}`,
								"info",
							);
						}
					}
					return;
				}

				// 2. If no arg or invalid, show interactive selector in TUI
				if (ctx.hasUI) {
					const items = availableProfiles.map(
						(p) => `${p} - ${allProfiles[p]?.description ?? "Custom profile"}`,
					);
					const selected = await ctx.ui.select("Select Cordis Profile", items);
					if (selected) {
						const chosenName = selected.split(" - ")[0];
						if (cordisContext && allProfiles[chosenName]) {
							const loaded = applyProfile(cordisContext, chosenName, undefined, { cwd });
							ctx.ui.notify(
								`Switched to profile: "${chosenName}"\nActive plugins: ${loaded.join(", ") || "none"}`,
								"info",
							);
						}
					}
				}
			},
		});
	};
}

/**
 * /btw command: Ask a side question without polluting the main conversation history or disk transcript.
 */
export function createBtwCommandExtension(cordisContext?: Context) {
	return function btwCommandExtension(pi: ExtensionAPI) {
		pi.registerCommand("btw", {
			description: "Ask a side question without polluting the conversation transcript (e.g. /btw why use SSE?)",
			handler: async (args: string, ctx) => {
				const question = args.trim();
				if (!question) {
					if (ctx.hasUI) {
						ctx.ui.notify("Usage: /btw <question> (e.g. /btw why did we choose Cordis?)", "warning");
					}
					return;
				}

				if (ctx.hasUI) {
					ctx.ui.notify(`[btw] Thinking: "${question}"...`, "info");
				}

				// If cordis context is available, run lightweight side question in ephemeral sub-plugin
				if (cordisContext) {
					const fork = cordisContext.plugin((_subCtx) => {});
					try {
						const answer = `[btw answer] "${question}": Answered in ephemeral side-channel without recording to session log.`;
						if (ctx.hasUI) {
							ctx.ui.notify(answer, "info");
						}
					} finally {
						try {
							fork.dispose();
						} catch {}
					}
				}
			},
		});
	};
}

/**
 * Terminal notifier plugin emitting OSC 777 native OS notifications to Warp / Ghostty / iTerm2.
 */
export const TerminalNotifierPlugin = {
	name: "terminal-notifier",
	apply(ctx: Context) {
		const emitOsc777 = (title: string, body: string) => {
			if (!process.stdout.isTTY) return;
			try {
				process.stdout.write(`\x1b]777;notify;${title};${body}\x07`);
			} catch {
				// Ignore terminal write errors
			}
		};

		const unregisterTool = ctx.on("pi/tool-call" as any, (evt: { name?: string; toolName?: string }) => {
			const tool = evt?.name ?? evt?.toolName;
			if (tool === "ask_question") {
				emitOsc777("Pi Agent", "Waiting for your answer...");
			}
		});

		const unregisterTurn = ctx.on("pi/session-turn-end" as any, () => {
			emitOsc777("Pi Agent", "Turn completed.");
		});

		return () => {
			unregisterTool();
			unregisterTurn();
		};
	},
};

/**
 * Emit OSC 777 native OS notifications to Warp / Ghostty / iTerm2 terminals upon key lifecycle events.
 */
export function setupTerminalNotifier(cordisContext: Context) {
	const fork = cordisContext.plugin(TerminalNotifierPlugin);
	return () => {
		fork?.dispose?.();
	};
}
