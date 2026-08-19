import { Service, type Context } from "@deepseek-ai/cordis";
import { AuthStorage, ReadOnlyAuthStorage } from "../../auth-storage.ts";
import { getAgentDir } from "../../../config.ts";
import { join } from "path";

export interface AuthServiceConfig {
	agentDir?: string;
	authPath?: string;
	readOnly?: boolean;
	storage?: AuthStorage | ReadOnlyAuthStorage;
}

export class AuthService extends Service {
	static provide = "auth";
	public storage: AuthStorage | ReadOnlyAuthStorage;

	constructor(ctx: Context, config?: AuthServiceConfig) {
		super(ctx, "auth");
		const agentDir = config?.agentDir ?? getAgentDir();
		const authPath = config?.authPath ?? join(agentDir, "auth.json");
		if (config?.storage) {
			this.storage = config.storage;
		} else if (config?.readOnly) {
			this.storage = new ReadOnlyAuthStorage(authPath);
		} else {
			this.storage = AuthStorage.create(authPath);
		}
	}

	public getStorage() {
		return this.storage;
	}
}
