import { Service, type Context } from "@deepseek-ai/cordis";
import { ModelRuntime } from "../../model-runtime.ts";
import { getAgentDir } from "../../../config.ts";
import { join } from "node:path";
import type { Model, Api } from "@earendil-works/pi-ai";

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
		return this.runtime.getAvailableModels();
	}

	public getModel(provider: string, modelId: string): Model<Api> | undefined {
		return this.runtime.getModel(provider, modelId);
	}
}
