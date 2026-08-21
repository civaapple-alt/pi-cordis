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
	stop: () => Promise<void>;
	reloadCurrentProfile: () => Promise<void>;
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
	const debounceTimers = new Set<NodeJS.Timeout>();
	let reloadPromise: Promise<void> | undefined;

	// Helper to reload current active profile
	const reloadCurrentProfile = async (): Promise<void> => {
		if (reloadPromise) return reloadPromise;
		reloadPromise = (async () => {
			const allProfiles = loadProfilesFromYaml(cwd, options.agentDir);
			const profile = allProfiles[currentProfileName];
			if (!profile) throw new Error(`Cannot reload unknown profile "${currentProfileName}".`);

			await Promise.allSettled(
				Array.from(activeForks.values(), (fork) => Promise.resolve(fork.dispose())),
			);
			activeForks.clear();

			await applyProfile(ctx, currentProfileName, undefined, {
				cwd,
				agentDir: options.agentDir,
			});

			ctx.emit("pi/hmr-preset-update", {
				profileName: currentProfileName,
				profile,
			});
			options.onReload?.("preset", currentProfileName);
		})().finally(() => {
			reloadPromise = undefined;
		});
		return reloadPromise;
	};

	// Helper to hot reload a specific plugin's source code
	const hotReloadPluginCode = async (pluginName: string, filePath: string): Promise<boolean> => {
		try {
			// Cache bust via timestamp
			const fileUrl = pathToFileURL(filePath).href + `?t=${Date.now()}`;
			const newModule = await import(fileUrl);
			const plugin = newModule.default ?? newModule;

			// Get active config for this plugin
			const allProfiles = loadProfilesFromYaml(cwd, options.agentDir);
			const currentProfile = allProfiles[currentProfileName];
			if (!currentProfile) throw new Error(`Cannot reload plugin for unknown profile "${currentProfileName}".`);
			const config = currentProfile.plugins[pluginName as BuiltinPluginName];
			if (!config) return false;
			const pluginConfig = typeof config === "object" ? config : {};

			// Mount first; reversible registration stacks keep the old implementation
			// live if the replacement cannot be created.
			const oldFork = activeForks.get(pluginName);
			const newFork = ctx.plugin(plugin, pluginConfig);
			if (newFork) {
				activeForks.set(pluginName, newFork);
			}
			if (oldFork) await oldFork.dispose();

			ctx.emit("pi/hmr-plugin-update", {
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

	// 1. Watch built-in presets plus `.picds/presets/` (`.pi/` compatibility fallback).
	if (options.watchPresets !== false) {
		const picdsPresetDir = path.join(cwd, ".picds", "presets");
		const legacyPresetDir = path.join(cwd, ".pi", "presets");
		const presetDirs = [
			path.join(cwd, "presets"),
			options.agentDir ? path.join(options.agentDir, "presets") : null,
			fs.existsSync(picdsPresetDir) ? picdsPresetDir : legacyPresetDir,
		].filter((p): p is string => Boolean(p && fs.existsSync(p)));

		for (const pDir of presetDirs) {
			let debounceTimer: NodeJS.Timeout | undefined;
			try {
				const watcher = fs.watch(pDir, { recursive: true }, (eventType, filename) => {
					if (!filename || (!filename.endsWith(".yml") && !filename.endsWith(".yaml"))) return;
					if (debounceTimer) {
						clearTimeout(debounceTimer);
						debounceTimers.delete(debounceTimer);
					}
					debounceTimer = setTimeout(() => {
						if (debounceTimer) debounceTimers.delete(debounceTimer);
						void reloadCurrentProfile().catch((error) => {
							console.error("[HMR] Failed to reload profile:", error);
						});
					}, debounceMs);
					debounceTimers.add(debounceTimer);
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
					if (debounceTimer) {
						clearTimeout(debounceTimer);
						debounceTimers.delete(debounceTimer);
					}
					debounceTimer = setTimeout(() => {
						if (debounceTimer) debounceTimers.delete(debounceTimer);
						// Extract plugin name from path (e.g. safety-gate/src/index.ts -> safety-gate)
						const parts = filename.split(path.sep);
						const pluginDirName = parts[0];
						if (pluginDirName && pluginDirName !== "profiles") {
							const entryFile = path.join(pluginsDir, pluginDirName, "src", "index.ts");
							if (fs.existsSync(entryFile)) {
								void hotReloadPluginCode(pluginDirName, entryFile);
							}
						}
					}, debounceMs);
					debounceTimers.add(debounceTimer);
				});
				watchers.push(watcher);
			} catch {}
		}
	}

	const manager: HmrManager = {
		get currentProfileName() {
			return currentProfileName;
		},
		set currentProfileName(val: string) {
			currentProfileName = val;
		},
		activeForks,
		reloadCurrentProfile,
		hotReloadPluginCode,
		stop: async () => {
			for (const timer of debounceTimers) clearTimeout(timer);
			debounceTimers.clear();
			for (const w of watchers) {
				try {
					w.close();
				} catch {}
			}
			watchers.length = 0;
			if (reloadPromise) await reloadPromise;
			await Promise.allSettled(
				Array.from(activeForks.values(), (fork) => Promise.resolve(fork.dispose())),
			);
			activeForks.clear();
		},
	};

	ctx.effect(() => () => manager.stop());
	return manager;
}
