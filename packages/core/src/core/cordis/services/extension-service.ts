import { Service, type Context } from "@deepseek-ai/cordis";
import { discoverAndLoadExtensions, getAgentDir, ExtensionRunner } from "@earendil-works/pi-coding-agent";

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
}

export default ExtensionService;
