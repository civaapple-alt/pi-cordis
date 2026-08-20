import * as fs from "node:fs";
import * as path from "node:path";
import { parse as parseYaml } from "yaml";
import type { Context } from "@deepseek-ai/cordis";
import safetyGatePlugin from "@pi-cordis/plugin-safety-gate";
import gitGuardPlugin from "@pi-cordis/plugin-git-guard";
import todoTrackerPlugin from "@pi-cordis/plugin-todo-tracker";
import rulesInjectorPlugin from "@pi-cordis/plugin-rules-injector";
import subagentPlugin from "@pi-cordis/plugin-subagent";
import planModePlugin from "@pi-cordis/plugin-plan-mode";
import codeModePlugin from "@pi-cordis/plugin-code-mode";
import askQuestionPlugin from "@pi-cordis/plugin-ask-question";
import outputTruncatorPlugin from "@pi-cordis/plugin-output-truncator";
import contextCompactorPlugin from "@pi-cordis/plugin-context-compactor";
import toolsManagerPlugin from "@pi-cordis/plugin-tools-manager";
import sessionHandoffPlugin from "@pi-cordis/plugin-session-handoff";
import gitAutomationPlugin from "@pi-cordis/plugin-git-automation";
import sshDelegatorPlugin from "@pi-cordis/plugin-ssh-delegator";
import btwPlugin from "@pi-cordis/plugin-btw";
import terminalNotifierPlugin from "@pi-cordis/plugin-terminal-notifier";

export const builtinPlugins = {
	"safety-gate": safetyGatePlugin,
	"git-guard": gitGuardPlugin,
	"todo-tracker": todoTrackerPlugin,
	"rules-injector": rulesInjectorPlugin,
	subagent: subagentPlugin,
	"plan-mode": planModePlugin,
	"code-mode": codeModePlugin,
	"ask-question": askQuestionPlugin,
	"output-truncator": outputTruncatorPlugin,
	"context-compactor": contextCompactorPlugin,
	"tools-manager": toolsManagerPlugin,
	"session-handoff": sessionHandoffPlugin,
	"git-automation": gitAutomationPlugin,
	"ssh-delegator": sshDelegatorPlugin,
	btw: btwPlugin,
	"terminal-notifier": terminalNotifierPlugin,
} as const;

export type BuiltinPluginName = keyof typeof builtinPlugins;

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
		description: "标准日常开发模式 (Default is Best: 开箱即用全量安全防护、规则注入、待办追踪与防爆转存)",
		plugins: {
			"safety-gate": true,
			"git-guard": true,
			"rules-injector": true,
			"todo-tracker": true,
			"output-truncator": true,
			"ask-question": true,
			"context-compactor": true,
			subagent: true,
			"git-automation": true,
			"session-handoff": true,
			"ssh-delegator": true,
			"tools-manager": true,
			btw: true,
			"terminal-notifier": true,
		},
	},
	plan: {
		name: "plan",
		description: "规划与审计模式 (只读代码库探索 + 方案步骤拆解 + 强制写拦截保护)",
		plugins: {
			"plan-mode": true,
			"safety-gate": { readOnly: true },
			"rules-injector": true,
			"todo-tracker": true,
			"output-truncator": true,
			"ask-question": true,
			"context-compactor": true,
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
			"context-compactor": true,
		},
	},
};

function normalizePluginName(name: string): string {
	if (name.startsWith("@pi-cordis/plugin-")) {
		return name.replace("@pi-cordis/plugin-", "");
	}
	return name;
}

/**
 * Load and merge profile configurations from `presets/<name>/` directories and YAML files.
 */
export function loadProfilesFromYaml(
	cwd: string = process.cwd(),
	agentDir?: string,
): Record<string, ProfileDefinition> {
	const merged: Record<string, ProfileDefinition> = { ...BUILTIN_PROFILES };

	// 1. Scan directory-based presets: presets/<name>/, .pi/presets/<name>/, ~/.pi/presets/<name>/
	const presetRoots = [
		agentDir ? path.join(agentDir, "presets") : null,
		path.join(cwd, ".pi", "presets"),
		path.join(cwd, "presets"),
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

				let displayName = entry.name;
				let description = `Preset "${entry.name}" loaded from ${path.relative(cwd, presetDir)}`;

				if (fs.existsSync(presetYmlPath)) {
					try {
						const meta = parseYaml(fs.readFileSync(presetYmlPath, "utf-8"));
						if (meta && typeof meta === "object") {
							if (meta.name) displayName = String(meta.name);
							if (meta.description) description = String(meta.description);
						}
					} catch {
						// Ignore parse error
					}
				}

				const pluginsMap: Record<string, boolean | Record<string, unknown>> = {};

				if (cordisYmlPath && fs.existsSync(cordisYmlPath)) {
					try {
						const pluginList = parseYaml(fs.readFileSync(cordisYmlPath, "utf-8"));
						if (Array.isArray(pluginList)) {
							for (const item of pluginList) {
								if (!item) continue;
								if (typeof item === "string") {
									pluginsMap[normalizePluginName(item)] = true;
								} else if (typeof item === "object" && item.name) {
									if (item.disabled) continue;
									const key = normalizePluginName(item.name);
									pluginsMap[key] = item.config ?? true;
								}
							}
						} else if (pluginList && typeof pluginList === "object") {
							for (const [k, v] of Object.entries(pluginList)) {
								pluginsMap[normalizePluginName(k)] = (v as any) ?? true;
							}
						}
					} catch {
						// Ignore parse error
					}
				}

				merged[entry.name] = {
					name: displayName,
					description,
					plugins: pluginsMap,
				};
			}
		} catch {
			// Directory read error
		}
	}

	// 2. Scan single-file YAML profiles for backwards compatibility
	const candidateSingleFiles = [
		agentDir ? path.join(agentDir, "cordis.yml") : null,
		path.join(cwd, ".pi", "cordis.yml"),
		path.join(cwd, "cordis.yml"),
	].filter((p): p is string => Boolean(p));

	for (const filePath of candidateSingleFiles) {
		if (fs.existsSync(filePath)) {
			try {
				const content = fs.readFileSync(filePath, "utf-8");
				const parsed = parseYaml(content);
				if (parsed && typeof parsed === "object" && parsed.profiles) {
					for (const [key, val] of Object.entries(parsed.profiles)) {
						if (val && typeof val === "object") {
							const def = val as Partial<ProfileDefinition>;
							merged[key] = {
								name: def.name ?? key,
								description: def.description ?? `Custom profile "${key}"`,
								plugins: (def.plugins ?? (val as Record<string, unknown>)) as any,
							};
						}
					}
				}
			} catch {
				// Parse error
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
	// 1. Unload previously active profile plugins via ctx.registry.delete
	if ((ctx as any)._activeProfilePluginKeys) {
		const prevKeys = (ctx as any)._activeProfilePluginKeys as string[];
		for (const key of prevKeys) {
			const plugin = builtinPlugins[key as BuiltinPluginName];
			if (plugin) {
				ctx.registry.delete(plugin);
			}
		}
		(ctx as any)._activeProfilePluginKeys = [];
		// Allow Cordis fiber disposal to settle
		await new Promise((r) => setTimeout(r, 0));
	}

	const allProfiles = loadProfilesFromYaml(options.cwd, options.agentDir);
	const profile = allProfiles[profileName] ?? allProfiles.default ?? BUILTIN_PROFILES.default;

	const resolvedPlugins = {
		...profile.plugins,
		...customPluginConfigs,
	};

	const loadedPlugins: string[] = [];

	for (const [pluginKey, config] of Object.entries(resolvedPlugins)) {
		if (!config) continue;

		// 1. Match builtin plugins
		const plugin = builtinPlugins[pluginKey as BuiltinPluginName];
		if (plugin) {
			const pluginConfig = typeof config === "object" ? config : {};
			ctx.plugin(plugin, pluginConfig);
			loadedPlugins.push(pluginKey);
			continue;
		}

		// 2. Extensibility: Track external/custom plugin key
		loadedPlugins.push(pluginKey);
	}

	(ctx as any)._activeProfilePluginKeys = loadedPlugins;

	// 3. Synchronize active tools in upstream Pi runtime
	(ctx as any).extensions?.syncActiveTools?.();

	return loadedPlugins;
}

export * from "./hmr.js";

export const name = "profiles";
export const inject = ["extensions", "settings", "tools"];

export interface ProfilesPluginConfig {
	defaultProfile?: string;
}

export function apply(ctx: Context, config: ProfilesPluginConfig = {}) {
	ctx.extensions?.registerCommand?.("profile", {
		description: "View or switch active Cordis profile (e.g. /profile default, /profile plan, /profile ptc)",
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

			if (targetProfile && allProfiles[targetProfile]) {
				const loaded = await applyProfile(ctx, targetProfile, undefined, { cwd });
				if (cmdCtx.hasUI) {
					cmdCtx.ui.notify(
						`Switched to profile: "${targetProfile}"\nActive plugins: ${loaded.join(", ") || "none"}`,
						"info",
					);
				}
				return;
			}

			if (cmdCtx.hasUI) {
				const items = availableProfiles.map(
					(p) => `${p} - ${allProfiles[p]?.description ?? "Custom profile"}`,
				);
				const selected = await cmdCtx.ui.select("Select Cordis Profile", items);
				if (selected) {
					const chosenName = selected.split(" - ")[0];
					if (allProfiles[chosenName]) {
						const loaded = await applyProfile(ctx, chosenName, undefined, { cwd });
						cmdCtx.ui.notify(
							`Switched to profile: "${chosenName}"\nActive plugins: ${loaded.join(", ") || "none"}`,
							"info",
						);
					}
				}
			}
		},
	});

	// Listen for programmatic profile switch events (e.g. from plan-mode user approval)
	ctx.on("pi/profile-switch" as any, async (targetProfile: string) => {
		if (targetProfile) {
			const cwd = (ctx as any).settings?.getCwd?.() ?? process.cwd();
			await applyProfile(ctx, targetProfile, undefined, { cwd });
		}
	});
}

export default { name, inject, apply };

