import { Service, type Context } from "@deepseek-ai/cordis";
import { DefaultPackageManager, SettingsManager, getAgentDir } from "@earendil-works/pi-coding-agent";

export type ProgressCallback = (message: string) => void;

export interface PackageManagerServiceConfig {
	cwd?: string;
	agentDir?: string;
	settingsManager?: SettingsManager;
}

export class PackageManagerService extends Service {
	static provide = "packageManager";
	static inject = ["settings"];
	public manager: any;

	constructor(ctx: Context, config?: PackageManagerServiceConfig) {
		super(ctx, "packageManager");
		const cwd = config?.cwd ?? process.cwd();
		const agentDir = config?.agentDir ?? getAgentDir();
		const settingsManager = config?.settingsManager ?? ctx.settings.getSettingsManager();
		this.manager = new DefaultPackageManager({ cwd, agentDir, settingsManager });

		// Forward progress events to Cordis event bus
		this.manager.setProgressCallback?.((message: string) => {
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
		this.manager.setProgressCallback?.((msg: string) => {
			callback?.(msg);
			this.ctx.emit("pi/package-progress", { message: msg });
		});
	}
}

export default PackageManagerService;
