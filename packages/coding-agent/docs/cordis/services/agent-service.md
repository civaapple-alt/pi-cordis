# AgentService (`ctx.agent`)

English | [中文](agent-service.zh.md)

`AgentService` orchestrates the lifecycle of `AgentSession` instances, tracks the active session, and bridges internal session events to the Cordis event bus.

## API Reference

### `ctx.agent.createSession(options: CreateAgentSessionOptions): Promise<CreateAgentSessionResult>`
Creates an `AgentSession` instance, tracks it in the session pool, and maps all lifecycle events (`pi/session-start`, `pi/session-turn-start`, `pi/session-turn-end`, `pi/model-change`, `pi/session-closed`).

### `ctx.agent.getActiveSession(): AgentSession | undefined`
Returns the currently active agent session.

### `ctx.agent.getAllSessions(): AgentSession[]`
Returns all tracked active session instances.

## Events Emitted

- `pi/session-start`: `(session: AgentSession)`
- `pi/session-turn-start`: `{ session: AgentSession, prompt: string }`
- `pi/session-turn-end`: `{ session: AgentSession, response?: unknown }`
- `pi/session-closed`: `{ id: string }`
- `pi/model-change`: `(model: Model<any>)`
