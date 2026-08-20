import { Service, type Context } from "@deepseek-ai/cordis";
import { SettingsManager, type Settings } from "../../settings-manager.ts";
import { getAgentDir } from "../../../config.ts";

export interface SettingsServiceConfig {
	cwd?: string;
	agentDir?: string;
	manager?: SettingsManager;
}

export class SettingsService extends Service {
	static provide = "settings";
	public manager: SettingsManager;
	public cwd: string;
	public agentDir: string;

	constructor(ctx: Context, config?: SettingsServiceConfig) {
		super(ctx, "settings");
		this.cwd = config?.cwd ?? process.cwd();
		this.agentDir = config?.agentDir ?? getAgentDir();
		this.manager = config?.manager ?? SettingsManager.create(this.cwd, this.agentDir);
	}

	public get(): Settings {
		return this.manager.getGlobalSettings();
	}

	public getCwd(): string {
		return this.cwd;
	}

	public getAgentDir(): string {
		return this.agentDir;
	}

	public getSettingsManager(): SettingsManager {
		return this.manager;
	}

	public drainErrors() {
		return this.manager.drainErrors();
	}
}
