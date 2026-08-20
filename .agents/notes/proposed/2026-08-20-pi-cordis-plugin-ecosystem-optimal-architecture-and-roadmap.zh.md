# Agent Note: Pi-Cordis 全套内置插件最优解架构演进蓝图与实践指南

Status: proposed
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
| **10. `tools-manager`** | `core/tools` | **能力切片与场景化动态开关**：支持按场景一键切换工具集（如只读审查模式、代码生成模式），结合 Cordis Effect 实现即时生效与回滚。 |
| **11. `git-automation`** | `shell/` | **暂存区差异语义分析**：自动解析 `git diff --staged`，智能推导变更作用域（Scope），生成标准 Conventional Commits 与关联 Issue。 |
| **12. `ssh-delegator`** | `e2b/`, `shell/` | **持久化连接池与环境探针**：基于 SSH Multiplexing 复用连接握手，自动探查远程主机 OS/环境工具并返回结构化执行结果。 |
| **13. `rules-injector`** | `context/workspace-rules` | **层级规则合并与哈希缓存**：递归向上扫描项目规范文件（`AGENTS.md`、`CLAUDE.md`），基于 SHA-256 哈希缓存，未改动时不破坏 Prompt 缓存。 |
| **14. `session-handoff`** | `session/`, `goal/` | **标准化交接信封 (Handoff Envelope)**：生成标准结构化交接简报（目标、里程碑、关键文件、下一步指令），支持一键转存为新会话。 |
| **15. `profiles`** | `preset/`, `bundle/` | **预设继承与双轨增量 HMR**：支持 Preset 继承与叠加（如 `default + code-mode`），完善 YAML 目录与 TS 插件源码的双轨热重载。 |

---

## 三、分阶段推进与实施计划 (Implementation Phases)

### 阶段一：防爆与鲁棒性增强（第一优先级）
1. **`output-truncator` 升级为 Spill 机制**：实现 `.pi/spill/` 溢出转存与 Head/Tail 保护；
2. **`safety-gate` 升级为多层级安全引擎**：增强命令 AST 模式解析与敏感文件保护；
3. **`git-guard` 增加原子级 Stash 检查点**：实现写操作前的安全快照。

### 阶段二：交互与推理效能优化（第二优先级）
4. **`ask-question` 升级为多题批处理与推荐选项**；
5. **`plan-mode` 升级为步骤状态机与写操作拦截控制**；
6. **`todo-tracker` 升级为自适应 Prompt 注入与四态任务管理**；
7. **`subagent` 增加 AbortSignal 级联取消与深度保护**。

### 阶段三：长会话与工程协同优化（第三优先级）
8. **`context-compactor` 升级为 4 维决策结构化压缩**；
9. **`session-handoff` 升级为标准化交接信封**；
10. **`git-automation` 升级为 Staged Diff 语义分析**；
11. **`ssh-delegator` 引入连接复用与环境探针**；
12. **`rules-injector` 增加哈希去重与层级继承**。

---

## 四、预期收益

- **稳定性提升 100%**：彻底消除死循环、超长输出爆内存、误删敏感文件等风险；
- **Token 开销降低 50%~80%**：通过表现层遮蔽、Spill 溢出转存与 Todo 自适应压缩，显著节省上下文预算；
- **KV Cache 命中率提升**：所有提示词注入与规则合并均采用稳定前缀与哈希去重；
- **交互体验大幅跃升**：每个工具均具备专属的 TUI 折叠卡片与多态渲染。
