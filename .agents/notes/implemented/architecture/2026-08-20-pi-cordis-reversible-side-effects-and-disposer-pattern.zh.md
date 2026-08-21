# Agent Note: Pi-Cordis “注册即副作用，副作用必可逆”与 Disposer 模式架构哲学

Status: implemented
Created: 2026-08-20

[English](2026-08-20-pi-cordis-reversible-side-effects-and-disposer-pattern.md) | 中文

## 摘要 (Executive Summary)

本篇架构决策记录（ADR）深入剖析了 **Cordis 微内核的核心公理 —— “注册即副作用，副作用必可逆（Registrations are Effects, and Effects must be Reversible）”** 在 `pi-cordis` 中的技术实现与系统级价值。

本文重点解答了 **“副作用必可逆与 HMR（热重载）的因果本质关系”**：副作用必可逆并非单纯为 HMR 服务，而是整个微内核平台的**底层基石（Foundation）**；它不仅赋能了代码级 HMR，还在**运行时 Profile 动态升降级、Subagent（子智能体）沙箱销毁、Plan 模式状态流转以及插件加载异常的事务回滚**等关键场景中起着决定性支撑作用。

---

## 一、核心哲学与因果辨析 (Philosophy & Causality)

### 核心论断：
> **不是因为有了 HMR 才需要副作用可逆；恰恰相反，正是因为微内核底座天然保证了“副作用必可逆”，系统才能水到渠成地实现 HMR、零重启 Profile 切换与多 Agent 动态隔离！**
> 
> **“副作用必可逆”是底层地基，“HMR”只是建在地基上的其中一座应用大厦与试金石。**

```text
                                  ┌─── 1. 运行时 Profile 动态升降级 (/profile safe -> full)
                                  │
                                  ├─── 2. Subagent (子智能体) 上下文隔离与生命周期销毁
【底座: 副作用必可逆 (Disposer)】 ────┼─── 3. Plan 模式 (只读规划模式 -> 执行模式平滑切换)
                                  │
                                  ├─── 4. 插件加载异常时的事务级原子回滚 (Rollback)
                                  │
                                  └─── 5. 开发者体验: 源码级热重载 (HMR)
```

---

## 二、脱离 HMR 依然刚需“副作用可逆”的 4 大核心场景

在没有代码修改或 HMR 的日常生产环境中，副作用可逆依然在维持系统的纯净与稳定：

### 1. 运行时权限与策略动态升降级（Profile Switching）
- **场景**：用户在终端审查一段外部不可信代码，输入 `/profile strict`（开启只读审计，拦截所有写入与 Bash 命令）；审查完成后输入 `/profile default` 恢复编码。
- **不可逆系统的后果**：`strict` 模式注册的高危拦截监听器永久残留在内存中，切回 `default` 依然无法执行写入，用户被迫退出重启进程；
- **可逆微内核的解法**：`strict` 插件通过 `fork.dispose()` 瞬间将拦截器注销，权限无缝还原。

### 2. Subagent（子智能体）沙箱隔离与销毁
- **场景**：主智能体派生一个轻量级子智能体（Subagent）执行独立的测试或搜索任务。
- **不可逆系统的后果**：子智能体注册的专用工具与事件监听器泄漏到主上下文，造成严重的上下文污染（Context Pollution）与工具混淆；
- **可逆微内核的解法**：子智能体运行在独立的 `ctx.fork()` 作用域内，任务完成后调用 `subagentScope.dispose()`，所有临时资源被原子性清空，主上下文保持纯净。

### 3. Plan 模式与 Normal 模式的状态流转
- **场景**：用户在 TUI 中切换 `/plan` 会话策略；根作用域 Plan Fiber 与稳定的 `exit_plan_mode` Schema 始终保持挂载。
- **可逆微内核的解法**：用户审批规划后，Plan 插件被安全注销，正常编码工具立即恢复，状态流转零残留。

### 4. 插件加载异常时的“事务级原子回滚”（Atomic Rollback）
- **场景**：插件在 `apply(ctx)` 中注册了 2 个工具，但在注册第 3 个工具时发生未捕获异常。
- **可逆微内核的解法**：Cordis 自动捕获异常并**按逆序执行前 2 个工具的 Disposer**，将系统状态完全还原到加载之前的干净状态，防止系统处于“半加载半损坏”的脏状态。

---

## 三、Pi-Cordis 中可逆副作用的落地机制

### 1. 底座 Service 规范：注册必须返回 Disposer
所有底层服务在提供注册接口时，均遵循返回可执行销毁函数的规范：
```typescript
// ToolRegistryService: 工具注册返回销毁函数
public register(tool: ToolDef): () => void {
  this.customTools.set(tool.name, tool);
  return () => {
    this.customTools.delete(tool.name);
  };
}

// Cordis EventBus: 事件监听返回注销函数
const disposer = ctx.on("pi/tool-call", handler);
```

### 2. 原生插件的生命周期闭环
在 [`packages/plugins/*`](file:///D:/gh-ws/dsh-ws/pi-cordis/packages/plugins/) 中：
- **`safety-gate`**：注销时自动清除 `pi/tool-call` 拦截监听器；
- **`todo-tracker`**：注销时自动从 `ctx.tools` 工具池移除 `todo_write`/`todo_read`，并停止向 System Prompt 注入待办；
- **`git-guard`**：注销时自动停止创建 Git 检查点；
- **`rules-injector`**：注销时自动停止注入 `AGENTS.md` 规则。

---

## 四、传统架构 vs 可逆微内核架构对比矩阵

| 架构维度 | 传统不可逆系统（普通脚本/CLI） | Pi-Cordis（Cordis 可逆微内核） |
| :--- | :--- | :--- |
| **模式/预设切换** | ❌ 无法动态切换，必须退出并重启整个 CLI 进程 | ✅ `/profile` 随时无感切换，旧插件零逻辑残留 |
| **多 Agent 派生** | ❌ 全局变量污染、工具命名冲突、内存泄漏 | ✅ `ctx.fork()` 专属生命周期沙箱，用完即销毁 |
| **插件加载故障** | ❌ 产生脏状态，系统可能崩溃或处于不一致状态 | ✅ 自动逆向执行 Disposer，实现事务级一致性回滚 |
| **代码热重载 (HMR)** | ❌ 无法安全重载（会导致工具重复注册与事件累加） | ✅ 基于 `dispose()` 天然水到渠成，内存永远只有 1 份最新实例 |
| **长期运行内存** | ❌ 随着切换和插件加载，内存持续上涨（资源泄漏） | ✅ 垃圾回收器（GC）可干净回收已注销对象 |

---

## 结论 (Consequences)

1. **确定了微内核工程的质量底线**：在 `pi-cordis` 中，任何新增服务与插件必须提供完备的 Disposer 逆向清理逻辑；
2. **消除了状态污染隐患**：杜绝了僵尸监听器（Zombie Listeners）与工具重复注册（Duplicate Tools）；
3. **为高级多 Agent 协同奠定了基础**：使得未来派生任意深度的子智能体树（Subagent Tree）并在任务完成后优雅回收成为可能。
