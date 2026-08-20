import { Service, type Context } from "@deepseek-ai/cordis";
import { ModelRuntime } from "../../model-runtime.ts";
import { getAgentDir } from "../../../config.ts";
import { join } from "node:path";
import type { Model, Api, CustomProviderConfig, Provider } from "@earendil-works/pi-ai";

export interface AIServiceConfig {
	agentDir?: string;
	runtime?: ModelRuntime;
	allowModelNetwork?: boolean;
	signal?: AbortSignal;
}

export class AIService extends Service {
	static provide = "ai";
	public runtime!: ModelRuntime;
	private config?: AIServiceConfig;
	public activeModel?: Model<Api>;

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

	public switchModel(model: Model<Api>): void {
		this.activeModel = model;
		this.ctx.emit("pi/model-change", model);
	}

	/**
	 * Register a custom AI provider with Cordis fiber effect cleanup
	 */
	public registerProvider(name: string, config: CustomProviderConfig | any): () => void {
		return this.ctx.effect(() => {
			this.runtime.registerProvider(name, config);
			this.ctx.emit("pi/provider-registered", { name, config });
			return () => {
				(this.runtime as any).unregisterProvider?.(name);
				this.ctx.emit("pi/provider-unregistered", name);
			};
		});
	}

	/**
	 * Register a native AI provider with Cordis fiber effect cleanup
	 */
	public registerNativeProvider(provider: Provider<any> | any): () => void {
		return this.ctx.effect(() => {
			this.runtime.registerNativeProvider(provider);
			this.ctx.emit("pi/provider-registered", { name: provider.name });
			return () => {
				(this.runtime as any).unregisterProvider?.(provider.name);
				this.ctx.emit("pi/provider-unregistered", provider.name);
			};
		});
	}
}

export default AIService;
