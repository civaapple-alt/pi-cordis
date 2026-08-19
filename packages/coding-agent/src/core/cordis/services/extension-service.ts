import { Service, type Context } from "@deepseek-ai/cordis";
import { loadExtensions, type LoadExtensionsOptions, type LoadExtensionsResult } from "../../extensions/loader.ts";
import { ExtensionRunner } from "../../extensions/runner.ts";
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

	public async load(options?: LoadExtensionsOptions): Promise<LoadExtensionsResult> {
		const opts: LoadExtensionsOptions = {
			cwd: options?.cwd ?? this.cwd,
			agentDir: options?.agentDir ?? this.agentDir,
			extensionPaths: options?.extensionPaths ?? this.extensionPaths,
			...options,
		};
		const result = await loadExtensions(opts);
		this.lastLoadedResult = result;
		return result;
	}

	public createRunner(): ExtensionRunner {
		return new ExtensionRunner();
	}
}
