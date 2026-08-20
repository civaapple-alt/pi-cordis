import { Service, type Context } from "@deepseek-ai/cordis";
import { SessionManager, type NewSessionOptions, type SessionInfo } from "@earendil-works/pi-coding-agent";

export interface SessionServiceConfig {
	cwd?: string;
	sessionDir?: string;
}

export class SessionService extends Service {
	static provide = "session";
	private cwd: string;
	private sessionDir?: string;
	private activeSessions: Map<string, SessionManager> = new Map();

	constructor(ctx: Context, config?: SessionServiceConfig) {
		super(ctx, "session");
		this.cwd = config?.cwd ?? process.cwd();
		this.sessionDir = config?.sessionDir;
	}

	public create(cwd: string = this.cwd, options?: NewSessionOptions): SessionManager {
		const session = SessionManager.create(cwd, this.sessionDir, options);
		const id = session.getSessionId?.() ?? `session_${Date.now()}`;
		this.activeSessions.set(id, session);
		this.ctx.emit("pi/session-created", { session, cwd });
		return session;
	}

	public open(path: string): SessionManager {
		const session = SessionManager.open(path, this.sessionDir);
		const id = session.getSessionId?.() ?? path;
		this.activeSessions.set(id, session);
		this.ctx.emit("pi/session-created", { session, cwd: this.cwd });
		return session;
	}

	public forkFrom(sourcePath: string, cwd: string = this.cwd, options?: NewSessionOptions): SessionManager {
		const session = SessionManager.forkFrom(sourcePath, cwd, this.sessionDir, options);
		const id = session.getSessionId?.() ?? `fork_${Date.now()}`;
		this.activeSessions.set(id, session);
		this.ctx.emit("pi/session-forked", { session, sourcePath });
		return session;
	}

	public inMemory(cwd: string = this.cwd, options?: NewSessionOptions): SessionManager {
		const session = SessionManager.inMemory(cwd, options);
		const id = session.getSessionId?.() ?? `mem_${Date.now()}`;
		this.activeSessions.set(id, session);
		this.ctx.emit("pi/session-created", { session, cwd });
		return session;
	}

	public close(id: string): boolean {
		if (this.activeSessions.has(id)) {
			this.activeSessions.delete(id);
			this.ctx.emit("pi/session-closed", { id });
			return true;
		}
		return false;
	}

	public getActiveSessions(): SessionManager[] {
		return Array.from(this.activeSessions.values());
	}

	public async list(cwd: string = this.cwd): Promise<SessionInfo[]> {
		return SessionManager.list(cwd, this.sessionDir);
	}

	public async listAll(): Promise<SessionInfo[]> {
		return SessionManager.listAll(this.sessionDir);
	}
}

export default SessionService;
