import type { Context } from "@deepseek-ai/cordis";
import terminalNotifierPlugin, { TerminalNotifierPlugin as NotifierPluginClass } from "@pi-cordis/plugin-terminal-notifier";

export interface ExtensionAPI {
	registerCommand(name: string, definition: any): void;
	[key: string]: any;
}

export const TerminalNotifierPlugin = NotifierPluginClass ?? terminalNotifierPlugin;

/**
 * Backward compatibility helper for /profile command extension.
 * Prefer cordisCtx.extensions.createBridgeExtensionFactory() in CLI boot.
 */
export function createProfileCommandExtension(cordisContext?: Context) {
	return function profileCommandExtension(pi: any) {
		const cmd = cordisContext?.extensions?.getRegisteredCommands?.().get("profile");
		if (cmd) {
			pi.registerCommand("profile", cmd);
		}
	};
}

/**
 * Backward compatibility helper for /btw command extension.
 * Prefer cordisCtx.extensions.createBridgeExtensionFactory() in CLI boot.
 */
export function createBtwCommandExtension(cordisContext?: Context) {
	return function btwCommandExtension(pi: any) {
		const cmd = cordisContext?.extensions?.getRegisteredCommands?.().get("btw");
		if (cmd) {
			pi.registerCommand("btw", cmd);
		}
	};
}

/**
 * Backward compatibility helper for setupTerminalNotifier.
 * TerminalNotifierPlugin is now automatically mounted in standard profiles.
 */
export function setupTerminalNotifier(cordisContext: Context) {
	const fork = cordisContext.plugin(TerminalNotifierPlugin);
	return () => {
		fork?.dispose?.();
	};
}
