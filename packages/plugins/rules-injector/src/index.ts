import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import type { Context } from "@deepseek-ai/cordis";

export interface RulesInjectorConfig {
	ruleFiles?: string[];
	includePiContextFiles?: boolean;
	scanClaudeRules?: boolean;
	scanAgentRules?: boolean;
	maxTotalBytes?: number;
}

export const name = "rules-injector";
export const inject = ["settings", "extensions"];

function findMarkdownFiles(dir: string): string[] {
	const results: string[] = [];
	if (!fs.existsSync(dir)) return results;
	const entries = fs.readdirSync(dir, { withFileTypes: true })
		.sort((left, right) => left.name.localeCompare(right.name));
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...findMarkdownFiles(fullPath));
		} else if (entry.isFile() && entry.name.endsWith(".md")) {
			results.push(fullPath);
		}
	}
	return results;
}

export function apply(ctx: Context, config: RulesInjectorConfig = {}) {
	const targetRuleFiles = config.ruleFiles ?? [
		...(config.includePiContextFiles ? ["AGENTS.override.md", "AGENTS.md", "CLAUDE.md"] : []),
		".clauderules",
		".cursorrules",
	];
	const maxTotalBytes = config.maxTotalBytes ?? 128 * 1024;

	let cachedHash = "";
	let cachedBlock = "";
	let lastSnapshot: { cwd: string; files: string[]; totalBytes: number; hash: string; block: string } | undefined;

	const unregisterCommand = ctx.extensions.registerCommand("rules", {
		description: "Inspect the supplemental rule files currently injected by Pi-Cordis",
		handler: async (args: string, commandContext: any) => {
			if (args.trim()) {
				commandContext.ui?.notify?.("Usage: /rules", "warning");
				return;
			}
			const snapshotText = lastSnapshot
				? `Supplemental rules for ${lastSnapshot.cwd}\nFiles: ${lastSnapshot.files.join(", ") || "none"}\nBytes: ${lastSnapshot.totalBytes}\nSHA-256: ${lastSnapshot.hash || "none"}${lastSnapshot.block}`
				: "Supplemental rules have not been evaluated for an agent turn yet.";
			if (typeof commandContext.ui?.editor === "function") {
				await commandContext.ui.editor(
					"Pi-Cordis supplemental rules. This is a read-only review copy; edits are discarded.",
					snapshotText,
				);
			} else {
				commandContext.ui?.notify?.(snapshotText, "info");
			}
		},
	});

	const removeHook = ctx.on("pi/prompt-transform" as any, async (event: { prompt: string }) => {
		const cwd = (ctx as any).settings?.getCwd?.() ?? process.cwd();
		const rulesFound: Array<{ file: string; content: string }> = [];

		// 1. Scan root rule files
		for (const file of targetRuleFiles) {
			const filePath = path.join(cwd, file);
			if (fs.existsSync(filePath)) {
				const content = fs.readFileSync(filePath, "utf-8").trim();
				if (content.length > 0) {
					rulesFound.push({ file, content });
				}
			}
		}

		// 2. Scan .claude/rules/ and .agents/rules/
		const ruleDirs = [];
		if (config.scanClaudeRules ?? true) ruleDirs.push(path.join(cwd, ".claude", "rules"));
		if (config.scanAgentRules ?? true) ruleDirs.push(path.join(cwd, ".agents", "rules"));

		for (const rDir of ruleDirs) {
			const mFiles = findMarkdownFiles(rDir);
			for (const cf of mFiles) {
				const content = fs.readFileSync(cf, "utf-8").trim();
				const relPath = path.relative(cwd, cf).replace(/\\/g, "/");
				rulesFound.push({ file: relPath, content });
			}
		}

		if (rulesFound.length === 0) {
			lastSnapshot = { cwd, files: [], totalBytes: 0, hash: "", block: "" };
			return;
		}
		const totalBytes = rulesFound.reduce(
			(total, rule) => total + Buffer.byteLength(rule.content, "utf8"),
			0,
		);
		if (totalBytes > maxTotalBytes) {
			throw new Error(
				`[rules-injector] Refusing to inject ${totalBytes} bytes of supplemental rules (limit: ${maxTotalBytes}).`,
			);
		}

		// 3. Compute combined SHA-256 hash for KV-cache friendly caching
		const combinedRaw = rulesFound.map((r) => `${r.file}:${r.content}`).join("\n---\n");
		const currentHash = crypto.createHash("sha256").update(combinedRaw).digest("hex");

		if (currentHash === cachedHash && cachedBlock) {
			lastSnapshot = {
				cwd,
				files: rulesFound.map((rule) => rule.file),
				totalBytes,
				hash: currentHash,
				block: cachedBlock,
			};
			event.prompt += cachedBlock;
			return;
		}

		const formattedRules = rulesFound
			.map((r) => `### Rule File: ${r.file}\n${r.content}`)
			.join("\n\n");

		cachedHash = currentHash;
		cachedBlock = `\n\n## 📋 Project Instructions & Rules:\n${formattedRules}\n`;
		lastSnapshot = {
			cwd,
			files: rulesFound.map((rule) => rule.file),
			totalBytes,
			hash: currentHash,
			block: cachedBlock,
		};
		event.prompt += cachedBlock;
	});

	return () => {
		removeHook();
		unregisterCommand();
	};
}

export default { name, inject, apply };
