# SessionService (`ctx.session`)

English | [中文](session-service.zh.md)

`SessionService` is an SDK-side factory and registry for Pi `SessionManager` instances. It delegates `create`, `open`, `forkFrom`, `inMemory`, `list`, and `listAll` to Pi and tracks managers created through this service.

`close(id)` removes a manager from the service registry and emits `pi/session-closed`; `SessionManager` itself has no disposal contract, so this is registry cleanup rather than termination of an interactive agent. Root Fiber disposal clears the registry.

The interactive `picds` session is owned by upstream Pi `main()` and is not inserted into this registry. Session storage defaults follow the `sessionDir` passed at construction (the CLI sets the global Pi session directory under `~/.picds/agent/sessions/`).
