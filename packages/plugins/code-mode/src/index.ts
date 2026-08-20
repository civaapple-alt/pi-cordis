import type { Context } from "@deepseek-ai/cordis";
import * as vm from "node:vm";

export interface CodeModeConfig {
	timeoutMs?: number;
	allowImports?: boolean;
}

export interface CodeExecutionResult {
	success: boolean;
	output: string;
	error?: string;
	executionTimeMs: number;
}

export const name = "code-mode";
export const inject = ["tools"];

export function apply(ctx: Context, config: CodeModeConfig = {}) {
	const timeoutMs = config.timeoutMs ?? 30000;

	// 1. Register run_code tool
	const unregisterTool = ctx.tools.register({
		name: "run_code",
		description: "Execute a JavaScript/TypeScript program against the Pi Agent SDK to batch multiple tool operations into one round-trip.",
		parameters: {
			type: "object",
			properties: {
				code: {
					type: "string",
					description: "The JavaScript/TypeScript code to execute. Can use `console.log` and `pi.*` tools.",
				},
			},
			required: ["code"],
		},
		execute: async (args: { code: string }): Promise<CodeExecutionResult> => {
			const startTime = Date.now();
			const logs: string[] = [];

			const sdkProxy: Record<string, unknown> = {};
			const allTools = ctx.tools.getAllToolDefinitions();
			for (const t of allTools) {
				sdkProxy[t.name] = async (toolArgs: unknown) => {
					return (t as any).execute(toolArgs);
				};
			}

			const sandbox = {
				pi: sdkProxy,
				console: {
					log: (...vals: unknown[]) => logs.push(vals.map(String).join(" ")),
					error: (...vals: unknown[]) => logs.push("[ERROR] " + vals.map(String).join(" ")),
					warn: (...vals: unknown[]) => logs.push("[WARN] " + vals.map(String).join(" ")),
				},
				Promise,
				Array,
				Object,
				JSON,
				Math,
				Date,
			};

			const vmContext = vm.createContext(sandbox);

			try {
				const wrappedCode = `(async () => {\n${args.code}\n})()`;
				const script = new vm.Script(wrappedCode);
				const evalPromise = script.runInContext(vmContext, { timeout: timeoutMs });
				await evalPromise;

				return {
					success: true,
					output: logs.join("\n") || "(Execution completed with no output)",
					executionTimeMs: Date.now() - startTime,
				};
			} catch (err: any) {
				return {
					success: false,
					output: logs.join("\n"),
					error: err?.message || String(err),
					executionTimeMs: Date.now() - startTime,
				};
			}
		},
	});

	// 2. Inject SDK types into System Prompt
	const removePromptHook = ctx.on("pi/prompt-transform", async (event: { prompt: string }) => {
		const availableTools = ctx.tools.getToolNames();
		event.prompt += `\n\n## ⚡ Programmatic Tool Calling (Code Mode) Available:\nYou can use the \`run_code\` tool to execute batch logic via \`pi.<toolName>(args)\`. Available SDK tools: ${availableTools.join(", ")}.\n`;
	});

	// Reversible disposal
	return () => {
		unregisterTool();
		removePromptHook();
	};
}

export default { name, inject, apply };
