import { Service, type Context } from "@deepseek-ai/cordis";
import { SessionManager, type NewSessionOptions, type SessionInfo } from "../../session-manager.ts";

export interface SessionServiceConfig {
	cwd?: string;
	sessionDir?: string;
}

export class SessionService extends Service {
	static provide = "session";
	private cwd: string;
	private sessionDir?: string;

	constructor(ctx: Context, config?: SessionServiceConfig) {
		super(ctx, "session");
		this.cwd = config?.cwd ?? process.cwd();
		this.sessionDir = config?.sessionDir;
	}

	public create(cwd: string = this.cwd, options?: NewSessionOptions): SessionManager {
		return SessionManager.create(cwd, this.sessionDir, options);
	}

	public open(path: string): SessionManager {
		return SessionManager.open(path, this.sessionDir);
	}

	public forkFrom(sourcePath: string, cwd: string = this.cwd, options?: NewSessionOptions): SessionManager {
		return SessionManager.forkFrom(sourcePath, cwd, this.sessionDir, options);
	}

	public inMemory(cwd: string = this.cwd, options?: NewSessionOptions): SessionManager {
		return SessionManager.inMemory(cwd, options);
	}

	public async list(cwd: string = this.cwd): Promise<SessionInfo[]> {
		return SessionManager.list(cwd, this.sessionDir);
	}

	public async listAll(): Promise<SessionInfo[]> {
		return SessionManager.listAll(this.sessionDir);
	}
}
