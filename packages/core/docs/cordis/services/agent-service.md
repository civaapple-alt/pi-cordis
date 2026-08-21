# AgentService (`ctx.agent`)

English | [中文](agent-service.zh.md)

`AgentService` is an SDK-side owner for `createAgentSession(options)`. The caller supplies ordinary Pi `CreateAgentSessionOptions`; the service does not implicitly assemble the other Cordis services into those options.

Created sessions are tracked, their subscription events are mapped to `pi/model-change`, `pi/session-turn-start`, and `pi/session-turn-end`, and `closeSession(id)` unsubscribes and disposes the selected `AgentSession`. Root Fiber disposal unsubscribes and disposes every session created through the service.

`pi/session-start` always uses an envelope (`{ session?, sessionId?, reason? }`) so SDK-created sessions and upstream interactive lifecycle events share one stable event shape.

The interactive CLI remains owned by upstream Pi `main()` and is bridged through `ExtensionService`; it is not `AgentService.activeSession`. This separation prevents a second agent loop from being created behind the TUI.
