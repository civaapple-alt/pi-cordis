# Agent Note: Pi-Cordis 全套内置插件最优解架构演进蓝图与实践指南

Status: implemented
Created: 2026-08-20

[English](2026-08-20-pi-cordis-plugin-ecosystem-optimal-architecture-and-roadmap.md) | 中文

## 摘要 (Executive Summary)

在成功将 `@pi-cordis/plugin-code-mode` 升级为 **“强类型 .d.ts 动态生成 + 表现层工具遮蔽 (Tool Masking) + Node.js worker_threads 独立 Isolate 隔离 + TUI 多态可视化卡片”** 的高标准范式之后，本篇架构蓝图（ADR Blueprint）系统性梳理并定义了 **Pi-Cordis 全部 15 个内置插件的最优解（Optimal Solution）技术标准与演进路径**。

通过对齐 **DeepSeek Harness (DSH)** 工业级智能体框架的核心设计哲学，我们将每个插件从简单的功能实现，升维至具备 **工业级防崩溃、上下文/KV-Cache 高效利用、富终端交互、强类型契约与 100% 可逆副作用** 的原生 Cordis 微内核扩展。

---

## 一、Pi-Cordis 插件最优解的 5 大核心准则 (The 5 Pillars)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   Pi-Cordis 插件最优解的 5 大核心准则                   │
├────────────────────────────────────────────────────────────────────────┤
│ 1. 强类型与参数契约 (Type & Schema Rigor) : 完备 Schema 与精准 JSDoc    │
│ 2. 表现层与 Token 优化 (Presentation & Cache) : 工具遮蔽与前缀缓存友好 │
│ 3. 真实物理隔离与防御 (True Isolation & Defensive) : 线程隔离与超时强杀 │
│ 4. TUI 富交互与多态渲染 (TUI Rich UI) : renderCall/renderResult 折叠卡片│
│ 5. 副作用必可逆闭环 (100% Reversible) : 基于 ctx.effect() 零残留回滚   │
└────────────────────────────────────────────────────────────────────────┘
```

1. **强类型与参数契约（Type & Schema Rigor）**：每个工具的输入参数与返回值均具备精准的 JSON Schema、类型推导与 JSDoc 描述，杜绝模糊字符串；
2. **表现层控制与 Token 优化（Presentation & Token Efficiency）**：对模型视线实施精准裁剪（如 Code Mode 下遮蔽底层工具），避免工具 Schema 挤占上下文，维持 KV Cache 前缀稳定；
3. **真实物理隔离与防御（True Isolation & Defensive Patterns）**：高风险操作具备进程/线程级隔离，设置硬超时预算与物理终止保护（如 Worker 线程 `terminate()`），绝不阻塞主线程；
4. **TUI 富交互与可视化卡片（TUI Rich Visualizations）**：所有面向用户的工具均实现 `renderCall` 与 `renderResult`，支持紧凑折叠与展开多态；
5. **微内核副作用必可逆（100% Reversible via Cordis Disposers）**：所有注册、事件监听与拦截均包装在 `ctx.effect()` 中，预设切换时零内存与状态残留。

---

## 二、全套 15 个内置插件的最优解设计与 DSH 对齐清单

| 插件名称 | 对应 DSH 模块与设计 | Pi-Cordis 最优解演进方案 (Optimal Enhancement) |
|---|---|---|
| **1. `code-mode`** | `code-runtime-worker-thread`, `tool-presentation` | **[已完成]** 动态生成 `.d.ts` + 表现层工具遮蔽 + `worker_threads.Worker` 独立线程执行 + 异步死循环物理强杀 + TUI 折叠卡片。 |
| **2. `output-truncator`** | `spill/`, `guard/tool-output-truncation` | **Spill 溢出转存与双端保留**：保留 Head (前 30 行) + Tail (后 20 行)，超出 50KB 自动转存至 `.pi/spill/<id>.txt` 并返回分页读取指引，避免直接丢弃信息。 |
| **3. `ask-question`** | `interaction/tool-ask-user`, `user-questions` | **交互式推荐与批量问答**：支持多问题批处理、`(Recommended)` 推荐高亮、单选/多选/自定义输入及 TUI 方向键交互组件。 |
| **4. `plan-mode`** | `plan/`, `plan-mode` | **步骤依赖图与进度仪表盘**：引入步骤状态机（`pending` -> `in_progress` -> `completed`），计算百分比进度条，规划期写工具强制拦截，完成后自动放行。 |
| **5. `todo-tracker`** | `todo/` (`tool-todo-write`) | **任务状态机与自适应注入**：支持任务 4 态，Prompt 注入时自动折叠已完成历史（`✓ N completed hidden`），大幅压缩 Prompt Token。 |
| **6. `subagent`** | `subagent/` (`subagent-local`) | **深度限制与 AbortSignal 级联**：隔离 `ctx.extend()` 作用域，限制派生深度，主会话取消时级联终止子智能体，返回结构化产出（修改文件清单、摘要）。 |
| **7. `safety-gate`** | `sandbox/`, `guard/tool-hygiene` | **多层级安全规则引擎**：命令 AST/正则解析拦截 `rm -rf /`、`chmod -R 777`，受保护路径黑名单（`.env`, `.ssh/`），环境变量防泄漏。 |
| **8. `git-guard`** | `guard/` | **轻量级暂存快照与一键回滚**：在执行风险写操作前通过 `git stash create` 生成轻量快照引用，支持任务失败时无损恢复。 |
| **9. `context-compactor`** | `compaction/` (`compaction-basic`) | **决策保留式分段压缩**：结构化提取 4 大核心资产（已改文件、关键架构决策、已解决问题、待办阻塞项），保留稳定 System Prompt 前缀。 |
| **10. `tools-manager`** | `core/tools` | **动态能力切片**：根据使用场景批量挂载/卸载工具集（如纯读代码审查、纯写业务生成），配合 Cordis Disposer 实现即时生效。 |
| **11. `git-automation`** | `shell/` | **暂存区语义分析与 Conventional Commit**：深度解析 `git diff --staged` 自动推断 commit 影响范围（`feat`, `fix`, `refactor`），联动 Issue 编号自动关联。 |
| **12. `ssh-delegator`** | `e2b/`, `shell/` | **长连接会话池与远程环境嗅探**：通过 SSH 复用长连接握手，自动嗅探远端操作系统与可用工具链，提供结构化命令执行结果。 |
| **13. `rules-injector`** | `context/workspace-rules` | **多目录层级合并与哈希缓存**：递归扫描项目指令文件（`AGENTS.md`, `CLAUDE.md` 等），基于 SHA-256 哈希缓存避免不必要的 Prompt 变动，维持 KV-Cache 稳定。 |
| **14. `session-handoff`** | `session/`, `goal/` | **标准化交接信封 (Handoff Envelope)**：打包核心目标、已完成里程碑、关键文件与下一步行动清单，生成结构化 Markdown 产物以供新会话读取。 |
| **15. `profiles`** | `preset/`, `bundle/` | **预设组合与增量 HMR**：支持预设的继承与叠加（如 `default + code-mode`），通过 Cordis 增量 Loader 实现预设无缝热切换。 |

---

## 三、三阶段全量落地总结

全套 15 个插件的最优解改造已全部完成并通过自动化测试验证：
- **第一阶段（鲁棒性与防爆）**：`output-truncator`、`safety-gate`、`git-guard`。
- **第二阶段（交互与能效）**：`ask-question`、`plan-mode`、`todo-tracker`、`subagent`。
- **第三阶段（长效会话与工程连续性）**：`context-compactor`、`session-handoff`、`git-automation`、`ssh-delegator`、`rules-injector`。
