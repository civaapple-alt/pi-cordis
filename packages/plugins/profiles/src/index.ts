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

export interface ProfileDefinition {
	name: string;
	description: string;
	plugins: Partial<Record<BuiltinPluginName, boolean | Record<string, unknown>>>;
}

/**
 * Standard Built-in Profiles
 */
export const BUILTIN_PROFILES: Record<string, ProfileDefinition> = {
	default: {
		name: "default",
		description: "Standard coding agent with rule injection and todo task tracking",
		plugins: {
			"rules-injector": true,
			"todo-tracker": true,
		},
	},
	safe: {
		name: "safe",
		description: "Safe engineering mode with destructive action blocking and git checkpoints",
		plugins: {
			"safety-gate": true,
			"git-guard": true,
			"rules-injector": true,
			"todo-tracker": true,
		},
	},
	strict: {
		name: "strict",
		description: "Strict security mode with read-only inspection and dangerous command blocking",
		plugins: {
			"safety-gate": { strict: true, readOnly: true },
			"git-guard": true,
			"rules-injector": true,
		},
	},
	full: {
		name: "full",
		description: "Power user mode with all native Cordis plugins activated",
		plugins: {
			"safety-gate": true,
			"git-guard": true,
			"todo-tracker": true,
			"rules-injector": true,
		},
	},
	minimal: {
		name: "minimal",
		description: "Zero extra plugins for raw, lightweight execution",
		plugins: {},
	},
};

/**
 * Apply a profile or custom plugin configuration to a Cordis Context
 */
export function applyProfile(
	ctx: Context,
	profileName: string = "default",
	customPluginConfigs?: Partial<Record<BuiltinPluginName, boolean | Record<string, unknown>>>,
): string[] {
	const profile = BUILTIN_PROFILES[profileName] ?? BUILTIN_PROFILES.default;
	const resolvedPlugins = {
		...profile.plugins,
		...customPluginConfigs,
	};

	const loadedPlugins: string[] = [];

	for (const [pluginKey, config] of Object.entries(resolvedPlugins)) {
		if (!config) continue;
		const plugin = builtinPlugins[pluginKey as BuiltinPluginName];
		if (!plugin) continue;

		const pluginConfig = typeof config === "object" ? config : {};
		ctx.plugin(plugin, pluginConfig);
		loadedPlugins.push(pluginKey);
	}

	return loadedPlugins;
}
