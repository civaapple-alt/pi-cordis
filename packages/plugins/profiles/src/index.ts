import * as fs from "node:fs";
import * as path from "node:path";
import { parse as parseYaml } from "yaml";
import type { Context } from "@deepseek-ai/cordis";
import safetyGatePlugin from "@pi-cordis/plugin-safety-gate";
import gitGuardPlugin from "@pi-cordis/plugin-git-guard";
import todoTrackerPlugin from "@pi-cordis/plugin-todo-tracker";
import rulesInjectorPlugin from "@pi-cordis/plugin-rules-injector";

export const builtinPlugins = {
	"safety-gate": safetyGatePlugin,
	"git-guard": gitGuardPlugin,
	"todo-tracker": todoTrackerPlugin,
	"rules-injector": rulesInjectorPlugin,
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
		description: "标准日常开发模式 (规则自动注入 + 待办任务追踪)",
		plugins: {
			"rules-injector": true,
			"todo-tracker": true,
		},
	},
	safe: {
		name: "safe",
		description: "安全生产工程模式 (高危命令拦截 + 保护文件防篡改 + Git 自动检查点)",
		plugins: {
			"safety-gate": true,
			"git-guard": true,
			"rules-injector": true,
			"todo-tracker": true,
		},
	},
	strict: {
		name: "strict",
		description: "严格审计模式 (只读代码审查 + 阻断全部修改与高危操作)",
		plugins: {
			"safety-gate": { strict: true, readOnly: true },
			"git-guard": true,
			"rules-injector": true,
		},
	},
	full: {
		name: "full",
		description: "全能极客模式 (激活全部 4 大原生 Cordis 插件能力)",
		plugins: {
			"safety-gate": true,
			"git-guard": true,
			"todo-tracker": true,
			"rules-injector": true,
		},
	},
	minimal: {
		name: "minimal",
		description: "零额外插件纯净模式 (仅保留 10 大核心服务)",
		plugins: {},
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
								plugins: def.plugins ?? (val as Record<string, unknown>),
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
export function applyProfile(
	ctx: Context,
	profileName: string = "default",
	customPluginConfigs?: Partial<Record<BuiltinPluginName | string, boolean | Record<string, unknown>>>,
	options: { cwd?: string; agentDir?: string } = {},
): string[] {
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

	return loadedPlugins;
}

export * from "./hmr.ts";
