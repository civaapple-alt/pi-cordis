# Agent Note: 终端斜杠命令原生插件化与零污染旁路问答架构重构

Status: implemented
Created: 2026-08-20

[English](2026-08-20-pi-cordis-native-slash-commands-and-ephemeral-btw-architecture.md) | 中文

## 摘要 (Executive Summary)

本决策记录确立并交付了针对终端控制面斜杠命令（`/profile`、`/btw`）以及原生桌面通知（`terminal-notifier`）的**纯正 Cordis 原生插件化重构**方案。

彻底消除了历史 `profile-command.ts` 外部硬编码胶水，使所有终端交互命令均由 Cordis 插件通过 `ctx.extensions.registerCommand()` 声明式注册，并为 `@pi-cordis/plugin-btw` 接入了真实的单轮 LLM 旁路流式问答，实现 100% 物理隔离与零上下文污染。

---

## 一、架构决策 (Decision)

1. **`ExtensionService` 升级为统一命令桥接中心**：
   - 暴露 `ctx.extensions.registerCommand(name, definition): () => void`，基于 Cordis Fiber 返回可逆 Disposer；
   - 提供 `createBridgeExtensionFactory()`，自动收集所有插件贡献的 Slash Commands 并隐式桥接至上游 TUI 主循环。
2. **`@pi-cordis/profiles` 标准插件化**：
   - 声明 `inject = ["extensions", "settings"]`，在 `apply(ctx)` 中通过 `ctx.extensions.registerCommand("profile", ...)` 注册预设自动补全与热切换逻辑。
3. **新增 `@pi-cordis/plugin-btw` 旁路问答插件**：
   - 声明 `inject = ["extensions", "ai"]`；
   - 接收用户提问后，旁路调用 `ctx.ai.getRuntime().completeSimple(...)` 发起单轮真实 LLM 推理；
   - **零上下文污染**：不向会话树（SQLite / `session.jsonl`）写入任何消息记录，不消耗主会话上下文 Token，不破坏大模型 KV-Cache；
   - 通过 TUI 浮层（`[btw: <model_id>]`）输出真实回答。
4. **新增 `@pi-cordis/plugin-terminal-notifier` 原生桌面通知插件**：
   - 监听 `pi/tool-call`（`ask_question` 等待时）与 `pi/session-turn-end`（轮次结束时），向终端发射 `OSC 777` 原生通知。
5. **CLI 入口收敛**：
   - `packages/core/src/cli.ts` 移除手动组装工厂的外部胶水，仅需一行传递 `cordisCtx.extensions.createBridgeExtensionFactory()`。

---

## 二、架构收益与验证 (Consequences & Verification)

- **“一切皆插件”纯粹性**：所有终端命令与控制面功能 100% 遵循 Cordis 插件模型与声明式依赖注入；
- **真实 AI 旁路能力**：用户在终端中输入 `/btw <问题>` 即可获得实时 AI 解答，且绝不干扰主任务的上下文窗口；
- **全量自动化测试验证**：所有 36 个单元测试与 `tsc --noEmit` 均 100% 通过。
