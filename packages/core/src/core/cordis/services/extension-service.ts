import { Service, type Context } from "@deepseek-ai/cordis";
import { discoverAndLoadExtensions, getAgentDir } from "@earendil-works/pi-coding-agent";

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

export class ExtensionService extends Service {
	static provide = "extensions";
	private cwd: string;
	private agentDir: string;
	private extensionPaths: string[];
	public lastLoadedResult?: any;
	private commands = new Map<string, ExtensionCommandDefinition>();
	private activePi?: any;

	constructor(ctx: Context, config?: ExtensionServiceConfig) {
		super(ctx, "extensions");
		this.cwd = config?.cwd ?? process.cwd();
		this.agentDir = config?.agentDir ?? getAgentDir();
		this.extensionPaths = config?.extensionPaths ?? [];

		// Listen for dynamically registered tools and bridge to active Pi instance
		this.ctx.on("pi/tool-registered" as any, (tool: any) => {
			if (this.activePi && tool) {
				try {
					this.activePi.registerTool(this.adaptToolForPi(tool));
				} catch {
					// Ignore duplicate
				}
			}
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
			this.commands.set(name, definition);
			if (this.activePi) {
				try {
					this.activePi.registerCommand(name, definition);
				} catch {
					// Ignore if already registered
				}
			}
			this.ctx.emit("pi/command-registered", { name, definition });
			return () => {
				this.commands.delete(name);
				this.ctx.emit("pi/command-unregistered", name);
			};
		});
	}

	/**
	 * Get all registered slash commands
	 */
	public getRegisteredCommands(): ReadonlyMap<string, ExtensionCommandDefinition> {
		return this.commands;
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
			renderCall: tool.renderCall,
			renderResult: tool.renderResult,
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

				// 1. Register all slash commands
				for (const [name, def] of this.commands.entries()) {
					try {
						pi.registerCommand?.(name, def);
					} catch {
						// Ignore duplicate registration
					}
				}

				// 2. Register built-in search tools (grep, find, ls) so they are available without CLI --tools restriction
				if (this.ctx.tools) {
					for (const builtinName of ["grep", "find", "ls"] as const) {
						try {
							const toolDef = this.ctx.tools.getBuiltinToolDefinition(builtinName);
							if (toolDef) {
								pi.registerTool?.(this.adaptToolForPi(toolDef));
							}
						} catch {
							// Ignore if already registered
						}
					}
				}

				// 3. Register all custom tools from ctx.tools to Pi
				if (this.ctx.tools) {
					for (const tool of this.ctx.tools.getCustomTools()) {
						try {
							pi.registerTool?.(this.adaptToolForPi(tool));
						} catch {
							// Ignore duplicate registration
						}
					}
				}

				// 3. Forward tool_call and tool_result events to Cordis EventBus
				pi.on?.("tool_call", async (event: any) => {
					await this.ctx.parallel("pi/tool-call", {
						toolName: event.toolName,
						name: event.toolName,
						args: event.input ?? {},
					});
				});

				pi.on?.("tool_result", async (event: any) => {
					await this.ctx.parallel("pi/tool-result", {
						toolName: event.toolName,
						name: event.toolName,
						args: event.input ?? {},
						result: event.content ?? event.details,
					});
				});
			},
		};
	}
}

export default ExtensionService;
