import type { Context } from "@deepseek-ai/cordis";
import * as vm from "node:vm";
import { generateSdkDts, jsonSchemaToInterface, jsonSchemaTypeToTs } from "./dts-generator.js";
import { renderCodeModeCall, renderCodeModeResult, type RenderOptions } from "./renderer.js";
import { executeInWorkerThread, createWorkerScript } from "./worker-runner.js";

export * from "./dts-generator.js";
export * from "./renderer.js";
export * from "./worker-runner.js";

export interface CodeModeConfig {
	timeoutMs?: number;
	allowImports?: boolean;
	injectFullDts?: boolean;
	maskUnderlyingTools?: boolean;
	allowedTopLevelTools?: string[];
	useWorkerThreads?: boolean;
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
	const maskUnderlyingTools = config.maskUnderlyingTools ?? true;
	const useWorkerThreads = config.useWorkerThreads ?? true;

	// 1. Tool Presentation Masking (hide raw file/bash tools from LLM top-level tool list)
	let removeFilter: (() => void) | undefined;
	if (maskUnderlyingTools) {
		const allowedTopLevel = new Set(
			config.allowedTopLevelTools ?? [
				"run_code",
				"ask_question",
				"session_handoff",
				"todo_write",
				"todo_read",
				"plan_step",
			],
		);

		const maskedBuiltins = new Set([
			"read",
			"write",
			"edit",
			"patch",
			"apply_patch",
			"bash",
			"grep",
			"find",
			"ls",
		]);

		removeFilter = ctx.tools.addFilter((tool) => {
			if (allowedTopLevel.has(tool.name)) return true;
			if (maskedBuiltins.has(tool.name)) return false;
			return true;
		});
	}

	// 2. Register run_code tool in Cordis tool registry
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
		renderCall: (args: { code?: string }, theme?: any) => renderCodeModeCall(args, theme),
		renderResult: (result: any, options?: any, theme?: any) => renderCodeModeResult(result, options, theme),
		execute: async (args: { code: string }): Promise<CodeExecutionResult> => {
			const allTools = ctx.tools.getAllToolDefinitions();

			// 2.1 Prefer Worker Thread for 100% async infinite-loop isolation & terminate() safety
			if (useWorkerThreads) {
				try {
					const toolNames = allTools.map((t) => t.name);
					return await executeInWorkerThread({
						code: args.code,
						timeoutMs,
						toolNames,
						callTool: async (toolName, toolArgs) => {
							const t = ctx.tools.get(toolName);
							if (!t) throw new Error(`Tool "${toolName}" not found`);
							const res = await (t as any).execute(toolArgs);
							if (res && typeof res === "object" && "details" in res) {
								return res.details;
							}
							return res;
						},
					});
				} catch (err: any) {
					// If Worker spawning fails, fall back to node:vm
				}
			}

			// 2.2 Fallback: node:vm sandbox
			const startTime = Date.now();
			const logs: string[] = [];
			const flatTools: Record<string, Function> = {};

			for (const t of allTools) {
				flatTools[t.name] = async (toolArgs: unknown) => {
					const res = await (t as any).execute(toolArgs);
					if (res && typeof res === "object" && "details" in res) {
						return res.details;
					}
					return res;
				};
			}

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

	// 3. Inject Strong-Typed SDK declaration (.d.ts) into System Prompt
	const removePromptHook = ctx.on("pi/prompt-transform", async (event: { prompt: string }) => {
		const allTools = ctx.tools.getAllToolDefinitions();
		const dts = generateSdkDts(allTools);

		let guide = `\n\n## ⚡ Programmatic Tool Calling (PTC / Code Mode) Available:\n`;
		guide += `You can execute batch logic via the \`run_code\` tool using the strong-typed \`pi\` global SDK.\n`;
		guide += `Benefits: Collapses multiple steps into 1 round-trip; filter large data in-memory before returning.\n`;
		if (maskUnderlyingTools) {
			guide += `Note: Standard tools (read, write, bash, etc.) are encapsulated in the \`pi\` SDK and not exposed as separate top-level tools.\n\n`;
		}

		if (injectFullDts) {
			guide += `\`\`\`typescript\n${dts}\n\`\`\`\n`;
		}

		event.prompt += guide;
	});

	// Reversible disposal
	ctx.effect(() => () => {
		unregisterTool();
		removeFilter?.();
		removePromptHook();
	});

	return () => {
		unregisterTool();
		removeFilter?.();
		removePromptHook();
	};
}

export default { name, inject, apply };

