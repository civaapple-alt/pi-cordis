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

	constructor(ctx: Context, config?: SettingsServiceConfig) {
		super(ctx, "settings");
		const cwd = config?.cwd ?? process.cwd();
		const agentDir = config?.agentDir ?? getAgentDir();
		this.manager = config?.manager ?? SettingsManager.create(cwd, agentDir);
	}

	public get(): Settings {
		return this.manager.get();
	}

	public getSettingsManager(): SettingsManager {
		return this.manager;
	}

	public drainErrors() {
		return this.manager.drainErrors();
	}
}
