import type { Context } from "@deepseek-ai/cordis";

export interface SafetyGateConfig {
	protectedPaths?: string[];
	dangerousCommands?: string[];
	allowedCommands?: string[];
	readOnly?: boolean;
}

export const name = "safety-gate";
export const inject = [];

/**
 * Built-in high-risk destructive shell command patterns
 */
export const DEFAULT_DANGEROUS_PATTERNS: RegExp[] = [
	/\brm\s+-(?=[a-z]*r)(?=[a-z]*f)[a-z]*\s+(?:\/(?:\*)?|~|\$HOME|\.\.(?:\/[^\s;&|]*)?)(?=\s|[;&|]|$)/i,
	/\brm\s+--recursive\s+--force\s+(?:\/(?:\*)?|~|\$HOME|\.\.(?:\/[^\s;&|]*)?)(?=\s|[;&|]|$)/i,
	/\bmkfs(\.[a-z0-9]+)?\s+/i,
	/\bdd\s+.*(of=\/dev\/[a-z0-9]+)/i,
	/\bchmod\s+(-R\s+)?(777|a\+rwx)\s+(\/|~|\$HOME)/i,
	/>\s*\/dev\/(?:sd[a-z](?:[0-9]+)?|nvme[0-9]+n[0-9]+(?:p[0-9]+)?)(?=\s|[;&|]|$)/i,
	/:(){\s*:\|:&\s*};\s*:/,
	/\bcurl\s+.*\|\s*(sh|bash|zsh)\b/i,
	/\bcat\s+.*(\.env|\.ssh\/id_rsa|\.ssh\/id_ed25519)/i,
	/\bremove-item\b[^\r\n]*(?:-recurse\b[^\r\n]*-force|-force\b[^\r\n]*-recurse)[^\r\n]*(?:[a-z]:\\(?:\s|$)|\$home\b|\$env:userprofile\b)/i,
	/\b(?:del|erase|rd|rmdir)\s+\/(?:s[^\r\n]*\/q|q[^\r\n]*\/s)[^\r\n]*[a-z]:\\(?:\s|$)/i,
	/\bformat(?:\.com)?\s+[a-z]:/i,
	/\bclear-disk\b/i,
];

export function isCommandDangerous(
	command: string,
	customPatterns: string[] = [],
	allowedCommands: string[] = [],
): { dangerous: boolean; reason?: string } {
	if (!command || typeof command !== "string") return { dangerous: false };

	const trimmed = command.trim();

	// Check whitelist bypass first
	for (const allowed of allowedCommands) {
		if (trimmed === allowed.trim()) {
			return { dangerous: false };
		}
	}

	// Check regex patterns
	for (const pattern of DEFAULT_DANGEROUS_PATTERNS) {
		if (pattern.test(trimmed)) {
			return { dangerous: true, reason: `Matched security rule pattern: ${pattern.toString()}` };
		}
	}

	// Check string inclusions
	for (const custom of customPatterns) {
		if (trimmed.toLocaleLowerCase().includes(custom.toLocaleLowerCase())) {
			return { dangerous: true, reason: `Matched custom dangerous pattern: "${custom}"` };
		}
	}

	return { dangerous: false };
}

export function apply(ctx: Context, config: SafetyGateConfig = {}) {
	const protectedPaths = config.protectedPaths ?? [
		".env",
		".env.",
		".git/",
		"id_rsa",
		"id_ed25519",
		".pem",
		".key",
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

	const allowedCommands = config.allowedCommands ?? [];

	// Intercept tool calls before execution
	const removeHook = ctx.on("pi/tool-call" as any, async (event: { toolName?: string; name?: string; args: Record<string, unknown> }) => {
		if (!event) return;
		const toolName = event.toolName ?? event.name ?? "";

		// 1. Read-only mode enforcement for mutating tools
		if (config.readOnly && ["write", "edit", "patch", "apply_patch"].includes(toolName)) {
			throw new Error(
				`[safety-gate] Operation blocked: "${toolName}" is not permitted in read-only mode. To modify files, please switch to default mode by typing '/profile default'.`
			);
		}

		// 2. Protect sensitive files from write / edit / patch
		if (["write", "edit", "patch", "apply_patch"].includes(toolName)) {
			const targetPath = String(event.args?.path ?? event.args?.file ?? "");
			const normalizedTarget = targetPath.replaceAll("\\", "/").toLocaleLowerCase();
			const isProtected = protectedPaths.some((protectedPath) =>
				normalizedTarget.includes(protectedPath.replaceAll("\\", "/").toLocaleLowerCase()),
			);
			if (isProtected) {
				throw new Error(
					`[safety-gate] Operation blocked: "${targetPath}" is a protected file/directory. Modifications are forbidden.`,
				);
			}
		}

		// 3. Shell commands inspection
		if (toolName === "bash") {
			const cmd = String(event.args?.command ?? "");

			// In read-only mode, block file-writing shell commands
			if (config.readOnly) {
				const isFileWritingCmd = /(?:>|>>|\btee\b|\brm\s|\bmv\s|\bcp\s|\bmkdir\s|\btouch\s|\bsed\s+-i|\b(?:set|add)-content\b|\bout-file\b|\bremove-item\b|\bmove-item\b|\bcopy-item\b|\bnew-item\b|\b(?:del|erase|rd|rmdir|md)\s)/i.test(cmd);
				if (isFileWritingCmd) {
					throw new Error(
						`[safety-gate] Shell file modification blocked in read-only mode: "${cmd}". To modify files, please switch to default mode by typing '/profile default'.`
					);
				}
			}

			const check = isCommandDangerous(cmd, dangerousCommands, allowedCommands);
			if (check.dangerous) {
				throw new Error(
					`[safety-gate] Dangerous command blocked: "${cmd}". (${check.reason}). If required, add it to allowedCommands in cordis.yml.`,
				);
			}
		}
	});

	return () => {
		removeHook();
	};
}

export default { name, inject, apply };
