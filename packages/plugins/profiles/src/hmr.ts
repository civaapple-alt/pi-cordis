import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import type { Context } from "@deepseek-ai/cordis";
import {
	applyProfile,
	loadProfilesFromYaml,
	type BuiltinPluginName,
	type ProfileDefinition,
} from "./index.js";

export interface HmrOptions {
	cwd?: string;
	agentDir?: string;
	watchPlugins?: boolean;
	watchPresets?: boolean;
	pluginsDir?: string;
	debounceMs?: number;
	onReload?: (type: "preset" | "plugin", name: string) => void;
}

export interface HmrManager {
	currentProfileName: string;
	activeForks: Map<string, any>;
	stop: () => void;
	reloadCurrentProfile: () => void;
	hotReloadPluginCode: (pluginName: string, filePath: string) => Promise<boolean>;
}

/**
 * Watcher and HMR Manager for Presets (YAML) and Native Plugins (TS/JS Code)
 */
export function setupPluginHmr(
	ctx: Context,
	initialProfile: string = "default",
	options: HmrOptions = {},
): HmrManager {
	const cwd = options.cwd ?? process.cwd();
	const debounceMs = options.debounceMs ?? 150;
	const activeForks = new Map<string, any>();
	let currentProfileName = initialProfile;
	const watchers: fs.FSWatcher[] = [];

	// Helper to reload current active profile
	const reloadCurrentProfile = () => {
		const allProfiles = loadProfilesFromYaml(cwd, options.agentDir);
		const profile = allProfiles[currentProfileName] ?? allProfiles.default;

		// 1. Dispose all current active forks
		for (const [name, fork] of activeForks.entries()) {
			try {
				fork.dispose();
			} catch {}
		}
		activeForks.clear();

		// 2. Re-apply plugins with new config
		for (const [pluginKey, config] of Object.entries(profile.plugins)) {
			if (!config) continue;
			// Pass to cordis context
			try {
				const loaded = applyProfile(ctx, currentProfileName, undefined, {
					cwd,
					agentDir: options.agentDir,
				});
			} catch {}
		}

		ctx.emit("pi/hmr-preset-update" as any, {
			profileName: currentProfileName,
			profile,
		});

		options.onReload?.("preset", currentProfileName);
	};

	// Helper to hot reload a specific plugin's source code
	const hotReloadPluginCode = async (pluginName: string, filePath: string): Promise<boolean> => {
		try {
			// Cache bust via timestamp
			const fileUrl = pathToFileURL(filePath).href + `?t=${Date.now()}`;
			const newModule = await import(fileUrl);
			const plugin = newModule.default ?? newModule;

			// Dispose existing fork if present
			const oldFork = activeForks.get(pluginName);
			if (oldFork) {
				try {
					oldFork.dispose();
				} catch {}
				activeForks.delete(pluginName);
			}

			// Get active config for this plugin
			const allProfiles = loadProfilesFromYaml(cwd, options.agentDir);
			const currentProfile = allProfiles[currentProfileName] ?? allProfiles.default;
			const config = currentProfile.plugins[pluginName as BuiltinPluginName];
			const pluginConfig = typeof config === "object" ? config : {};

			// Re-mount on Cordis context
			const newFork = ctx.plugin(plugin, pluginConfig);
			if (newFork) {
				activeForks.set(pluginName, newFork);
			}

			ctx.emit("pi/hmr-plugin-update" as any, {
				pluginName,
				filePath,
			});

			options.onReload?.("plugin", pluginName);
			return true;
		} catch (err) {
			console.error(`[HMR] Failed to hot-reload plugin "${pluginName}":`, err);
			return false;
		}
	};

	// 1. Watch Presets Directory (`presets/` and `.pi/presets/`)
	if (options.watchPresets !== false) {
		const presetDirs = [
			path.join(cwd, "presets"),
			path.join(cwd, ".pi", "presets"),
		].filter((p) => fs.existsSync(p));

		for (const pDir of presetDirs) {
			let debounceTimer: NodeJS.Timeout | undefined;
			try {
				const watcher = fs.watch(pDir, { recursive: true }, (eventType, filename) => {
					if (!filename || (!filename.endsWith(".yml") && !filename.endsWith(".yaml"))) return;
					clearTimeout(debounceTimer);
					debounceTimer = setTimeout(() => {
						reloadCurrentProfile();
					}, debounceMs);
				});
				watchers.push(watcher);
			} catch {}
		}
	}

	// 2. Watch Plugins Directory (`packages/plugins/`)
	if (options.watchPlugins !== false) {
		const pluginsDir = options.pluginsDir ?? path.join(cwd, "packages", "plugins");
		if (fs.existsSync(pluginsDir)) {
			let debounceTimer: NodeJS.Timeout | undefined;
			try {
				const watcher = fs.watch(pluginsDir, { recursive: true }, (eventType, filename) => {
					if (!filename || (!filename.endsWith(".ts") && !filename.endsWith(".js"))) return;
					clearTimeout(debounceTimer);
					debounceTimer = setTimeout(() => {
						// Extract plugin name from path (e.g. safety-gate/src/index.ts -> safety-gate)
						const parts = filename.split(path.sep);
						const pluginDirName = parts[0];
						if (pluginDirName && pluginDirName !== "profiles") {
							const entryFile = path.join(pluginsDir, pluginDirName, "src", "index.ts");
							if (fs.existsSync(entryFile)) {
								hotReloadPluginCode(pluginDirName, entryFile);
							}
						}
					}, debounceMs);
				});
				watchers.push(watcher);
			} catch {}
		}
	}

	return {
		get currentProfileName() {
			return currentProfileName;
		},
		set currentProfileName(val: string) {
			currentProfileName = val;
		},
		activeForks,
		reloadCurrentProfile,
		hotReloadPluginCode,
		stop: () => {
			for (const w of watchers) {
				try {
					w.close();
				} catch {}
			}
			watchers.length = 0;
		},
	};
}
