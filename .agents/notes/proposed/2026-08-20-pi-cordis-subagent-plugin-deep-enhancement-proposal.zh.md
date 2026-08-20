# Agent Note: 基于极简哲学的 Pi-Cordis 原生 Subagent 插件精准增强提案

Status: proposed
Created: 2026-08-20

[English](2026-08-20-pi-cordis-subagent-plugin-deep-enhancement-proposal.md) | 中文

## 摘要 (Executive Summary)

本提案立足于 **Pi 极简设计哲学（Minimalist Philosophy & Default is Best）**，对 `pi-cordis` 内置的 `@pi-cordis/plugin-subagent` 插件进行精准、高性价比的架构增强。

在深入对比社区 130+ 源码文件的重型扩展 [`pi-subagents`](https://github.com/nicobailon/pi-subagents) 后，本提案明确**拒绝在内置包中盲目重造一个复杂的巨石系统（如独立的 Git Worktree 复杂克隆、Intercom 专用通道协议等）**，而是秉持“少即是多”原则，直击多智能体委派的 **2 大本质痛点** 进行原地精准增强：
1. **独立会话隔离 (`ctx.session.create()`)**：子智能体使用独立的会话状态树与上下文窗口，执行完毕后仅回传总结，彻底保护主会话上下文；
2. **轻量角色与工具权限切片 (Role Tool Slicing)**：利用现有 `ctx.tools` 原生机制，为 `scout`（只读侦察）与 `worker`（编码实施）进行工具权限裁切。

---

## 一、极简审视：拒绝盲目复刻巨石系统 (Anti-Overengineering)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                     极简哲学 vs 重型复刻 对比审视                      │
├────────────────────────────────────────────────────────────────────────┤
│ ❌ 重型复刻误区 : 在内置插件中手写 130+ 文件的复杂状态机、Worktree 克隆、│
│                   专有 Intercom 通信协议（造成代码急剧膨胀，与生态重复）│
│                                                                        │
│ ✅ 极简主义解法 : 1. 生态交给市场：用户若需要重型舰队，可直接一行安装    │
│                      pnpm pi install npm:pi-subagents 无缝运行；        │
│                   2. 内置聚焦本质：在现有 packages/plugins/subagent 中  │
│                      通过 30 行以内优雅代码，解决上下文隔离与权限切片。 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 二、原地精准增强方案 (Lean Enhancement Blueprint)

### 1. 会话级物理隔离 (`SessionManager` 绑定)
- **痛点**：当前 `subagent` 插件仅使用 `ctx.extend()` 内存分支，若子任务执行多轮调用，可能会让父会话感知混乱；
- **极简改造**：
  ```typescript
  // 在 packages/plugins/subagent/src/index.ts 中
  const subSession = ctx.session.create(cwd, { title: `Subagent: ${args.task}` });
  try {
    // 驱动子会话独立执行推理循环
    const result = await subSession.runTask(args.task, { allowedTools });
    return { success: true, summary: result.summary, deliverables: result.deliverables };
  } finally {
    ctx.session.close(subSession.id);
  }
  ```
- **价值**：子会话产生的大量 Token 消耗、探索日志与中间状态全留在子会话中，主会话只接收提炼后的 Markdown 交付物，**节约 80%+ 核心上下文**。

---

### 2. 轻量角色与工具权限切片 (Role-Based Tool Slicing)
无需复杂的外部 Markdown DSL，在插件内部原生支持两个高频核心场景：
- **`scout` / `researcher` (只读侦察角色)**：
  - 仅暴露只读工具：`['read', 'grep', 'find', 'ls']`，禁止任何写文件和高危命令；
- **`worker` / `implementer` (实施角色)**：
  - 暴露标准编码工具：`['read', 'write', 'edit', 'bash']`。

---

## 三、工具接口设计 (Lean Tool Signature)

```typescript
export interface SubagentParams {
  /** 任务目标描述 (必填) */
  task: string;
  /** 角色类型: 'scout' (只读侦察) | 'worker' (编码实施) | 'reviewer' (代码审查) */
  role?: "scout" | "worker" | "reviewer";
  /** 附加背景上下文与路径限制 */
  context?: string;
  /** 超时毫秒数 (默认 60000ms) */
  timeoutMs?: number;
}
```

---

## 四、收益与架构价值 (Consequences & Benefits)

1. **极小代码增量 (< 50 行)**：在保持 `packages/plugins/subagent` 极简纯净的同时，完整获得核心多智能体能力；
2. **零上下文污染**：彻底杜绝子任务的冗长输出对主会话上下文的挤占；
3. **生态友好**：与第三方重型扩展 `pi-subagents` 保持互补共存，不破坏 Pi-Cordis 的轻量灵魂。
