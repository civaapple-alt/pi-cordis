# AgentService (`ctx.agent`)

[English](agent-service.md) | 中文

`AgentService` 编排 `AgentSession` 实例的完整生命周期，追踪活跃会话池，并将智能体内部事件桥接至 Cordis 事件总线。

## API 接口

### `ctx.agent.createSession(options: CreateAgentSessionOptions): Promise<CreateAgentSessionResult>`
创建 `AgentSession` 实例，将其加入会话池追踪，并完整映射所有生命周期事件（`pi/session-start`、`pi/session-turn-start`、`pi/session-turn-end`、`pi/model-change`、`pi/session-closed`）。

### `ctx.agent.getActiveSession(): AgentSession | undefined`
获取当前活跃的智能体会话。

### `ctx.agent.getAllSessions(): AgentSession[]`
获取当前所有被追踪的活跃会话实例。

## 触发事件

- `pi/session-start`：`(session: AgentSession)`
- `pi/session-turn-start`：`{ session: AgentSession, prompt: string }`
- `pi/session-turn-end`：`{ session: AgentSession, response?: unknown }`
- `pi/session-closed`：`{ id: string }`
- `pi/model-change`：`(model: Model<any>)`
