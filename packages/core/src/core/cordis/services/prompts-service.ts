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
	private customPrompts = new Map<string, PromptTemplate[]>();
	private loader?: DefaultResourceLoader;

	constructor(ctx: Context, config?: PromptsServiceConfig) {
		super(ctx, "prompts");
		this.cwd = config?.cwd ?? process.cwd();
		this.agentDir = config?.agentDir ?? getAgentDir();
		this.promptPaths = config?.promptPaths ?? [];
	}

	public async load(options?: { cwd?: string; agentDir?: string; promptPaths?: string[] }): Promise<PromptTemplate[]> {
		const cwd = options?.cwd ?? this.cwd;
		const agentDir = options?.agentDir ?? this.agentDir;
		const paths = options?.promptPaths ?? this.promptPaths;

		this.loader = new DefaultResourceLoader({
			cwd,
			agentDir,
			additionalPromptTemplatePaths: paths,
			noExtensions: true,
			noSkills: true,
			noThemes: true,
			noContextFiles: true,
		});
		await this.loader.reload();
		const result = this.loader.getPrompts?.();
		const diskPrompts = (Array.isArray(result) ? result : (result as any)?.prompts ?? []) as PromptTemplate[];
		return [...diskPrompts, ...Array.from(this.customPrompts.values(), (items) => items.at(-1)!)];
	}

	/**
	 * Register a custom dynamic prompt template with Cordis fiber effect cleanup
	 */
	public registerPrompt(template: PromptTemplate): () => void {
		return this.ctx.effect(() => {
			const registrations = this.customPrompts.get(template.name) ?? [];
			registrations.push(template);
			this.customPrompts.set(template.name, registrations);
			this.ctx.emit("pi/prompt-registered", template);
			return () => {
				const activeRegistrations = this.customPrompts.get(template.name);
				if (activeRegistrations) {
					const index = activeRegistrations.lastIndexOf(template);
					if (index >= 0) activeRegistrations.splice(index, 1);
					if (activeRegistrations.length === 0) this.customPrompts.delete(template.name);
				}
				this.ctx.emit("pi/prompt-unregistered", template.name);
			};
		});
	}

	public async getPrompt(name: string): Promise<PromptTemplate | undefined> {
		if (this.customPrompts.has(name)) return this.customPrompts.get(name)?.at(-1);
		const all = await this.load();
		return all.find((p) => p.name === name);
	}

	public async getAllPrompts(): Promise<PromptTemplate[]> {
		return this.load();
	}
}

export default PromptsService;
