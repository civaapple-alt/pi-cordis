import { Service, type Context } from "@deepseek-ai/cordis";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import {
	chmodSync,
	existsSync,
	mkdirSync,
	readFileSync,
	renameSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import type { Credential, CredentialInfo } from "@earendil-works/pi-ai";

export interface AuthServiceConfig {
	agentDir?: string;
	authPath?: string;
}

export class AuthService extends Service {
	static provide = "auth";
	public authPath: string;
	private readonly inMemoryCredentials = new Map<string, Credential>();
	private mutationQueue: Promise<void> = Promise.resolve();

	constructor(ctx: Context, config?: AuthServiceConfig) {
		super(ctx, "auth");
		const agentDir = config?.agentDir ?? getAgentDir();
		this.authPath = config?.authPath ?? join(agentDir, "auth.json");
	}

	public async read(provider: string): Promise<Credential | undefined> {
		if (this.inMemoryCredentials.has(provider)) {
			return this.inMemoryCredentials.get(provider);
		}
		return this.readDiskCredentials()[provider];
	}

	public async getApiKey(provider: string): Promise<string | undefined> {
		const cred = await this.read(provider);
		if (!cred) return undefined;
		if (cred.type === "api_key") return cred.key;
		return undefined;
	}

	public async setApiKey(provider: string, apiKey: string): Promise<void> {
		const credential: Credential = { type: "api_key", key: apiKey };
		await this.enqueueMutation(() => {
			const data = this.readDiskCredentials();
			data[provider] = credential;
			this.writeDiskCredentials(data);
			this.inMemoryCredentials.set(provider, credential);
			this.ctx.emit("pi/auth-updated", { provider });
		});
	}

	public async remove(provider: string): Promise<void> {
		await this.enqueueMutation(() => {
			const data = this.readDiskCredentials();
			delete data[provider];
			this.writeDiskCredentials(data);
			this.inMemoryCredentials.delete(provider);
			this.ctx.emit("pi/auth-updated", { provider });
		});
	}

	public async has(provider: string): Promise<boolean> {
		const cred = await this.read(provider);
		return cred !== undefined;
	}

	public async list(): Promise<readonly CredentialInfo[]> {
		const items: CredentialInfo[] = Object.entries(this.readDiskCredentials()).map(
			([providerId, credential]) => ({ providerId, type: credential.type }),
		);
		for (const [provider, cred] of this.inMemoryCredentials.entries()) {
			if (!items.some((item) => item.providerId === provider)) {
				items.push({ providerId: provider, type: cred.type });
			}
		}
		return items;
	}

	private readDiskCredentials(): Record<string, Credential> {
		if (!existsSync(this.authPath)) return {};
		let parsed: unknown;
		try {
			parsed = JSON.parse(readFileSync(this.authPath, "utf8"));
		} catch (error) {
			throw new Error(
				`Failed to read auth.json: ${error instanceof Error ? error.message : String(error)}`,
				{ cause: error },
			);
		}
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
			throw new Error("Invalid auth.json: expected an object");
		}
		return parsed as Record<string, Credential>;
	}

	private writeDiskCredentials(data: Record<string, Credential>): void {
		const parentDir = dirname(this.authPath);
		mkdirSync(parentDir, { recursive: true, mode: 0o700 });
		const temporaryPath = join(parentDir, `.auth-${process.pid}-${randomUUID()}.tmp`);
		try {
			writeFileSync(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, {
				encoding: "utf8",
				flag: "wx",
				mode: 0o600,
			});
			renameSync(temporaryPath, this.authPath);
			chmodSync(this.authPath, 0o600);
		} finally {
			if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
		}
	}

	private enqueueMutation(operation: () => void): Promise<void> {
		const result = this.mutationQueue.then(operation);
		this.mutationQueue = result.catch(() => {});
		return result;
	}
}

export default AuthService;
