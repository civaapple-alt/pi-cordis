import { Service, type Context } from "@deepseek-ai/cordis";
import { AuthStorage, ReadOnlyAuthStorage } from "../../auth-storage.ts";
import { getAgentDir } from "../../../config.ts";
import { join } from "path";
import type { Credential, CredentialInfo } from "@earendil-works/pi-ai";

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

	public getStorage(): AuthStorage | ReadOnlyAuthStorage {
		return this.storage;
	}

	public async read(provider: string): Promise<Credential | undefined> {
		return this.storage.read(provider);
	}

	public async getApiKey(provider: string): Promise<string | undefined> {
		const cred = await this.storage.read(provider);
		if (!cred) return undefined;
		if (cred.type === "api_key") return cred.key;
		return (cred as any).apiKey;
	}

	public async setApiKey(provider: string, apiKey: string): Promise<void> {
		await (this.storage as any).modify?.(provider, async () => ({ type: "api_key", key: apiKey }));
		this.ctx.emit("pi/auth-updated", { provider });
	}

	public async remove(provider: string): Promise<void> {
		await (this.storage as any).delete?.(provider);
		this.ctx.emit("pi/auth-updated", { provider });
	}

	public async has(provider: string): Promise<boolean> {
		const cred = await this.storage.read(provider);
		return cred !== undefined;
	}

	public async list(): Promise<readonly CredentialInfo[]> {
		return this.storage.list();
	}
}

export default AuthService;
