import type { Context } from "@deepseek-ai/cordis";

export interface SafetyGateConfig {
	protectedPaths?: string[];
	dangerousCommands?: string[];
	readOnly?: boolean;
	strict?: boolean;
}

export const name = "safety-gate";

export function apply(ctx: Context, config: SafetyGateConfig = {}) {
	const protectedPaths = config.protectedPaths ?? [
		".env",
		".git/",
		"id_rsa",
		"id_ed25519",
		"node_modules/",
		".ssh/",
	];

	const dangerousCommands = config.dangerousCommands ?? [
		"rm -rf /",
		"rm -rf /*",
		"mkfs",
		"dd if=",
		":(){ :|:& };:",
		"chmod -R 777 /",
	];

	// Intercept tool calls before execution
	ctx.on("pi/tool-call", async (event: { name: string; args: Record<string, unknown> }) => {
		// 1. Read-only mode enforcement (e.g. Plan mode)
		if (config.readOnly && (event.name === "write" || event.name === "edit")) {
			throw new Error(`[safety-gate] Modifications are blocked in read-only mode.`);
		}

		// 2. Protect sensitive files from write/edit
		if (event.name === "write" || event.name === "edit") {
			const targetPath = String(event.args.path ?? "");
			const isProtected = protectedPaths.some((p) => targetPath.includes(p));
			if (isProtected) {
				throw new Error(
					`[safety-gate] Operation blocked: "${targetPath}" is protected against accidental modifications.`,
				);
			}
		}

		// 3. Block destructive shell commands
		if (event.name === "bash") {
			const cmd = String(event.args.command ?? "");
			const isDangerous = dangerousCommands.some((d) => cmd.includes(d));
			if (isDangerous) {
				throw new Error(
					`[safety-gate] Dangerous command blocked: "${cmd}" matched high-risk security patterns.`,
				);
			}
		}
	});
}

export default { name, apply };
