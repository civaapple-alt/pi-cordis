# Cordis 微内核架构深度剖析

[English](architecture.md) | 中文

Pi-Cordis 构建于 **Cordis v4.0.1** 控制反转（IoC）微内核元框架之上，践行“一切皆插件（Everything is a Plugin）”的设计哲学。

---

## 一、核心概念与机制

### 1. `Context`（容器上下文）
`Context` 是微内核的中央服务容器与事件总线。所有的核心能力均作为单例服务挂载在 `Context` 上：
- 通过 TypeScript 声明合并（Declaration Merging）扩充 `Context` 类型定义；
- 通过 `ctx.extend()` 派生子作用域（用于 Subagent 或临时沙箱隔离）。

### 2. `Service`（服务基类）
所有 10 大核心服务均继承自 `@deepseek-ai/cordis` 的 `Service`：
- 必须声明 `static provide = 'keyName'`；
- 构造函数调用 `super(ctx, 'keyName')` 自动将自身挂载至 `ctx.keyName`；
- 自动参与 Fiber 生命周期的激活与停用。

### 3. `Effect` 与 `Disposer`（可逆副作用）
“注册即副作用，副作用必可逆”是系统的核心公理：
- 插件的所有动态贡献必须包裹在 `this.ctx.effect()` 或 `this.ctx.on()` 中；
- 注册方法必须返回标准的 `Disposer` 函数，在 Fiber 卸载时原子性销毁，绝不残留僵尸监听器。

### 4. `EventBus`（中央事件总线）
强类型事件总线支持三种分发模式：
- **Parallel 并行广播**：`ctx.emit('event', payload)`
- **Serial 串行链式**：`ctx.serial('event', payload)`（用于安全拦截校验，任意监听器报错则中断）
- **Waterfall 瀑布管道**：`ctx.waterfall('event', value)`（用于内容转换管道）

---

## 二、4 层架构金字塔

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Level 4: 场景预设与原生插件生态 (presets/*, packages/plugins/*)        │
├────────────────────────────────────────────────────────────────────────┤
│ Level 3: Cordis 微内核控制面与服务网格 (@pi-cordis/core)               │
│   ├── 10 大核心响应式服务 (Settings, Auth, AI, Tools, Session...)      │
│   ├── 统一中央事件总线 (Central EventBus -> pi/* 响应式事件流)         │
│   └── 两阶段微内核 CLI 启动器 (picds, picordis)                        │
├────────────────────────────────────────────────────────────────────────┤
│ Level 2: 上游 Coding 场景特化层 (@earendil-works/pi-coding-agent)      │
├────────────────────────────────────────────────────────────────────────┤
│ Level 1: 上游通用 Agent 底座内核 (@earendil-works/pi-agent-core)       │
└────────────────────────────────────────────────────────────────────────┘
```
