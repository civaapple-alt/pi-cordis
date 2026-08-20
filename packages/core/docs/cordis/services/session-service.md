# SessionService (`ctx.session`)

English | [中文](session-service.zh.md)

`SessionService` serves as the session factory and manager, tracking active session instances, in-memory sessions, session forking, and session lifecycle events.

## API Reference

### `ctx.session.create(cwd?: string, options?: NewSessionOptions): SessionManager`
Creates a new persistent session file and tracks it. Emits `pi/session-created`.

### `ctx.session.open(path: string): SessionManager`
Opens an existing session file. Emits `pi/session-created`.

### `ctx.session.forkFrom(sourcePath: string, cwd?: string, options?: NewSessionOptions): SessionManager`
Forks a new session from an existing source session. Emits `pi/session-forked`.

### `ctx.session.inMemory(cwd?: string, options?: NewSessionOptions): SessionManager`
Creates a fast, non-persisted in-memory session. Emits `pi/session-created`.

### `ctx.session.close(id: string): boolean`
Closes and un-tracks a session instance. Emits `pi/session-closed`.

### `ctx.session.getActiveSessions(): SessionManager[]`
Returns all currently tracked active session instances.

## Events Emitted

- `pi/session-created`: `{ session: SessionManager, cwd: string }`
- `pi/session-forked`: `{ session: SessionManager, sourcePath: string }`
- `pi/session-closed`: `{ id: string }`
