import { Service, type Context } from "@deepseek-ai/cordis";
import { discoverAndLoadExtensions, getAgentDir } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";

export interface ExtensionCommandDefinition {
	description: string;
	getArgumentCompletions?: (prefix: string) => Array<{ value: string; label?: string }> | null;
	handler: (args: string, ctx: any) => Promise<void> | void;
	[key: string]: any;
}

export interface ExtensionServiceConfig {
	cwd?: string;
	agentDir?: string;
	extensionPaths?: string[];
}

export const inject = ["tools", "ai"];

export class ExtensionService extends Service {
	static provide = "extensions";
	static inject = ["tools", "ai"];
	private cwd: string;
	private agentDir: string;
	private extensionPaths: string[];
	public lastLoadedResult?: any;
	private commands = new Map<string, ExtensionCommandDefinition[]>();
	private activePi?: any;
	private activeCommandNames = new Set<string>();

	constructor(ctx: Context, config?: ExtensionServiceConfig) {
		super(ctx, "extensions");
		this.cwd = config?.cwd ?? process.cwd();
		this.agentDir = config?.agentDir ?? getAgentDir();
		this.extensionPaths = config?.extensionPaths ?? [];

		// Listen for dynamically registered tools and tool changes to bridge to active Pi instance
		this.ctx.on("pi/tool-registered" as any, (tool: any) => {
			if (this.activePi && tool) {
				this.activePi.registerTool?.(this.adaptToolForPi(tool));
				this.syncActiveTools();
			}
		});

		this.ctx.on("pi/tools-changed" as any, () => {
			this.syncActiveTools();
		});

		this.ctx.on("pi/provider-registered", (event) => {
			if (!this.activePi) return;
			if (event.provider) this.activePi.registerProvider?.(event.provider);
			else if (event.config) this.activePi.registerProvider?.(event.name, event.config);
		});

		this.ctx.on("pi/provider-unregistered", (name) => {
			this.activePi?.unregisterProvider?.(name);
		});
	}

	public async load(options?: { cwd?: string; agentDir?: string; extensionPaths?: string[] }): Promise<any> {
		const cwd = options?.cwd ?? this.cwd;
		const agentDir = options?.agentDir ?? this.agentDir;
		const paths = options?.extensionPaths ?? this.extensionPaths;
		const result = await discoverAndLoadExtensions(paths, cwd, agentDir);
		this.lastLoadedResult = result;
		this.ctx.emit("pi/extension-loaded", result);
		return result;
	}

	public getLoadedExtensions() {
		return this.lastLoadedResult?.extensions ?? [];
	}

	public getLoadedTools() {
		return this.lastLoadedResult?.runtime?.tools ?? [];
	}

	/**
	 * Register a slash command from any Cordis plugin with reversible Disposer
	 */
	public registerCommand(name: string, definition: ExtensionCommandDefinition): () => void {
		return this.ctx.effect(() => {
			const registrations = this.commands.get(name) ?? [];
			registrations.push(definition);
			this.commands.set(name, registrations);
			this.ensureCommandBridge(name);
			this.ctx.emit("pi/command-registered", { name, definition });
			return () => {
				const activeRegistrations = this.commands.get(name);
				if (activeRegistrations) {
					const index = activeRegistrations.lastIndexOf(definition);
					if (index >= 0) activeRegistrations.splice(index, 1);
					if (activeRegistrations.length === 0) this.commands.delete(name);
				}
				this.ctx.emit("pi/command-unregistered", name);
			};
		});
	}

	private ensureCommandBridge(name: string): void {
		if (!this.activePi || this.activeCommandNames.has(name)) return;
		this.activePi.registerCommand(name, {
			description: this.commands.get(name)?.at(-1)?.description ?? `Cordis command: ${name}`,
			getArgumentCompletions: (prefix: string) => (
				this.commands.get(name)?.at(-1)?.getArgumentCompletions?.(prefix) ?? null
			),
			handler: async (args: string, commandContext: any) => {
				const activeDefinition = this.commands.get(name)?.at(-1);
				if (!activeDefinition) {
					commandContext?.ui?.notify?.(`Command /${name} is unavailable in the active profile.`, "warning");
					return;
				}
				await activeDefinition.handler(args, commandContext);
			},
		});
		this.activeCommandNames.add(name);
	}

	/**
	 * Get all registered slash commands
	 */
	public getRegisteredCommands(): ReadonlyMap<string, ExtensionCommandDefinition> {
		return new Map(
			Array.from(this.commands, ([name, registrations]) => [name, registrations.at(-1)!]),
		);
	}

	/**
	 * Adapt a Cordis ToolDef into a standard Pi ToolDefinition
	 */
	private adaptToolForPi(tool: any): any {
		return {
			name: tool.name,
			label: tool.label ?? tool.name,
			description: tool.description,
			parameters: tool.parameters ?? { type: "object", properties: {} },
			renderCall: tool.renderCall
				? (args: any, theme: any, context: any) => {
					try {
						const res = tool.renderCall(args, theme, context);
						if (res && typeof res === "object" && typeof res.render === "function") {
							return res;
						}
						const str = res !== undefined && res !== null ? String(res) : "";
						return new Text(str, 0, 0);
					} catch {
						return new Text("", 0, 0);
					}
				}
				: undefined,
			renderResult: tool.renderResult
				? (result: any, options: any, theme: any, context: any) => {
					try {
						const pluginResult = result?.details !== undefined ? result.details : result?.content ?? result;
						const res = tool.renderResult(pluginResult, options, theme, context);
						if (res && typeof res === "object" && typeof res.render === "function") {
							return res;
						}
						const str = res !== undefined && res !== null ? String(res) : "";
						return new Text(str, 0, 0);
					} catch {
						return new Text("", 0, 0);
					}
				}
				: undefined,
			execute: async (toolCallId: string, params: any, signal?: AbortSignal, onUpdate?: any, ctx?: any) => {
				const result = (await this.ctx.tools?.executeTool?.(tool.name, params, {
					toolCallId,
					signal,
					onUpdate,
					ctx,
				})) ?? (await tool.execute?.(params, { toolCallId, signal, onUpdate, ctx }));

				if (result && typeof result === "object" && "content" in result && Array.isArray(result.content)) {
					return result;
				}

				const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
				return {
					content: [{ type: "text", text }],
					details: result,
				};
			},
		};
	}

	/**
	 * Creates a hidden bridge extension factory for passing into upstream main()
	 */
	public createBridgeExtensionFactory(): { name: string; factory: (pi: any) => void; hidden: boolean } {
		return {
			name: "cordis-bridge",
			hidden: true,
			factory: (pi: any) => {
				this.activePi = pi;
				this.activeCommandNames.clear();
				this.ctx.ai.setModelSwitcher((model) => (
					typeof pi.setModel === "function" ? pi.setModel(model) : Promise.resolve(false)
				));

				for (const provider of this.ctx.ai.getRegisteredProviders()) {
					if (provider.kind === "native") pi.registerProvider?.(provider.value);
					else pi.registerProvider?.(provider.name, provider.value);
				}

				// 1. Register all slash commands
				for (const [name, registrations] of this.commands.entries()) {
					if (!registrations.at(-1)) continue;
					this.ensureCommandBridge(name);
				}

				// 2. Register built-in search tools (grep, find, ls) so they are available without CLI --tools restriction
				if (this.ctx.tools) {
					for (const builtinName of ["grep", "find", "ls"] as const) {
						const toolDef = this.ctx.tools.getBuiltinToolDefinition(builtinName);
						if (toolDef) {
							pi.registerTool?.(this.adaptToolForPi(toolDef));
						}
					}
				}

				// 3. Register all custom tools from ctx.tools to Pi
				if (this.ctx.tools) {
					for (const tool of this.ctx.tools.getCustomTools()) {
						pi.registerTool?.(this.adaptToolForPi(tool));
					}
				}

				// 4. Synchronize active tools according to active filters (e.g. PTC code-mode)
				this.syncActiveTools();

				// 5. Connect prompt transformation bridge (rules-injector, todo-tracker, plan-mode, code-mode)
				pi.on?.("before_agent_start", async (event: any) => {
					await this.ctx.serial("pi/session-before", {
						session: event.session,
						prompt: event.prompt ?? "",
					});
					const promptEvent = {
						prompt: event.systemPrompt ?? "",
						userPrompt: event.prompt ?? "",
					};
					await this.ctx.serial("pi/prompt-transform", promptEvent);
					if (promptEvent.prompt && promptEvent.prompt !== event.systemPrompt) {
						return { systemPrompt: promptEvent.prompt };
					}
				});

				// 6. Connect session lifecycle events
				pi.on?.("session_start", (event: any) => {
					this.ctx.emit("pi/session-start", event);
				});

				pi.on?.("session_shutdown", (event: any) => {
					this.ctx.emit("pi/session-shutdown", event);
				});

				// 7. Connect agent run lifecycle events
				pi.on?.("agent_start", (event: any) => {
					this.ctx.emit("pi/agent-start", event);
				});

				pi.on?.("agent_end", (event: any) => {
					this.ctx.emit("pi/agent-end", event);
				});

				pi.on?.("agent_settled", (event: any) => {
					this.ctx.emit("pi/agent-settled", event);
				});

				pi.on?.("turn_start", (event: any) => {
					this.ctx.emit("pi/turn-start", event);
				});

				pi.on?.("turn_end", (event: any) => {
					this.ctx.emit("pi/turn-end", event);
				});

				pi.on?.("model_select", (event: any) => {
					if (!event?.model) return;
					this.ctx.ai.activeModel = event.model;
					this.ctx.emit("pi/model-change", event.model);
				});

				// 8. Forward tool_call and tool_result events to Cordis EventBus
				pi.on?.("tool_call", async (event: any) => {
					await this.ctx.serial("pi/tool-call", {
						toolName: event.toolName,
						name: event.toolName,
						args: event.input ?? {},
					});
				});

				pi.on?.("tool_result", async (event: any) => {
					const resultEvent = {
						toolName: event.toolName,
						name: event.toolName,
						args: event.input ?? {},
						result: {
							content: event.content,
							details: event.details,
							isError: event.isError,
							usage: event.usage,
						},
					};
					await this.ctx.serial("pi/tool-result", resultEvent);

					const result = resultEvent.result as any;
					if (!result || typeof result !== "object") return undefined;
					return {
						content: result.content,
						details: result.details,
						isError: result.isError,
						usage: result.usage,
					};
				});
			},
		};
	}

	/**
	 * Synchronize active tools in the upstream Pi runtime according to Cordis tool filters
	 */
	public syncActiveTools(): void {
		if (!this.activePi || !this.ctx.tools) return;

		// 1. Register any new custom tools
		for (const tool of this.ctx.tools.getCustomTools()) {
			this.activePi.registerTool?.(this.adaptToolForPi(tool));
		}

		// 2. Compute exported tool names (taking active filters like code-mode into account)
		const exportedToolNames = this.ctx.tools.getExportedToolNames();
		this.activePi.setActiveTools?.(exportedToolNames);
	}
}

export default ExtensionService;
