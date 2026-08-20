import { Service, type Context } from "@deepseek-ai/cordis";
import { loadPromptTemplates, type PromptTemplate } from "../../prompt-templates.ts";
import { getAgentDir } from "../../../config.ts";

export interface PromptsServiceConfig {
	cwd?: string;
	agentDir?: string;
	promptPaths?: string[];
}

export class PromptsService extends Service {
	static provide = "prompts";
	private cwd: string;
	private agentDir: string;
	private promptPaths: string[];

	constructor(ctx: Context, config?: PromptsServiceConfig) {
		super(ctx, "prompts");
		this.cwd = config?.cwd ?? process.cwd();
		this.agentDir = config?.agentDir ?? getAgentDir();
		this.promptPaths = config?.promptPaths ?? [];
	}

	public load(options?: { cwd?: string; agentDir?: string; promptPaths?: string[] }): PromptTemplate[] {
		const cwd = options?.cwd ?? this.cwd;
		const agentDir = options?.agentDir ?? this.agentDir;
		const paths = options?.promptPaths ?? this.promptPaths;
		return loadPromptTemplates({ cwd, agentDir, promptPaths: paths, includeDefaults: true });
	}
}
