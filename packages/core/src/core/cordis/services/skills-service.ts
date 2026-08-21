import { Service, type Context } from "@deepseek-ai/cordis";
import { loadSkills, getAgentDir } from "@earendil-works/pi-coding-agent";

export interface Skill {
	name: string;
	description?: string;
	content?: string;
	[key: string]: any;
}

export interface SkillsServiceConfig {
	cwd?: string;
	agentDir?: string;
	skillPaths?: string[];
}

export class SkillsService extends Service {
	static provide = "skills";
	private cwd: string;
	private agentDir: string;
	private skillPaths: string[];
	private customSkills = new Map<string, Skill[]>();

	constructor(ctx: Context, config?: SkillsServiceConfig) {
		super(ctx, "skills");
		this.cwd = config?.cwd ?? process.cwd();
		this.agentDir = config?.agentDir ?? getAgentDir();
		this.skillPaths = config?.skillPaths ?? [];
	}

	public load(options?: { cwd?: string; agentDir?: string; skillPaths?: string[] }): { skills: Skill[] } {
		const cwd = options?.cwd ?? this.cwd;
		const agentDir = options?.agentDir ?? this.agentDir;
		const paths = options?.skillPaths ?? this.skillPaths;
		const diskResult = loadSkills({ cwd, agentDir, skillPaths: paths, includeDefaults: true });
		return {
			skills: [...diskResult.skills, ...Array.from(this.customSkills.values(), (items) => items.at(-1)!)],
		};
	}

	/**
	 * Register a custom dynamic skill with Cordis fiber effect cleanup
	 */
	public registerSkill(skill: Skill): () => void {
		return this.ctx.effect(() => {
			const registrations = this.customSkills.get(skill.name) ?? [];
			registrations.push(skill);
			this.customSkills.set(skill.name, registrations);
			this.ctx.emit("pi/skill-registered", skill);
			return () => {
				const activeRegistrations = this.customSkills.get(skill.name);
				if (activeRegistrations) {
					const index = activeRegistrations.lastIndexOf(skill);
					if (index >= 0) activeRegistrations.splice(index, 1);
					if (activeRegistrations.length === 0) this.customSkills.delete(skill.name);
				}
				this.ctx.emit("pi/skill-unregistered", skill.name);
			};
		});
	}

	public getSkill(name: string): Skill | undefined {
		if (this.customSkills.has(name)) return this.customSkills.get(name)?.at(-1);
		const all = this.load().skills;
		return all.find((s) => s.name === name);
	}

	public getAllSkills(): Skill[] {
		return this.load().skills;
	}
}

export default SkillsService;
