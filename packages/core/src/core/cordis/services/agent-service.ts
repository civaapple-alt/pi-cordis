import { Service, type Context } from "@deepseek-ai/cordis";
import { AgentSession, createAgentSession, type CreateAgentSessionOptions, type CreateAgentSessionResult } from "@earendil-works/pi-coding-agent";

export class AgentService extends Service {
	static provide = "agent";
	public activeSession?: AgentSession;
	public allSessions: Map<string, AgentSession> = new Map();
	private sessionUnsubscribers = new Map<string, () => void>();

	constructor(ctx: Context) {
		super(ctx, "agent");
		this.ctx.effect(() => () => {
			for (const unsubscribe of this.sessionUnsubscribers.values()) unsubscribe();
			for (const session of this.allSessions.values()) session.dispose();
			this.sessionUnsubscribers.clear();
			this.allSessions.clear();
			this.activeSession = undefined;
		});
	}

	public async createSession(options: CreateAgentSessionOptions): Promise<CreateAgentSessionResult> {
		const result = await createAgentSession(options);
		const session = result.session;
		this.activeSession = session;

		const sessionId = (session as any).sessionId ?? (session as any).id ?? `session_${Date.now()}`;
		this.allSessions.set(sessionId, session);

		// Emit Cordis lifecycle events
		this.ctx.emit("pi/session-start", { session, sessionId });

		const unsubscribe = session.subscribe((event: any) => {
			if (event.type === "model_change" && event.model) {
				this.ctx.emit("pi/model-change", event.model);
			} else if (event.type === "turn_start") {
				this.ctx.emit("pi/session-turn-start", { session, prompt: event.prompt ?? "" });
			} else if (event.type === "turn_end") {
				this.ctx.emit("pi/session-turn-end", { session, response: event.message ?? event.response });
			}
		});
		this.sessionUnsubscribers.set(sessionId, unsubscribe);

		return result;
	}

	public getActiveSession(): AgentSession | undefined {
		return this.activeSession;
	}

	public getAllSessions(): AgentSession[] {
		return Array.from(this.allSessions.values());
	}

	/** Dispose a managed agent session and detach all Cordis event bridges. */
	public closeSession(id: string): boolean {
		const session = this.allSessions.get(id);
		if (!session) return false;
		this.sessionUnsubscribers.get(id)?.();
		this.sessionUnsubscribers.delete(id);
		session.dispose();
		this.allSessions.delete(id);
		if (this.activeSession === session) this.activeSession = undefined;
		this.ctx.emit("pi/session-closed", { id });
		return true;
	}
}

export default AgentService;
