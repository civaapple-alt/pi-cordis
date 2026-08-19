import * as fs from "node:fs";
import * as path from "node:path";
import type { Context } from "@deepseek-ai/cordis";

export interface RulesInjectorConfig {
	ruleFiles?: string[];
	scanClaudeRules?: boolean;
}

export const name = "rules-injector";
export const inject = ["settings"];

function findMarkdownFiles(dir: string): string[] {
	const results: string[] = [];
	if (!fs.existsSync(dir)) return results;
	try {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				results.push(...findMarkdownFiles(fullPath));
			} else if (entry.isFile() && entry.name.endsWith(".md")) {
				results.push(fullPath);
			}
		}
	} catch {
		// Ignore read permission errors
	}
	return results;
}

export function apply(ctx: Context, config: RulesInjectorConfig = {}) {
	const targetRuleFiles = config.ruleFiles ?? [
		"AGENTS.md",
		"CLAUDE.md",
		".clauderules",
		".cursorrules",
	];

	ctx.on("pi/prompt-transform", async (event: { prompt: string }) => {
		const cwd = ctx.settings?.getCwd?.() ?? process.cwd();
		const rulesFound: string[] = [];

		// 1. Scan root rule files
		for (const file of targetRuleFiles) {
			const filePath = path.join(cwd, file);
			if (fs.existsSync(filePath)) {
				try {
					const content = fs.readFileSync(filePath, "utf-8").trim();
					if (content.length > 0) {
						rulesFound.push(`### Rule File: ${file}\n${content}`);
					}
				} catch {
					// Ignore read errors
				}
			}
		}

		// 2. Scan .claude/rules/ if enabled
		if (config.scanClaudeRules ?? true) {
			const claudeRulesDir = path.join(cwd, ".claude", "rules");
			const claudeFiles = findMarkdownFiles(claudeRulesDir);
			for (const cf of claudeFiles) {
				try {
					const content = fs.readFileSync(cf, "utf-8").trim();
					const relPath = path.relative(cwd, cf);
					rulesFound.push(`### Rule File: ${relPath}\n${content}`);
				} catch {
					// Ignore read errors
				}
			}
		}

		if (rulesFound.length > 0) {
			event.prompt += `\n\n## Project Context & Rules:\n${rulesFound.join("\n\n")}\n`;
		}
	});
}

export default { name, inject, apply };
