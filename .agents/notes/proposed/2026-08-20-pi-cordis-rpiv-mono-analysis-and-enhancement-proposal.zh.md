# Agent Note: 基于极简哲学的 rpiv-mono 优秀特性吸收与轻量演进提案

Status: proposed
Created: 2026-08-20

[English](2026-08-20-pi-cordis-rpiv-mono-analysis-and-enhancement-proposal.md) | 中文

## 摘要 (Executive Summary)

本篇架构提案立足于 **Pi 极简设计哲学（Minimalist Philosophy）与反过度设计准则**，对 Pi 生态标杆扩展库 [`juicesharp/rpiv-mono`](https://github.com/juicesharp/rpiv-mono)（包含 15 个子包）进行了系统性解构与精炼吸收。

本提案明确**拒绝“插件碎片化”反模式（即避免为了十余行代码盲目创建新的 npm 插件包）**，而是通过**在现有核心服务与插件中进行原地吸收与轻量演进**，以极小的代码增量获得最佳的终端人机工效：
1. **轻量内置 `/btw` 快捷指令**：在 CLI / 核心命令中直接挂载零污染侧边提问，无需新建插件包；
2. **原地增强 `@pi-cordis/plugin-ask-question`**：增加选项的 Markdown/Diff Preview 预览框与 Note 备注；
3. **原地增强 `@pi-cordis/plugin-todo-tracker`**：增加输入框上方悬浮 Overlay 面板与依赖环路校验；
4. **事件总线内置 OSC 777 终端通知**：在 `ExtensionService` 或事件总线中增加 15 行自适应监听器，向 Warp/Ghostty/iTerm2 终端输出原生 OS 弹窗通知。

---

## 一、极简审视：拒绝插件碎片化与过度拆包 (Anti-Fragmentation)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                     极简哲学 vs 插件碎片化 对比审视                    │
├────────────────────────────────────────────────────────────────────────┤
│ ❌ 碎片化误区   : 为每一个微小功能（如 15 行的 OSC 777、一个 /btw 指令） │
│                   都拆出一个独立的 npm 插件包，导致包依赖网络急剧膨胀。 │
│                                                                        │
│ ✅ 极简主义解法 : 1. 原地打磨现有插件（增强 ask-question 与 todo-tracker）；│
│                   2. 极简集成核心指令（/btw 直接内置于核心命令层）；    │
│                   3. 无感挂载事件通知（OSC 777 挂载于现有 EventBus）。 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 二、精炼演进方案 (Lean Evolution Blueprint)

### 1. 内置 `/btw` 零污染侧边提问指令
- **定位**：解决“开发过程中想顺便问一句为什么，但不想把回答塞进主 Prompt 浪费 Token”的痛点；
- **实现**：直接在 `packages/coding-agent/src/core/cordis/` 中注册 `/btw <question>` 指令：
  - 调用 `ctx.extend()` 派生临时只读 Fiber；
  - 请求 `ctx.ai` 单次推理并在 TUI 底部弹出轻量浮层；
  - 回收 Fiber，主会话历史与磁盘数据库完全无痕。

---

### 2. 原地增强 `@pi-cordis/plugin-ask-question` (Markdown 预览)
- **痛点**：纯文本选项有时难以让用户直观辨析两个代码 Diff 或复杂架构方案；
- **实现**：在现有参数中增加 `preview?: string`，TUI 渲染时在选项右侧渲染一个带边框的 Markdown/Diff Preview 预览框。

---

### 3. 原地增强 `@pi-cordis/plugin-todo-tracker` (悬浮看板与环路检测)
- **实现**：
  - 驱动 `ExtensionService` 在输入框上方常驻渲染简洁的 `Todos (done/total)` 悬浮看板；
  - 在添加步骤时使用拓扑排序（Topological Sort）自动检测并拦截 `blockedBy` / `dependsOn` 环路。

---

### 4. 事件总线内置 `OSC 777` 原生终端通知
- **实现**：在 `ExtensionService` 中挂载轻量监听器（约 15 行代码）：
  - 监听 `pi/tool-call`（`ask_question` 时触发 "Waiting for Answer"）；
  - 监听 `pi/session-turn-end`（触发 "Turn Completed"）；
  - 检测到 Warp / Ghostty / iTerm2 环境时向 `stdout` 输出 `\x1b]777;notify;title;body\x07`。

---

## 三、收益与架构价值 (Consequences & Benefits)

1. **零新增插件包袱**：保持现有 15 个内置插件的纯粹性，不制造生态碎片化；
2. **极速与零配置**：所有优秀交互细节（OSC 777、/btw、预览框）全部开箱即用；
3. **维护成本最低**：以不到 100 行总代码增量，完整吸收 `rpiv-mono` 最具用户价值的 4 大交互精髓。
