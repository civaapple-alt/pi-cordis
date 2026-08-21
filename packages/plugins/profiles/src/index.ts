import * as fs from "node:fs";
import * as path from "node:path";
import { parse as parseYaml } from "yaml";
import type { Context } from "@deepseek-ai/cordis";
import safetyGatePlugin from "@pi-cordis/plugin-safety-gate";
import gitGuardPlugin from "@pi-cordis/plugin-git-guard";
import todoTrackerPlugin from "@pi-cordis/plugin-todo-tracker";
import rulesInjectorPlugin from "@pi-cordis/plugin-rules-injector";
import codeModePlugin from "@pi-cordis/plugin-code-mode";
import askQuestionPlugin from "@pi-cordis/plugin-ask-question";
import outputTruncatorPlugin from "@pi-cordis/plugin-output-truncator";
import toolsManagerPlugin from "@pi-cordis/plugin-tools-manager";
import sessionHandoffPlugin from "@pi-cordis/plugin-session-handoff";
import gitAutomationPlugin from "@pi-cordis/plugin-git-automation";
import btwPlugin from "@pi-cordis/plugin-btw";
import terminalNotifierPlugin from "@pi-cordis/plugin-terminal-notifier";

export const builtinPlugins = {
	"safety-gate": safetyGatePlugin,
	"git-guard": gitGuardPlugin,
	"todo-tracker": todoTrackerPlugin,
	"rules-injector": rulesInjectorPlugin,
	"code-mode": codeModePlugin,
	"ask-question": askQuestionPlugin,
	"output-truncator": outputTruncatorPlugin,
	"tools-manager": toolsManagerPlugin,
	"session-handoff": sessionHandoffPlugin,
	"git-automation": gitAutomationPlugin,
	btw: btwPlugin,
	"terminal-notifier": terminalNotifierPlugin,
} as const;

export type BuiltinPluginName = keyof typeof builtinPlugins;

interface ActiveProfileMount {
	name: BuiltinPluginName;
	dispose: () => void | Promise<void>;
}

const activeProfileMounts = new WeakMap<Context, ActiveProfileMount[]>();
const activeProfileNames = new WeakMap<Context, string>();

export interface ActiveProfileSnapshot {
	name?: string;
	plugins: string[];
}

/** Return the active Profile identity and mounted built-in plugins for a root Context. */
export function getActiveProfile(ctx: Context): ActiveProfileSnapshot {
	const root = ctx.root;
	return {
		name: activeProfileNames.get(root),
		plugins: (activeProfileMounts.get(root) ?? []).map((mount) => mount.name),
	};
}

export interface PluginEntryConfig {
	name: string;
	config?: Record<string, unknown>;
	disabled?: boolean;
}

export interface ProfileDefinition {
	name: string;
	description: string;
	plugins: Partial<Record<BuiltinPluginName | string, boolean | Record<string, unknown>>>;
}

/**
 * Standard Built-in Fallback Profiles
 */
export const BUILTIN_PROFILES: Record<string, ProfileDefinition> = {
	default: {
		name: "default",
		description: "标准日常开发模式 (Default is Best: 仅启用可验证的安全、规则、任务与交互增强)",
		plugins: {
			"safety-gate": true,
			"git-guard": true,
			"rules-injector": true,
			"todo-tracker": true,
			"output-truncator": true,
			"ask-question": true,
			btw: true,
			"terminal-notifier": true,
		},
	},
	ptc: {
		name: "ptc",
		description: "编程化工具调用模式 (PTC / Code Mode: 动态 TypeScript SDK + run_code 批量执行)",
		plugins: {
			"code-mode": true,
			"safety-gate": true,
			"git-guard": true,
			"rules-injector": true,
			"todo-tracker": true,
			"output-truncator": true,
			"ask-question": true,
		},
	},
};

function normalizePluginName(name: string): string {
	if (name.startsWith("@pi-cordis/plugin-")) {
		return name.replace("@pi-cordis/plugin-", "");
	}
	return name;
}

function readProfileYaml(filePath: string): unknown {
	try {
		return parseYaml(fs.readFileSync(filePath, "utf8"));
	} catch (error) {
		throw new Error(
			`Failed to parse profile YAML "${filePath}": ${error instanceof Error ? error.message : String(error)}`,
			{ cause: error },
		);
	}
}

/**
 * Load and merge profile configurations from `presets/<name>/` directories and YAML files.
 */
export function loadProfilesFromYaml(
	cwd: string = process.cwd(),
	agentDir?: string,
): Record<string, ProfileDefinition> {
	const merged: Record<string, ProfileDefinition> = { ...BUILTIN_PROFILES };

	// 1. Scan directory-based presets. The Pi-Cordis project namespace takes
	// precedence, while .pi remains a compatibility fallback.
	const picdsPresetRoot = path.join(cwd, ".picds", "presets");
	const legacyPresetRoot = path.join(cwd, ".pi", "presets");
	const projectPresetRoot = fs.existsSync(picdsPresetRoot) ? picdsPresetRoot : legacyPresetRoot;
	const presetRoots = [
		path.join(cwd, "presets"),
		agentDir ? path.join(agentDir, "presets") : null,
		projectPresetRoot,
	].filter((p): p is string => Boolean(p));

	for (const root of presetRoots) {
		if (!fs.existsSync(root)) continue;
		try {
			const entries = fs.readdirSync(root, { withFileTypes: true });
			for (const entry of entries) {
				if (!entry.isDirectory()) continue;
				const presetDir = path.join(root, entry.name);
				const presetYmlPath = path.join(presetDir, "preset.yml");
				const cordisYmlPath = fs.existsSync(path.join(presetDir, "cordis.yml"))
					? path.join(presetDir, "cordis.yml")
					: fs.existsSync(path.join(presetDir, "agent.cordis.yml"))
						? path.join(presetDir, "agent.cordis.yml")
						: null;
				if (!fs.existsSync(presetYmlPath) && !cordisYmlPath) continue;

				let displayName = entry.name;
				let description = `Preset "${entry.name}" loaded from ${path.relative(cwd, presetDir)}`;

				if (fs.existsSync(presetYmlPath)) {
					const meta = readProfileYaml(presetYmlPath) as Record<string, unknown> | undefined;
					if (meta && typeof meta === "object" && !Array.isArray(meta)) {
						if (meta.name) displayName = String(meta.name);
						if (meta.description) description = String(meta.description);
					}
				}

				const pluginsMap: Record<string, boolean | Record<string, unknown>> = {};

				if (cordisYmlPath && fs.existsSync(cordisYmlPath)) {
					const pluginList = readProfileYaml(cordisYmlPath);
					if (Array.isArray(pluginList)) {
						for (const item of pluginList) {
							if (!item) continue;
							if (typeof item === "string") {
								pluginsMap[normalizePluginName(item)] = true;
							} else if (
								typeof item === "object" &&
								item !== null &&
								"name" in item &&
								typeof item.name === "string"
							) {
								if ("disabled" in item && item.disabled) continue;
								const key = normalizePluginName(item.name);
								pluginsMap[key] = "config" in item && item.config !== undefined
									? item.config as Record<string, unknown>
									: true;
							} else {
								throw new Error(`Invalid plugin entry in profile YAML "${cordisYmlPath}".`);
							}
						}
					} else if (pluginList && typeof pluginList === "object") {
						for (const [k, v] of Object.entries(pluginList)) {
							pluginsMap[normalizePluginName(k)] = (v as boolean | Record<string, unknown> | null) ?? true;
						}
					} else if (pluginList !== undefined && pluginList !== null) {
						throw new Error(`Invalid plugin list in profile YAML "${cordisYmlPath}".`);
					}
				}

				merged[entry.name] = {
					name: displayName,
					description,
					plugins: pluginsMap,
				};
			}
		} catch (error) {
			if (error instanceof Error && error.message.startsWith("Failed to parse profile YAML")) {
				throw error;
			}
			throw new Error(
				`Failed to load profile directory "${root}": ${error instanceof Error ? error.message : String(error)}`,
				{ cause: error },
			);
		}
	}

	// 2. Scan single-file YAML profiles for backwards compatibility
	const picdsConfigPath = path.join(cwd, ".picds", "cordis.yml");
	const legacyConfigPath = path.join(cwd, ".pi", "cordis.yml");
	const projectConfigPath = fs.existsSync(picdsConfigPath) ? picdsConfigPath : legacyConfigPath;
	const candidateSingleFiles = [
		path.join(cwd, "cordis.yml"),
		agentDir ? path.join(agentDir, "cordis.yml") : null,
		projectConfigPath,
	].filter((p): p is string => Boolean(p));

	for (const filePath of candidateSingleFiles) {
		if (fs.existsSync(filePath)) {
			const parsed = readProfileYaml(filePath) as { profiles?: Record<string, unknown> } | undefined;
			if (parsed && typeof parsed === "object" && parsed.profiles) {
				for (const [key, val] of Object.entries(parsed.profiles)) {
					if (val && typeof val === "object" && !Array.isArray(val)) {
						const def = val as Partial<ProfileDefinition>;
						merged[key] = {
							name: def.name ?? key,
							description: def.description ?? `Custom profile "${key}"`,
							plugins: (def.plugins ?? (val as Record<string, unknown>)) as ProfileDefinition["plugins"],
						};
					}
				}
			}
		}
	}

	return merged;
}

/**
 * Apply a profile or custom plugin configuration to a Cordis Context
 */
export async function applyProfile(
	ctx: Context,
	profileName: string = "default",
	customPluginConfigs?: Partial<Record<BuiltinPluginName | string, boolean | Record<string, unknown>>>,
	options: { cwd?: string; agentDir?: string } = {},
): Promise<string[]> {
	const profileScope = ctx.root;
	const allProfiles = loadProfilesFromYaml(options.cwd, options.agentDir);
	const profile = allProfiles[profileName];
	if (!profile) {
		if (profileName === "plan") {
			throw new Error('Profile "plan" was removed because Plan is session state. Use "picds --plan" or /plan instead.');
		}
		throw new Error(
			`Unknown profile "${profileName}". Available profiles: ${Object.keys(allProfiles).sort().join(", ")}.`,
		);
	}

	const resolvedPlugins = {
		...profile.plugins,
		...customPluginConfigs,
	};
	const requestedPlugins = Object.entries(resolvedPlugins).filter((entry) => Boolean(entry[1]));
	const unknownPlugins = requestedPlugins
		.map(([pluginKey]) => pluginKey)
		.filter((pluginKey) => !builtinPlugins[pluginKey as BuiltinPluginName]);
	if (unknownPlugins.length > 0) {
		throw new Error(
			`Profile "${profileName}" references unsupported Cordis plugins: ${unknownPlugins.join(", ")}. ` +
			"Install Pi extensions through Pi's package manager; Profile YAML currently composes built-in Pi-Cordis plugins only.",
		);
	}

	const previousMounts = activeProfileMounts.get(profileScope) ?? [];
	const previousProfileName = activeProfileNames.get(profileScope);
	const loadedPlugins: string[] = [];
	const mountedPlugins: ActiveProfileMount[] = [];

	try {
		// Mount the replacement before touching the current profile. Registries use
		// reversible stacks, so a failed mount can be removed without losing the old
		// tool or command implementation.
		for (const [pluginKey, config] of requestedPlugins) {
			const plugin = builtinPlugins[pluginKey as BuiltinPluginName];
			const pluginConfig = typeof config === "object" ? config : {};
			const fork = ctx.plugin(plugin, pluginConfig);
			mountedPlugins.push({ name: pluginKey as BuiltinPluginName, dispose: () => fork.dispose() });
			loadedPlugins.push(pluginKey);
		}
	} catch (error) {
		await Promise.allSettled(mountedPlugins.map((mount) => Promise.resolve(mount.dispose())));
		throw error;
	}

	// Dispose only the exact Fibers owned by the previous profile after the new
	// profile is mounted successfully.
	const disposalResults = await Promise.allSettled(
		previousMounts.map((mount) => Promise.resolve(mount.dispose())),
	);
	activeProfileMounts.set(profileScope, mountedPlugins);
	activeProfileNames.set(profileScope, profileName);

	// 3. Synchronize active tools in upstream Pi runtime
	(ctx as any).extensions?.syncActiveTools?.();
	ctx.emit("pi/profile-changed", {
		previousProfile: previousProfileName,
		profileName,
		plugins: loadedPlugins,
	});

	const disposalFailures = disposalResults.flatMap((result, index) => (
		result.status === "rejected"
			? [{ plugin: previousMounts[index]?.name ?? `plugin-${index + 1}`, reason: result.reason }]
			: []
	));
	if (disposalFailures.length > 0) {
		throw new AggregateError(
			disposalFailures.map((failure) => failure.reason),
			`Profile "${profileName}" was mounted, but failed to dispose previous plugins: ${disposalFailures.map((failure) => failure.plugin).join(", ")}. Restart Picds before relying on the active capability surface.`,
		);
	}

	return loadedPlugins;
}

export * from "./hmr.js";

export const name = "profiles";
export const inject = ["extensions", "settings", "tools"];

export interface ProfilesPluginConfig {
	defaultProfile?: string;
}

export function apply(ctx: Context, config: ProfilesPluginConfig = {}) {
	const unregisterCommand = ctx.extensions.registerCommand("profile", {
		description: "View or switch the active Cordis capability profile (default or ptc)",
		getArgumentCompletions: (prefix: string) => {
			const cwd = (ctx as any).settings?.getCwd?.() ?? process.cwd();
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
		handler: async (args: string, cmdCtx: any) => {
			const cwd = cmdCtx.cwd ?? (ctx as any).settings?.getCwd?.() ?? process.cwd();
			const allProfiles = loadProfilesFromYaml(cwd);
			const targetProfile = args.trim();
			const availableProfiles = Object.keys(allProfiles);

			if (targetProfile) {
				const before = getActiveProfile(ctx);
				const loaded = await applyProfile(ctx, targetProfile, undefined, { cwd });
				if (cmdCtx.hasUI) {
					const added = loaded.filter((plugin) => !before.plugins.includes(plugin));
					const removed = before.plugins.filter((plugin) => !loaded.includes(plugin));
					cmdCtx.ui.notify(
						`Switched to profile: "${targetProfile}"\nPrevious profile: "${before.name ?? "none"}"\n` +
						`Added: ${added.join(", ") || "none"}\nRemoved: ${removed.join(", ") || "none"}\n` +
						`Active plugins: ${loaded.join(", ") || "none"}`,
						"info",
					);
				}
				return;
			}

			if (cmdCtx.hasUI) {
				const current = getActiveProfile(ctx);
				const profileByLabel = new Map<string, string>();
				const items = availableProfiles.map((profileName) => {
					const marker = profileName === current.name ? "●" : " ";
					const label = `${marker} ${profileName} - ${allProfiles[profileName]?.description ?? "Custom profile"}`;
					profileByLabel.set(label, profileName);
					return label;
				});
				const selected = await cmdCtx.ui.select(
					`Current Profile: ${current.name ?? "none"}. Select a capability Profile`,
					items,
				);
				if (selected) {
					const chosenName = profileByLabel.get(selected);
					if (chosenName && allProfiles[chosenName]) {
						const before = getActiveProfile(ctx);
						const loaded = await applyProfile(ctx, chosenName, undefined, { cwd });
						const added = loaded.filter((plugin) => !before.plugins.includes(plugin));
						const removed = before.plugins.filter((plugin) => !loaded.includes(plugin));
						cmdCtx.ui.notify(
							`Switched to profile: "${chosenName}"\nPrevious profile: "${before.name ?? "none"}"\n` +
							`Added: ${added.join(", ") || "none"}\nRemoved: ${removed.join(", ") || "none"}\n` +
							`Active plugins: ${loaded.join(", ") || "none"}`,
							"info",
						);
					}
				}
			}
		},
	});

	return () => {
		unregisterCommand();
	};
}

export default { name, inject, apply };
