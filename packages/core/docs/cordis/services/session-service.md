# SessionService (`ctx.session`)

English | [中文](session-service.zh.md)

`SessionService` acts as the session factory and lifecycle manager in Pi-Cordis. It handles session persistence, SQLite/JSON tree management, in-memory ephemeral sessions, and emits lifecycle events on the Cordis EventBus.

---

## Storage & Isolation Strategy

- **Persistence Directory**: `~/.picds/agent/sessions/` (isolated from `~/.pi/agent/sessions/`);
- **Session Trees & Branching**: Supports branching and forking from any historical checkpoint;
- **In-Memory Sessions (`inMemory`)**: Ephemeral, unpersisted sessions designed for subagent tasks with zero disk overhead.

---

## API Reference

### 1. `ctx.session.create(cwd?: string, options?: any): SessionManager`
Creates and tracks a new persistent session. Emits `pi/session-created`.

### 2. `ctx.session.open(path: string): SessionManager`
Opens an existing session file from disk. Emits `pi/session-created`.

### 3. `ctx.session.forkFrom(sourcePath: string, cwd?: string, options?: any): SessionManager`
Forks a new session branch from an existing session file. Emits `pi/session-forked`.

### 4. `ctx.session.inMemory(cwd?: string, options?: any): SessionManager`
Creates a fast in-memory session. Ideal for isolated subagent execution.
```typescript
const tempSession = ctx.session.inMemory(process.cwd());
```

### 5. `ctx.session.close(id: string): boolean`
Closes and unregisters a tracked session. Emits `pi/session-closed`.

### 6. `ctx.session.getActiveSessions(): SessionManager[]`
Returns all currently tracked active session instances.

### 7. `ctx.session.getSession(id: string): SessionManager | undefined`
Retrieves a specific active session by ID.

---

## Events Emitted

- **`pi/session-created`**: `{ session: SessionManager, cwd: string }`
- **`pi/session-forked`**: `{ session: SessionManager, sourcePath: string }`
- **`pi/session-closed`**: `{ id: string }`

---

## Plugin Integration Example

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "subagent-runner";
export const inject = ["session", "agent"];

export function apply(ctx: Context) {
    async function runSubagentTask(prompt: string) {
        const memSession = ctx.session.inMemory();
        // Run isolated task without polluting main session history
    }
}
```
