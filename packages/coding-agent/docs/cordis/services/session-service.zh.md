# SessionService (`ctx.session`)

[English](session-service.md) | 中文

`SessionService` 作为会话工厂与生命周期管理器，负责追踪当前活跃的会话实例、内存会话、会话派生（Fork）以及会话生命周期事件。

## API 接口

### `ctx.session.create(cwd?: string, options?: NewSessionOptions): SessionManager`
创建并追踪一个新的持久化会话。广播 `pi/session-created`。

### `ctx.session.open(path: string): SessionManager`
打开已存在的会话文件。广播 `pi/session-created`。

### `ctx.session.forkFrom(sourcePath: string, cwd?: string, options?: NewSessionOptions): SessionManager`
基于已有会话文件派生（Fork）新会话。广播 `pi/session-forked`。

### `ctx.session.inMemory(cwd?: string, options?: NewSessionOptions): SessionManager`
创建快速、不落盘的内存会话。广播 `pi/session-created`。

### `ctx.session.close(id: string): boolean`
关闭并移除会话追踪。广播 `pi/session-closed`。

### `ctx.session.getActiveSessions(): SessionManager[]`
获取当前内存中追踪的所有活跃会话实例。

## 触发事件

- `pi/session-created`：`{ session: SessionManager, cwd: string }`
- `pi/session-forked`：`{ session: SessionManager, sourcePath: string }`
- `pi/session-closed`：`{ id: string }`
