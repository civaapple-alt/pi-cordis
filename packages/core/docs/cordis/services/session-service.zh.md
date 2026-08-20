# SessionService (`ctx.session`)

[English](session-service.md) | 中文

`SessionService` 是 Pi-Cordis 的会话工厂与生命周期管理器，负责底层会话的持久化、SQLite/JSON 存储、分支树管理、内存隔离会话创建，并在中央 Cordis 事件总线上广播会话全生命周期事件。

---

## 核心机制与隔离策略

- **持久化目录**：`~/.picds/agent/sessions/`（与原生 `~/.pi/agent/sessions/` 物理隔离）；
- **会话树与派生 (Branching & Fork)**：支持从任意历史节点派生新分支（Fork），保留完整的上下文脉络；
- **内存隔离会话 (`inMemory`)**：专门用于子智能体（Subagent）或临时沙箱任务，快速不落盘，任务结束直接随内存回收。

---

## API 接口参考

### 1. `ctx.session.create(cwd?: string, options?: any): SessionManager`
创建并追踪一个新的持久化会话实例。触发 `pi/session-created` 事件。

### 2. `ctx.session.open(path: string): SessionManager`
打开磁盘上已存在的会话文件。触发 `pi/session-created` 事件。

### 3. `ctx.session.forkFrom(sourcePath: string, cwd?: string, options?: any): SessionManager`
从指定的历史会话文件派生（Fork）一个全新分支。触发 `pi/session-forked` 事件。

### 4. `ctx.session.inMemory(cwd?: string, options?: any): SessionManager`
创建快速、不落盘的内存会话。非常适合 Subagent 执行短期子任务。
```typescript
const tempSession = ctx.session.inMemory(process.cwd());
```

### 5. `ctx.session.close(id: string): boolean`
关闭并注销指定的会话追踪。触发 `pi/session-closed` 事件。

### 6. `ctx.session.getActiveSessions(): SessionManager[]`
获取当前内存中追踪的所有活跃会话实例列表。

### 7. `ctx.session.getSession(id: string): SessionManager | undefined`
根据会话 ID 检索特定的活跃会话。

---

## 广播事件 (Events)

- **`pi/session-created`**：当新会话被创建或打开时触发 `{ session: SessionManager, cwd: string }`；
- **`pi/session-forked`**：当会话被派生时触发 `{ session: SessionManager, sourcePath: string }`；
- **`pi/session-closed`**：当会话被关闭时触发 `{ id: string }`。

---

## 插件集成范例 (Subagent 内存隔离)

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "subagent-runner";
export const inject = ["session", "agent"];

export function apply(ctx: Context) {
    // 派生独立子智能体，使用内存隔离会话
    async function runSubagentTask(prompt: string) {
        const memSession = ctx.session.inMemory();
        // 执行独立推理循环，不污染主会话磁盘历史
    }
}
```
