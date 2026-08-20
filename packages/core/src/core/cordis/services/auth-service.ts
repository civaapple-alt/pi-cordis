import { Service, type Context } from "@deepseek-ai/cordis";
import { readStoredCredential, getAgentDir } from "@earendil-works/pi-coding-agent";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { Credential, CredentialInfo } from "@earendil-works/pi-ai";

export interface AuthServiceConfig {
	agentDir?: string;
	authPath?: string;
}

export class AuthService extends Service {
	static provide = "auth";
	public authPath: string;
	private inMemoryCredentials: Map<string, any> = new Map();

	constructor(ctx: Context, config?: AuthServiceConfig) {
		super(ctx, "auth");
		const agentDir = config?.agentDir ?? getAgentDir();
		this.authPath = config?.authPath ?? join(agentDir, "auth.json");
	}

	public async read(provider: string): Promise<Credential | undefined> {
		if (this.inMemoryCredentials.has(provider)) {
			return this.inMemoryCredentials.get(provider);
		}
		return readStoredCredential(provider, this.authPath) as Credential | undefined;
	}

	public async getApiKey(provider: string): Promise<string | undefined> {
		const cred = await this.read(provider);
		if (!cred) return undefined;
		if (cred.type === "api_key") return cred.key;
		return (cred as any).apiKey;
	}

	public async setApiKey(provider: string, apiKey: string): Promise<void> {
		this.inMemoryCredentials.set(provider, { type: "api_key", key: apiKey });
		try {
			let data: Record<string, any> = {};
			if (existsSync(this.authPath)) {
				try {
					data = JSON.parse(readFileSync(this.authPath, "utf-8"));
				} catch {}
			}
			data[provider] = { type: "api_key", key: apiKey };
			mkdirSync(dirname(this.authPath), { recursive: true });
			writeFileSync(this.authPath, JSON.stringify(data, null, 2), "utf-8");
		} catch {
			// In test or restricted environment, in-memory credential is preserved
		}
		this.ctx.emit("pi/auth-updated", { provider });
	}

	public async remove(provider: string): Promise<void> {
		this.inMemoryCredentials.delete(provider);
		try {
			if (existsSync(this.authPath)) {
				const data = JSON.parse(readFileSync(this.authPath, "utf-8"));
				delete data[provider];
				writeFileSync(this.authPath, JSON.stringify(data, null, 2), "utf-8");
			}
		} catch {}
		this.ctx.emit("pi/auth-updated", { provider });
	}

	public async has(provider: string): Promise<boolean> {
		const cred = await this.read(provider);
		return cred !== undefined;
	}

	public async list(): Promise<readonly CredentialInfo[]> {
		const items: CredentialInfo[] = [];
		try {
			if (existsSync(this.authPath)) {
				const data = JSON.parse(readFileSync(this.authPath, "utf-8"));
				for (const [provider, cred] of Object.entries(data)) {
					items.push({ providerId: provider, provider, type: (cred as any).type ?? "api_key" } as unknown as CredentialInfo);
				}
			}
		} catch {}
		for (const [provider, cred] of this.inMemoryCredentials.entries()) {
			if (!items.find((i) => (i as any).provider === provider || i.providerId === provider)) {
				items.push({ providerId: provider, provider, type: (cred as any).type ?? "api_key" } as unknown as CredentialInfo);
			}
		}
		return items;
	}
}

export default AuthService;
