# AgentService (`ctx.agent`)

[English](agent-service.md) | 中文

`AgentService` 是 `createAgentSession(options)` 的 SDK 侧所有者。调用者提供普通 Pi `CreateAgentSessionOptions`；服务不会暗中把其他 Cordis Service 拼装进这些选项。

创建的 Session 会被跟踪，其订阅事件映射为 `pi/model-change`、`pi/session-turn-start`、`pi/session-turn-end`。`closeSession(id)` 取消订阅并销毁选定 `AgentSession`；根 Fiber 销毁时清理所有由该服务创建的 Session。

`pi/session-start` 始终使用 `{ session?, sessionId?, reason? }` 信封，使 SDK 创建的 Session 与上游交互生命周期共享同一稳定事件形状。

交互 CLI 仍由上游 Pi `main()` 所有，并通过 `ExtensionService` 桥接；它不是 `AgentService.activeSession`。这种分离避免在 TUI 背后再创建第二条 Agent Loop。
