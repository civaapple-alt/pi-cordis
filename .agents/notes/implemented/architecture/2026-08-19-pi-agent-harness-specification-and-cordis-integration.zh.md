# Agent Note: Pi AgentHarness 工业级事务规格与 Cordis 微内核架构融合

Status: implemented
Created: 2026-08-19

[English](2026-08-19-pi-agent-harness-specification-and-cordis-integration.md) | 中文

## 摘要 (Executive Summary)

本篇架构决策记录（ADR）深度解析了 Pi 原生在 `packages/agent/docs/harness.md` 中提出的 **`AgentHarness` 工业级会话事务运行时规格说明书**，并系统阐述了其如何与 **Cordis (v4.0.1) 微内核体系**进行深度融合：
1. **三存储模型（The Three Stores）**：`entries`（不可变树）、`registers`（可变状态/程序计数器）、`usage ledger`（追加只写账本）；
2. **副作用三明治（The Effect Sandwich）**：`Intent -> Effect -> Settlement` 双阶段事务提交与非安全重放（`replay: "never"`）崩溃容灾机制；
3. **多车道体系（Lanes）**：基于共享不可变树实现子任务、Slack 线程与 Subagent 的零冗余并发会话；
4. **Cordis 微内核控制面映射**：如何将底层的 `Storage` 与 `Operations` 封装为 `ctx.session` 与 `ctx.agent` 核心服务。

---

## 一、Pi AgentHarness 核心规格深度解构

```text
                                AgentHarness 系统全景
  ┌───────────────────────────────────────────────────────────────────────────┐
  │ 1. Harness & Operations (控制面与状态机)                                  │
  │    • Drives Lanes / Runs Assistant / Tools Execution / Checkpoint         │
  │    • Durable Program Counter (op.state/{opId})                            │
  ├───────────────────────────────────────────────────────────────────────────┤
  │ 2. Session & Conversation Tree (会话树模型)                               │
  │    • Entry Tree (Message / Compaction / BranchSummary / Custom)           │
  │    • Lanes (Named Cursors, e.g. main, slack:thread_1, subagent:worker_2)   │
  │    • Facts (Namespaced Key-Value metadata)                                │
  ├───────────────────────────────────────────────────────────────────────────┤
  │ 3. Storage Layer (底层三存储模型)                                          │
  │    • entries (只增不减会话树)                                               │
  │    • registers (当前可变状态与程序计数器)                                  │
  │    • usage ledger (追加只写 Token 成本账本)                                │
  └───────────────────────────────────────────────────────────────────────────┘
```

### 1. 三大存储模型（The Three Stores）
所有持久化数据严格归入三类，绝无第四种存储：
- **`entries`（会话树）**：**Write-once, Append-only**。一旦写入绝不修改、绝不物理删除。包含消息（`message`）、压缩快照（`compaction`）、分支摘要（`branch_summary`）与自定义实体（`custom`）；
- **`registers`（状态寄存器）**：**Namespaced Typed Cells**。系统唯一的当前可变状态存储区。
  - `lane.leaf`：当前车道所在的分支叶子节点；
  - `op.state`：**运行状态机的持久化程序计数器（Program Counter）**；
  - `op.tool_args`：暂存的工具参数；
  - `pending.entry`：队列中待放置的暂存消息；
- **`usage ledger`（Token 成本账本）**：**Append-only Rows**。记录每一次 LLM 调用的 Token 消耗与成本，即便操作 Abort 中断，账本数据依然永久留存。

---

### 2. 副作用三明治模式（The Effect Sandwich）
针对 LLM 流式输出中途断网、工具执行破坏性命令（如删除文件）中途掉电的极端场景，Harness 建立了双阶段提交机制：

```text
  Commit 1 (Intent 意图提交):  "准备执行工具 X，已预留结果 entry_id = n3, usage_id = u1"
              ↓
  Do Effect (真实外部调用):    执行模型推理 / 运行文件删除或 Shell 脚本 (唯一的未决窗口)
              ↓
  Commit 2 (Settlement 结算):  写入工具结果 entry_n3 + 账本 u1 + 更新 op.state
```

* **崩溃恢复策略（Recovery Policy）**：
  - 若进程在 `Do Effect` 期间崩溃，重启时 Harness 仅需读取 `op.state` 寄存器：
  - **`replay: "safe"`（只读操作）**：重新执行该工具；
  - **`replay: "never"`（破坏性操作）**：**绝不重新执行**，而是自动写入一条“执行中断”的合成结果（Synthetic Interrupted Result），确保会话树闭合且绝无二次破坏。

---

### 3. 多车道体系（Lanes Concurrency）
* 一个 Session 内部不仅有 `main` 主车道，还可以为 Slack 线程、Subagent 任务创建独立的 **Lane**；
* 所有 Lane 共享底层的不可变历史 Entry 树，各自持有独立的叶子节点游标（`lane.leaf`）与推理状态机，实现**零冗余开销的并发多 Agent 共享记忆**。

---

### 4. 存储后端（Storage Backends）
* **Memory**：纯内存 Map，适用于单元测试；
* **JSONL (v4 格式)**：以 Replay Recipe 形式追加记录，具备基于快照压缩（Snapshot Compaction）的物理垃圾清理能力；
* **SQLite**：**一个 Session 一个 `.sqlite` 文件**，全面采用 `BEGIN IMMEDIATE` 防止死锁升级，并通过 `writer_lease` 实现单进程排他租约。

---

## 二、Pi-Cordis 与 AgentHarness 的微内核融合蓝图

Pi 原生的 `AgentHarness` 与 Cordis 微内核并非竞争关系，而是**极致互补的数据面与控制面关系**：

```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │         Cordis 微内核控制面 (Control Plane: packages/.../src/core/cordis)│
  │  Context / IoC 容器 / static provide / 生命周期事件 / 插件扩展机制       │
  └──────────────────┬──────────────────────────────────┬──────────────────┘
                     │                                  │
      ┌──────────────▼─────────────┐      ┌─────────────▼──────────────┐
      │  SessionService (服务封装) │      │  AgentService (调度封装)   │
      │  (ctx.session: Storage)    │      │  (ctx.agent: Harness/Lanes)│
      └──────────────┬─────────────┘      └─────────────┬──────────────┘
                     │                                  │
  ┌──────────────────▼──────────────────────────────────▼──────────────────┐
  │         AgentHarness 工业级数据面 (Data Plane & State Machine)         │
  │  Three Stores (entries/registers/ledger) / Effect Sandwich / Lanes     │
  └────────────────────────────────────────────────────────────────────────┘
```

1. **`SessionService` (`ctx.session`)**：将底层的 `Storage`（SQLite / JSONL）以及 `SessionTree` 封装为标准的 Cordis 服务，向上提供事务提交、分支查询与事实注册接口；
2. **`AgentService` (`ctx.agent`)**：将 `Harness` 的多 Lane 调度、程序计数器驱动与崩溃恢复封装为智能体服务；
3. **事件总线与拦截器融合**：Cordis 插件可以通过 `ctx.on("pi/tool-call")` 或 `ctx.on("pi/session-before")` 无缝接入 Harness 的 `Effect Sandwich` 意图提交与结算生命周期中。

---

## 三、结论与架构意义

1. **工业级鲁棒性**：借助 `AgentHarness` 的三存储模型与 Effect Sandwich，`pi-cordis` 拥有了业界顶级的容灾与崩溃恢复能力；
2. **微内核解耦灵活性**：借助 Cordis v4.0.1，所有 Harness 状态机能力均可被外部插件监听、增强与拦截，达成了“底层坚如磐石，上层灵活多变”的完美架构平衡。
