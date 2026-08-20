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

		// Forward progress events to Cordis event bus
		this.manager.setProgressCallback((message: string) => {
			this.ctx.emit("pi/package-progress", { message });
		});
	}

	public async install(source: string, options?: { local?: boolean }) {
		const result = await this.manager.install(source, options);
		this.ctx.emit("pi/package-installed", { source, local: options?.local });
		return result;
	}

	public async installAndPersist(source: string, options?: { local?: boolean }) {
		const result = await this.manager.installAndPersist(source, options);
		this.ctx.emit("pi/package-installed", { source, local: options?.local });
		return result;
	}

	public async remove(source: string, options?: { local?: boolean }) {
		const result = await this.manager.remove(source, options);
		this.ctx.emit("pi/package-removed", { source, local: options?.local });
		return result;
	}

	public async removeAndPersist(source: string, options?: { local?: boolean }) {
		const result = await this.manager.removeAndPersist(source, options);
		this.ctx.emit("pi/package-removed", { source, local: options?.local });
		return result;
	}

	public async update(source?: string) {
		const result = await this.manager.update(source);
		this.ctx.emit("pi/package-updated", { source });
		return result;
	}

	public listConfiguredPackages() {
		return this.manager.listConfiguredPackages();
	}

	public setProgressCallback(callback: ProgressCallback | undefined) {
		this.manager.setProgressCallback((msg) => {
			callback?.(msg);
			this.ctx.emit("pi/package-progress", { message: msg });
		});
	}
}

export default PackageManagerService;
