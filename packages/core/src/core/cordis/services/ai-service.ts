import { Service, type Context } from "@deepseek-ai/cordis";
import { ModelRuntime, getAgentDir } from "@earendil-works/pi-coding-agent";
import { join } from "node:path";
import type { Model, Api, Provider } from "@earendil-works/pi-ai";

export interface AIServiceConfig {
	agentDir?: string;
	runtime?: ModelRuntime;
	allowModelNetwork?: boolean;
	signal?: AbortSignal;
}

export interface DynamicProviderRegistration {
	name: string;
	kind: "config" | "native";
	value: any;
}

export class AIService extends Service {
	static provide = "ai";
	public runtime!: ModelRuntime;
	private config?: AIServiceConfig;
	public activeModel?: Model<Api>;
	private providerRegistrations = new Map<string, Array<{ kind: "config" | "native"; value: any }>>();
	private modelSwitcher?: (model: Model<Api>) => Promise<boolean>;

	constructor(ctx: Context, config?: AIServiceConfig) {
		super(ctx, "ai");
		this.config = config;
		if (config?.runtime) {
			this.runtime = config.runtime;
		}
	}

	public async init() {
		if (!this.runtime) {
			const agentDir = this.config?.agentDir ?? getAgentDir();
			this.runtime = await ModelRuntime.create({
				authPath: join(agentDir, "auth.json"),
				modelsPath: join(agentDir, "models.json"),
				allowModelNetwork: this.config?.allowModelNetwork,
				signal: this.config?.signal,
			});
		}
	}

	public getRuntime(): ModelRuntime {
		return this.runtime;
	}

	public getModels(): readonly Model<Api>[] {
		return this.runtime.getModels();
	}

	public getAvailableModels(): readonly Model<Api>[] {
		return (this.runtime as any).getAvailableModels?.() ?? (this.runtime as any).getAvailable?.() ?? this.runtime.getModels();
	}

	public getModel(provider: string, modelId: string): Model<Api> | undefined {
		return this.runtime.getModel(provider, modelId);
	}

	public async switchModel(model: Model<Api>): Promise<boolean> {
		if (this.modelSwitcher && !await this.modelSwitcher(model)) return false;
		this.activeModel = model;
		this.ctx.emit("pi/model-change", model);
		return true;
	}

	public setModelSwitcher(switcher: ((model: Model<Api>) => Promise<boolean>) | undefined): void {
		this.modelSwitcher = switcher;
	}

	public getRegisteredProviders(): DynamicProviderRegistration[] {
		return Array.from(this.providerRegistrations, ([name, registrations]) => {
			const active = registrations.at(-1)!;
			return { name, kind: active.kind, value: active.value };
		});
	}

	/**
	 * Register a custom AI provider with Cordis fiber effect cleanup
	 */
	public registerProvider(name: string, config: any): () => void {
		return this.ctx.effect(() => {
			this.runtime.registerProvider(name, config);
			const registration = { kind: "config" as const, value: config };
			const registrations = this.providerRegistrations.get(name) ?? [];
			registrations.push(registration);
			this.providerRegistrations.set(name, registrations);
			this.ctx.emit("pi/provider-registered", { name, config });
			return () => {
				const activeRegistrations = this.providerRegistrations.get(name);
				if (!activeRegistrations) return;
				const wasActive = activeRegistrations.at(-1) === registration;
				const index = activeRegistrations.lastIndexOf(registration);
				if (index >= 0) activeRegistrations.splice(index, 1);
				if (activeRegistrations.length === 0) this.providerRegistrations.delete(name);
				if (!wasActive) return;
				this.runtime.unregisterProvider(name);
				const previous = activeRegistrations.at(-1);
				if (previous?.kind === "config") this.runtime.registerProvider(name, previous.value);
				else if (previous) this.runtime.registerNativeProvider(previous.value);
				this.ctx.emit("pi/provider-unregistered", name);
				if (previous) {
					this.ctx.emit("pi/provider-registered", previous.kind === "config"
						? { name, config: previous.value }
						: { name, provider: previous.value });
				}
			};
		});
	}

	/**
	 * Register a native AI provider with Cordis fiber effect cleanup
	 */
	public registerNativeProvider(provider: Provider<any> | any): () => void {
		return this.ctx.effect(() => {
			this.runtime.registerNativeProvider(provider);
			const name = provider.id;
			const registration = { kind: "native" as const, value: provider };
			const registrations = this.providerRegistrations.get(name) ?? [];
			registrations.push(registration);
			this.providerRegistrations.set(name, registrations);
			this.ctx.emit("pi/provider-registered", { name, provider });
			return () => {
				const activeRegistrations = this.providerRegistrations.get(name);
				if (!activeRegistrations) return;
				const wasActive = activeRegistrations.at(-1) === registration;
				const index = activeRegistrations.lastIndexOf(registration);
				if (index >= 0) activeRegistrations.splice(index, 1);
				if (activeRegistrations.length === 0) this.providerRegistrations.delete(name);
				if (!wasActive) return;
				this.runtime.unregisterProvider(name);
				const previous = activeRegistrations.at(-1);
				if (previous?.kind === "config") this.runtime.registerProvider(name, previous.value);
				else if (previous) this.runtime.registerNativeProvider(previous.value);
				this.ctx.emit("pi/provider-unregistered", name);
				if (previous) {
					this.ctx.emit("pi/provider-registered", previous.kind === "config"
						? { name, config: previous.value }
						: { name, provider: previous.value });
				}
			};
		});
	}
}

export default AIService;
