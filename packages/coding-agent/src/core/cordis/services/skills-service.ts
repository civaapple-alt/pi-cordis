import { Service, type Context } from "@deepseek-ai/cordis";
import { loadSkills, type Skill, type SkillLoadResult } from "../../skills.ts";
import { getAgentDir } from "../../../config.ts";

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

	constructor(ctx: Context, config?: SkillsServiceConfig) {
		super(ctx, "skills");
		this.cwd = config?.cwd ?? process.cwd();
		this.agentDir = config?.agentDir ?? getAgentDir();
		this.skillPaths = config?.skillPaths ?? [];
	}

	public load(options?: { cwd?: string; agentDir?: string; skillPaths?: string[] }): SkillLoadResult {
		const cwd = options?.cwd ?? this.cwd;
		const agentDir = options?.agentDir ?? this.agentDir;
		const paths = options?.skillPaths ?? this.skillPaths;
		return loadSkills({ cwd, agentDir, skillPaths: paths });
	}
}
