import { Service, type Context } from "@deepseek-ai/cordis";
import { AgentSession } from "../../agent-session.ts";
import { createAgentSession, type CreateAgentSessionOptions, type CreateAgentSessionResult } from "../../sdk.ts";

export class AgentService extends Service {
	static provide = "agent";
	public activeSession?: AgentSession;

	constructor(ctx: Context) {
		super(ctx, "agent");
	}

	public async createSession(options: CreateAgentSessionOptions): Promise<CreateAgentSessionResult> {
		const result = await createAgentSession(options);
		this.activeSession = result.session;

		// Emit Cordis lifecycle events
		this.ctx.emit("pi/session-start", result.session);

		// Hook into session event emitter to propagate to Cordis events
		(result.session as any).on?.("model_change", (event: any) => {
			if (event?.model) {
				this.ctx.emit("pi/model-change", event.model);
			}
		});

		return result;
	}

	public getActiveSession(): AgentSession | undefined {
		return this.activeSession;
	}
}
