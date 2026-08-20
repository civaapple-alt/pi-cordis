import { Service, type Context } from "@deepseek-ai/cordis";
import { loadExtensions } from "../../extensions/loader.ts";
import type { LoadExtensionsResult } from "../../extensions/types.ts";
import { getAgentDir } from "../../../config.ts";

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
	public lastLoadedResult?: LoadExtensionsResult;

	constructor(ctx: Context, config?: ExtensionServiceConfig) {
		super(ctx, "extensions");
		this.cwd = config?.cwd ?? process.cwd();
		this.agentDir = config?.agentDir ?? getAgentDir();
		this.extensionPaths = config?.extensionPaths ?? [];
	}

	public async load(options?: { cwd?: string; agentDir?: string; extensionPaths?: string[] }): Promise<LoadExtensionsResult> {
		const cwd = options?.cwd ?? this.cwd;
		const paths = options?.extensionPaths ?? this.extensionPaths;
		const result = await loadExtensions(paths, cwd);
		this.lastLoadedResult = result;
		return result;
	}
}
