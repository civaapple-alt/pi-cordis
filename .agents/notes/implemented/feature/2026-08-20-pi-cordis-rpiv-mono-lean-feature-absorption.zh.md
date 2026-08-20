# Agent Note: 基于极简哲学的 rpiv-mono 优秀特性吸收与轻量演进实现

Status: implemented
Created: 2026-08-20

[English](2026-08-20-pi-cordis-rpiv-mono-lean-feature-absorption.md) | 中文

## 摘要 (Executive Summary)

本决策记录确立并交付了针对 `rpiv-mono` 标杆扩展库优秀人机工效特性的轻量吸收方案。

通过**拒绝插件碎片化拆包**（避免为了十余行代码新建多个 npm 包），以不到 100 行代码在现有核心命令层与内置插件中完成了原地演进：
1. **轻量内置 `/btw` 快捷指令**：在 CLI 命令层内置零污染侧边提问；
2. **原地增强 `@pi-cordis/plugin-ask-question`**：支持选项 Markdown/Diff Preview 预览与 Note 备注；
3. **原地增强 `@pi-cordis/plugin-todo-tracker`**：支持拓扑排序依赖环路校验与自依赖检测；
4. **事件总线内置 OSC 777 终端通知**：提供 `TerminalNotifierPlugin`，向 Warp/Ghostty/iTerm2 输出原生 OS 弹窗通知。

---

## 一、架构决策 (Decision)

1. **`/btw` 指令**：在 `packages/coding-agent/src/core/cordis/profile-command.ts` 中通过 `createBtwCommandExtension` 挂载，利用轻量子插件执行单次问答并在 TUI 浮层展示，主会话零污染；
2. **问答 Markdown 预览**：在 `packages/plugins/ask-question/src/index.ts` 中为 `QuestionOption` 扩展 `preview` 与 `note` 字段；
3. **Todo 环路依赖检测**：在 `packages/plugins/todo-tracker/src/index.ts` 中引入基于 DFS 拓扑排序的 `hasCycle` 函数，严格拦截循环依赖与自依赖；
4. **`OSC 777` 终端通知**：在 `profile-command.ts` 中提供 `setupTerminalNotifier`，在工具阻塞与轮次结束时向 TTY 发射转义序列。

---

## 二、架构收益与验证 (Consequences & Verification)

- **零包袱演进**：保持了 15 个内置插件的纯粹性与高内聚；
- **测试覆盖**：在 `cordis-plugins-and-profiles.test.ts` 与 `cordis-ten-plugins.test.ts` 中新增针对 `/btw`、`OSC 777`、Markdown 预览与 Todo 依赖环检测的单元测试，全部测试通过。
