# AgentService (`ctx.agent`)

English | [中文](agent-service.zh.md)

`AgentService` orchestrates agent sessions and multi-turn inference loops in Pi-Cordis. Wrapping `@earendil-works/pi-coding-agent`'s `AgentSession` factory, it tracks the active session pool and bridges underlying session lifecycle events to the central Cordis EventBus.

---

## Core Capabilities

1. **Session Assembly & Injection**: Automatically aggregates `SettingsService`, `AIService`, `ToolRegistryService`, `SkillsService`, and `PromptsService` when constructing an `AgentSession`;
2. **Two-Way Lifecycle Event Mapping**:
   - Turn Start: Emits `pi/session-turn-start`;
   - Turn End: Emits `pi/session-turn-end`;
   - Model Switch: Emits `pi/model-change`;
   - Session Close: Emits `pi/session-closed`;
3. **Active Session Pool Tracking**: Manages the lifecycle of both the primary agent and derived subagent sessions.

---

## API Reference

### 1. `ctx.agent.createSession(options: CreateAgentSessionOptions): Promise<CreateAgentSessionResult>`
Creates and initializes an `AgentSession` instance, setting up event bridging and registering it in the active session pool.
```typescript
const { session } = await ctx.agent.createSession({
    cwd: process.cwd(),
    model: activeModel,
    systemPrompt: customPrompt
});
```

### 2. `ctx.agent.getActiveSession(): AgentSession | undefined`
Returns the currently active primary agent session.

### 3. `ctx.agent.getAllSessions(): AgentSession[]`
Returns all tracked active session instances across the entire system.

---

## Events Emitted

- **`pi/session-start`**: `(session: AgentSession)`
- **`pi/session-turn-start`**: `{ session: AgentSession, prompt: string }`
- **`pi/session-turn-end`**: `{ session: AgentSession, response?: unknown }`
- **`pi/session-closed`**: `{ id: string }`
- **`pi/model-change`**: `(model: Model<any>)`

---

## Plugin Integration Example

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "turn-timer";
export const inject = ["agent"];

export function apply(ctx: Context) {
    let startTime = 0;

    ctx.on("pi/session-turn-start", ({ prompt }) => {
        startTime = Date.now();
        console.log(`[TURN] Processing prompt: "${prompt.slice(0, 30)}..."`);
    });

    ctx.on("pi/session-turn-end", () => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[TURN] Inference turn completed in: ${duration}s`);
    });
}
```
