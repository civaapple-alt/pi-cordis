import { Service, type Context } from "@deepseek-ai/cordis";
import { DefaultResourceLoader, getAgentDir } from "@earendil-works/pi-coding-agent";

export interface PromptTemplate {
	name: string;
	description?: string;
	template?: string;
	[key: string]: any;
}

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
	private loader?: DefaultResourceLoader;

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

		try {
			this.loader = new DefaultResourceLoader({
				cwd,
				agentDir,
				additionalPromptTemplatePaths: paths,
			});
			const result = this.loader.getPrompts?.();
			const diskPrompts = (Array.isArray(result) ? result : (result as any)?.prompts ?? []) as PromptTemplate[];
			return [...diskPrompts, ...this.customPrompts.values()];
		} catch {
			return Array.from(this.customPrompts.values());
		}
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
