import { Service, type Context } from "@deepseek-ai/cordis";
import { SettingsManager, getAgentDir } from "@earendil-works/pi-coding-agent";

export type Settings = ReturnType<typeof SettingsManager.prototype.getGlobalSettings>;

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

	public getEffective(): Settings {
		return (this.manager as any).getEffectiveSettings?.() ?? (this.manager as any).settings ?? this.manager.getGlobalSettings();
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

	public getSetting<K extends keyof Settings>(key: K): Settings[K] {
		return (this.manager as any).settings?.[key] ?? this.get()[key];
	}

	public setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
		if ((this.manager as any).globalSettings) {
			(this.manager as any).globalSettings[key] = value;
			(this.manager as any).markModified?.(key);
			(this.manager as any).save?.();
		}
		this.manager.applyOverrides({ [key]: value });
		this.ctx.emit("pi/settings-updated", { settings: this.get(), changedKeys: [String(key)] });
	}

	public update(partialSettings: Partial<Settings>): void {
		const changedKeys: string[] = [];
		if ((this.manager as any).globalSettings) {
			for (const key of Object.keys(partialSettings) as Array<keyof Settings>) {
				if (partialSettings[key] !== undefined) {
					(this.manager as any).globalSettings[key] = partialSettings[key];
					(this.manager as any).markModified?.(key);
					changedKeys.push(String(key));
				}
			}
			(this.manager as any).save?.();
		} else {
			changedKeys.push(...Object.keys(partialSettings));
		}
		this.manager.applyOverrides(partialSettings);
		this.ctx.emit("pi/settings-updated", { settings: this.get(), changedKeys });
	}

	public drainErrors(): any[] {
		return this.manager.drainErrors();
	}
}

export default SettingsService;
