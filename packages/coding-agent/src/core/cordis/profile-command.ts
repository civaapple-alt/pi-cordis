import type { Context } from "@deepseek-ai/cordis";
import { BUILTIN_PROFILES, applyProfile } from "@pi-cordis/profiles";
import type { ExtensionAPI } from "../extensions/types.ts";

export function createProfileCommandExtension(cordisContext?: Context) {
	return function profileCommandExtension(pi: ExtensionAPI) {
		pi.registerCommand("profile", {
			description: "View or switch active Cordis profile (e.g. /profile safe, /profile full)",
			getArgumentCompletions: (prefix: string) => {
				const profiles = Object.keys(BUILTIN_PROFILES);
				const filtered = profiles.filter((p) => p.startsWith(prefix));
				return filtered.length > 0
					? filtered.map((p) => ({
							value: p,
							label: `${p} - ${BUILTIN_PROFILES[p].description}`,
						}))
					: null;
			},
			handler: async (args: string, ctx) => {
				const targetProfile = args.trim();
				const availableProfiles = Object.keys(BUILTIN_PROFILES);

				// 1. If explicit valid profile given, switch directly
				if (targetProfile && BUILTIN_PROFILES[targetProfile]) {
					if (cordisContext) {
						const loaded = applyProfile(cordisContext, targetProfile);
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
						(p) => `${p} - ${BUILTIN_PROFILES[p].description}`,
					);
					const selected = await ctx.ui.select("Select Cordis Profile", items);
					if (selected) {
						const chosenName = selected.split(" - ")[0];
						if (cordisContext && BUILTIN_PROFILES[chosenName]) {
							const loaded = applyProfile(cordisContext, chosenName);
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
