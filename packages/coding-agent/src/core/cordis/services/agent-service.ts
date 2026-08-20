import { Service, type Context } from "@deepseek-ai/cordis";
import { AgentSession } from "../../agent-session.ts";
import { createAgentSession, type CreateAgentSessionOptions, type CreateAgentSessionResult } from "../../sdk.ts";

export class AgentService extends Service {
	static provide = "agent";
	public activeSession?: AgentSession;
	public allSessions: Map<string, AgentSession> = new Map();

	constructor(ctx: Context) {
		super(ctx, "agent");
	}

	public async createSession(options: CreateAgentSessionOptions): Promise<CreateAgentSessionResult> {
		const result = await createAgentSession(options);
		const session = result.session;
		this.activeSession = session;

		const sessionId = (session as any).sessionId ?? (session as any).id ?? `session_${Date.now()}`;
		this.allSessions.set(sessionId, session);

		// Emit Cordis lifecycle events
		this.ctx.emit("pi/session-start", session);

		// Hook into session event emitter to propagate to Cordis events
		(session as any).on?.("model_change", (event: any) => {
			if (event?.model) {
				this.ctx.emit("pi/model-change", event.model);
			}
		});

		(session as any).on?.("turn_start", (event: any) => {
			this.ctx.emit("pi/session-turn-start", { session, prompt: event?.prompt ?? "" });
		});

		(session as any).on?.("turn_end", (event: any) => {
			this.ctx.emit("pi/session-turn-end", { session, response: event?.response });
		});

		(session as any).on?.("close", () => {
			this.allSessions.delete(sessionId);
			this.ctx.emit("pi/session-closed", { id: sessionId });
		});

		return result;
	}

	public getActiveSession(): AgentSession | undefined {
		return this.activeSession;
	}

	public getAllSessions(): AgentSession[] {
		return Array.from(this.allSessions.values());
	}
}

export default AgentService;
