# SessionService (`ctx.session`)

[English](session-service.md) | 中文

`SessionService` 是 Pi `SessionManager` 的 SDK 侧工厂与注册表。`create`、`open`、`forkFrom`、`inMemory`、`list`、`listAll` 均委托 Pi，并跟踪通过本服务创建的 Manager。

`close(id)` 从服务注册表移除 Manager 并广播 `pi/session-closed`；`SessionManager` 本身没有 Dispose 契约，因此这是注册表清理，不是终止交互 Agent。根 Fiber 销毁时清空注册表。

交互式 `picds` 会话由上游 Pi `main()` 所有，不会插入该注册表。存储默认遵循构造时传入的 `sessionDir`（CLI 把全局 Pi Session 目录设置在 `~/.picds/agent/sessions/`）。
