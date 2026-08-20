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
	 * Creates a hidden bridge extension factory for passing into upstream main()
	 */
	public createBridgeExtensionFactory(): { name: string; factory: (pi: any) => void; hidden: boolean } {
		return {
			name: "cordis-bridge",
			hidden: true,
			factory: (pi: any) => {
				this.activePi = pi;
				for (const [name, def] of this.commands.entries()) {
					try {
						pi.registerCommand(name, def);
					} catch {
						// Ignore duplicate registration
					}
				}
			},
		};
	}
}

export default ExtensionService;
