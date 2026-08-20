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
	private customPrompts: Map<string, PromptTemplate> = new Map();

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
		const diskPrompts = loadPromptTemplates({ cwd, agentDir, promptPaths: paths, includeDefaults: true });
		return [...diskPrompts, ...this.customPrompts.values()];
	}

	/**
	 * Register a custom dynamic prompt template with Cordis fiber effect cleanup
	 */
	public registerPrompt(template: PromptTemplate): () => void {
		return this.ctx.effect(() => {
			this.customPrompts.set(template.name, template);
			this.ctx.emit("pi/prompt-registered", template);
			return () => {
				this.customPrompts.delete(template.name);
			};
		});
	}

	public getPrompt(name: string): PromptTemplate | undefined {
		if (this.customPrompts.has(name)) return this.customPrompts.get(name);
		const all = this.load();
		return all.find((p) => p.name === name);
	}

	public getAllPrompts(): PromptTemplate[] {
		return this.load();
	}
}

export default PromptsService;
