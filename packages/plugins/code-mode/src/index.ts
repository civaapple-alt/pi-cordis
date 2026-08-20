import type { Context } from "@deepseek-ai/cordis";
import * as vm from "node:vm";
import { generateSdkDts, jsonSchemaToInterface, jsonSchemaTypeToTs } from "./dts-generator.js";

export * from "./dts-generator.js";

export interface CodeModeConfig {
	timeoutMs?: number;
	allowImports?: boolean;
	injectFullDts?: boolean;
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
	const injectFullDts = config.injectFullDts ?? true;

	// 1. Register run_code tool in Cordis tool registry
	const unregisterTool = ctx.tools.register({
		name: "run_code",
		description: "Execute a JavaScript/TypeScript program against the Pi Agent SDK to batch multiple tool operations into one round-trip.",
		parameters: {
			type: "object",
			properties: {
				code: {
					type: "string",
					description: "The JavaScript/TypeScript code to execute. Can use `console.log` and `pi.*` tools (e.g. `await pi.read(...)` or `await pi.fs.read(...)`).",
				},
			},
			required: ["code"],
		},
		execute: async (args: { code: string }): Promise<CodeExecutionResult> => {
			const startTime = Date.now();
			const logs: string[] = [];

			const allTools = ctx.tools.getAllToolDefinitions();
			const flatTools: Record<string, Function> = {};

			for (const t of allTools) {
				flatTools[t.name] = async (toolArgs: unknown) => {
					const res = await (t as any).execute(toolArgs);
					// If the result is a wrapped agent tool result, extract content
					if (res && typeof res === "object" && "details" in res) {
						return res.details;
					}
					return res;
				};
			}

			// Semantic namespace bridges
			const fsNamespace = {
				read: flatTools.read ?? (async (a: any) => ({})),
				write: flatTools.write ?? (async (a: any) => ({})),
				edit: flatTools.edit ?? (async (a: any) => ({})),
				patch: flatTools.patch ?? flatTools.apply_patch ?? (async (a: any) => ({})),
				list: flatTools.ls ?? flatTools.find ?? (async (a: any) => ({})),
				find: flatTools.find ?? (async (a: any) => ({})),
				grep: flatTools.grep ?? (async (a: any) => ({})),
			};

			const bashNamespace = {
				exec: flatTools.bash ?? (async (a: any) => ({})),
				run: async (command: string) => {
					if (flatTools.bash) {
						return flatTools.bash({ command });
					}
					return { stdout: "", stderr: "Bash tool not available", exitCode: 1 };
				},
			};

			const piSdk = {
				...flatTools,
				fs: fsNamespace,
				bash: bashNamespace,
			};

			const logCollector = (...vals: unknown[]) => {
				logs.push(
					vals
						.map((v) => (typeof v === "object" && v !== null ? JSON.stringify(v, null, 2) : String(v)))
						.join(" "),
				);
			};

			const sandbox = {
				pi: piSdk,
				console: {
					log: logCollector,
					info: logCollector,
					warn: (...vals: unknown[]) => logs.push("[WARN] " + vals.map(String).join(" ")),
					error: (...vals: unknown[]) => logs.push("[ERROR] " + vals.map(String).join(" ")),
					dir: logCollector,
					table: logCollector,
				},
				Promise,
				Array,
				Object,
				JSON,
				Math,
				Date,
				RegExp,
				String,
				Number,
				Boolean,
				Map,
				Set,
				Buffer,
				URL,
				URLSearchParams,
				setTimeout,
				clearTimeout,
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

	// 2. Inject Strong-Typed SDK declaration (.d.ts) into System Prompt
	const removePromptHook = ctx.on("pi/prompt-transform", async (event: { prompt: string }) => {
		const allTools = ctx.tools.getAllToolDefinitions();
		const dts = generateSdkDts(allTools);

		let guide = `\n\n## ⚡ Programmatic Tool Calling (PTC / Code Mode) Available:\n`;
		guide += `You can execute batch logic via the \`run_code\` tool using the strong-typed \`pi\` global SDK.\n`;
		guide += `Benefits: Collapses multiple steps into 1 round-trip; filter large data in-memory before returning.\n\n`;

		if (injectFullDts) {
			guide += `\`\`\`typescript\n${dts}\n\`\`\`\n`;
		}

		event.prompt += guide;
	});

	// Reversible disposal
	return () => {
		unregisterTool();
		removePromptHook();
	};
}

export default { name, inject, apply };
