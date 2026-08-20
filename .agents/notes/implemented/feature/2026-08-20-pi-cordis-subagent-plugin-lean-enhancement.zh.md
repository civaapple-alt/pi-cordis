# Agent Note: 基于极简哲学的 Pi-Cordis 原生 Subagent 插件精准增强实现

Status: implemented
Created: 2026-08-20

[English](2026-08-20-pi-cordis-subagent-plugin-lean-enhancement.md) | 中文

## 摘要 (Executive Summary)

本决策记录确立并交付了针对 `@pi-cordis/plugin-subagent` 插件的极简精准架构增强。

在深入对比社区 130+ 源码文件的重型扩展 `pi-subagents` 后，明确**拒绝在内置插件中盲目复刻巨石系统**，而是秉持“少即是多”原则，以不到 50 行的代码增量原地落地了多智能体委派的 **2 大本质能力**：
1. **独立物理会话隔离 (`ctx.session.inMemory()`)**：子智能体使用独立的会话状态树与上下文窗口，执行完毕后安全关闭，彻底保护主会话上下文窗口；
2. **轻量角色工具切片 (Role-Based Tool Slicing)**：为 `scout`/`researcher`（只读工具）、`reviewer`/`oracle`（审查工具）与 `worker`/`implementer`（读写工具）进行原生权限裁切。

---

## 一、架构决策 (Decision)

1. **会话物理隔离**：
   - 在 `packages/plugins/subagent/src/index.ts` 中声明 `inject = ["tools", "session"]`；
   - 在执行委派任务时，通过 `ctx.session.inMemory()` 派生独立子会话实例；
   - 任务完成后通过 `ctx.session.close(childSessionId)` 释放，主会话仅保留提炼后的 Markdown 交付物，**节约 80%+ 核心上下文**。

2. **角色与工具权限切片**：
   - `scout` / `researcher`：限定为只读工具 `["read", "grep", "find", "ls"]`；
   - `reviewer` / `oracle`：限定为代码与文档审查工具 `["read", "grep", "find"]`；
   - `worker` / `implementer` / `delegate`：开放标准读写工具 `["read", "write", "edit", "bash"]`。

---

## 二、架构收益与验证 (Consequences & Verification)

- **代码增量极小**：在保持 `packages/plugins/subagent` 极简纯净的同时，完整获得核心多智能体能力；
- **测试全绿**：通过 `cordis-ten-plugins.test.ts` 中对 `subagent` 独立会话、角色权限切片与递归深度限制的全部自动化测试。
