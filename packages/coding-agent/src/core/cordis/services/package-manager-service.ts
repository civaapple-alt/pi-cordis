import { Service, type Context } from "@deepseek-ai/cordis";
import { DefaultPackageManager, type PackageManager, type ProgressCallback } from "../../package-manager.ts";
import { SettingsManager } from "../../settings-manager.ts";
import { getAgentDir } from "../../../config.ts";

export interface PackageManagerServiceConfig {
	cwd?: string;
	agentDir?: string;
	settingsManager?: SettingsManager;
}

export class PackageManagerService extends Service {
	static provide = "packageManager";
	public manager: PackageManager;

	constructor(ctx: Context, config?: PackageManagerServiceConfig) {
		super(ctx, "packageManager");
		const cwd = config?.cwd ?? process.cwd();
		const agentDir = config?.agentDir ?? getAgentDir();
		const settingsManager = config?.settingsManager ?? SettingsManager.create(cwd, agentDir);
		this.manager = new DefaultPackageManager({ cwd, agentDir, settingsManager });
	}

	public async install(source: string, options?: { local?: boolean }) {
		return this.manager.install(source, options);
	}

	public async installAndPersist(source: string, options?: { local?: boolean }) {
		return this.manager.installAndPersist(source, options);
	}

	public async remove(source: string, options?: { local?: boolean }) {
		return this.manager.remove(source, options);
	}

	public async removeAndPersist(source: string, options?: { local?: boolean }) {
		return this.manager.removeAndPersist(source, options);
	}

	public async update(source?: string) {
		return this.manager.update(source);
	}

	public listConfiguredPackages() {
		return this.manager.listConfiguredPackages();
	}

	public setProgressCallback(callback: ProgressCallback | undefined) {
		this.manager.setProgressCallback(callback);
	}
}
