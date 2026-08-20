# AgentService (`ctx.agent`)

[English](agent-service.md) | 中文

`AgentService` 是 Pi-Cordis 的智能体会话编排与推理调度服务。它封装了 `@earendil-works/pi-coding-agent` 的 `AgentSession` 实例工厂与多轮推理循环，统一追踪活跃会话池，并将底层的智能体多轮会话事件桥接至 Cordis 中央事件总线。

---

## 核心机制

1. **会话编排与注入**：在创建 `AgentSession` 时，自动聚合当前 Cordis 容器中的 `SettingsService`、`AIService`、`ToolRegistryService`、`SkillsService` 与 `PromptsService`；
2. **生命周期事件双向映射**：
   - 轮次启动：触发 `pi/session-turn-start`；
   - 轮次结束：触发 `pi/session-turn-end`；
   - 模型切换：触发 `pi/model-change`；
   - 会话结束：触发 `pi/session-closed`；
3. **活跃会话池追踪**：统一管理主智能体与派生子智能体（Subagent）的生命周期。

---

## API 接口参考

### 1. `ctx.agent.createSession(options: CreateAgentSessionOptions): Promise<CreateAgentSessionResult>`
创建并初始化一个 `AgentSession` 实例，自动建立事件映射并将其加入活跃会话池追踪。
```typescript
const { session } = await ctx.agent.createSession({
    cwd: process.cwd(),
    model: activeModel,
    systemPrompt: customPrompt
});
```

### 2. `ctx.agent.getActiveSession(): AgentSession | undefined`
获取当前处于活跃状态的主智能体会话实例。

### 3. `ctx.agent.getAllSessions(): AgentSession[]`
获取当前系统中所有被追踪的活跃智能体会话列表（包含主会话与 Subagent 会话）。

---

## 广播事件 (Events)

- **`pi/session-start`**：会话启动时触发 `(session: AgentSession)`；
- **`pi/session-turn-start`**：单轮推理开始时触发 `{ session: AgentSession, prompt: string }`；
- **`pi/session-turn-end`**：单轮推理结束时触发 `{ session: AgentSession, response?: unknown }`；
- **`pi/session-closed`**：会话关闭时触发 `{ id: string }`；
- **`pi/model-change`**：会话内大模型切换时触发 `(model: Model<any>)`。

---

## 插件集成范例 (Plugin Example)

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "turn-timer";
export const inject = ["agent"];

export function apply(ctx: Context) {
    let startTime = 0;

    // 监控单轮耗时
    ctx.on("pi/session-turn-start", ({ prompt }) => {
        startTime = Date.now();
        console.log(`[TURN] 开始处理输入: "${prompt.slice(0, 30)}..."`);
    });

    ctx.on("pi/session-turn-end", () => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[TURN] 本轮推理耗时: ${duration}s`);
    });
}
```
