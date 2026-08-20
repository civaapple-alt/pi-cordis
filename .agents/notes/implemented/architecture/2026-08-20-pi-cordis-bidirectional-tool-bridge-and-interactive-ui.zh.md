# Agent Note: Pi-Cordis 双向工具桥接中枢、Profile 动态工具遮罩与终端交互式 UI 规范

Status: implemented
Created: 2026-08-20

[English](2026-08-20-pi-cordis-bidirectional-tool-bridge-and-interactive-ui.md) | 中文

## 摘要 (Executive Summary)

本篇架构决策记录（ADR）深入剖析并沉淀了 **Pi-Cordis 在双向工具桥接、Profile 动态工具遮罩同步以及终端交互式 UI 全链路改造** 中的核心架构设计与工程实践：

1. **LLM API 工具全量可见性与双向桥接**：消除了 CLI `--tools` 参数严格白名单导致的插件扩展工具被底层拦截过滤的问题，由 `ExtensionService` 统一桥接全部内置工具与插件自定义工具；
2. **Profile 热切换与动态工具遮罩同步**：实现了预设切换时插件 Fiber 的异步生命周期卸载（`ctx.registry.delete`），并通过 `ExtensionService.syncActiveTools()` 调用 `pi.setActiveTools()`，使大模型从 LLM API 视角动态感知不同场景（如 PTC 模式屏蔽底层原始文件/终端工具，仅暴露 `run_code`）；
3. **双向终端交互式 UI 上下文规范**：解决了 `@pi-cordis/plugin-ask-question` 无法在终端弹出交互式选择框的问题，确立了命令交互上下文（`cmdCtx.ui`）与工具执行上下文（`execContext.ctx.ui`）的规范，保证真实终端阻塞交互与非交互/CI 环境平滑回退。

---

## 一、LLM API 工具全量可见性与双向桥接架构

### 1. 上游 Pi `--tools` 白名单拦截机制剖析
在上游 `@earendil-works/pi-coding-agent` 的 `AgentSession` 内部，工具过滤逻辑如下：
```typescript
const isAllowedTool = (name: string): boolean =>
    (!allowedToolNames || allowedToolNames.has(name)) && !excludedToolNames?.has(name);
```
- 当 CLI 启动时传入了 `--tools read,bash,edit,write,grep,find,ls`，上游会将 `allowedToolNames` 实例化为一个严格的 Set；
- 此时，即使 Cordis 插件通过扩展注册了 `ask_question`、`todo_write`、`subagent` 等工具，它们也会在 `isAllowedTool` 校验阶段被全部过滤剔除，导致大模型在 LLM API 视角完全感知不到任何插件工具；
- 而当 CLI **未传入** `--tools` 时，`allowedToolNames` 保持为 `undefined`，上游的 `includeAllExtensionTools: true` 策略生效，所有扩展工具均被接纳。

### 2. 双向桥接中枢设计
为了确保大模型既能使用 `grep`、`find`、`ls` 等搜索工具，又能完整使用所有活跃插件工具，Pi-Cordis 采取以下架构策略：
1. **移除 CLI 层手动注入 `--tools`**：保持 `allowedToolNames` 为 `undefined`；
2. **微内核统一桥接**：在 `ExtensionService.createBridgeExtensionFactory()` 中，将内置搜索工具与 `ctx.tools.getCustomTools()` 统一转换为标准 `ToolDefinition` 并调用 `pi.registerTool()`；
3. **响应式热注册与事件反射**：监听 `pi/tool-registered` 支持插件运行时热挂载，同时将上游 `tool_call` 与 `tool_result` 实时反射回 Cordis 事件总线与拦截管道。

---

## 二、Profile 热切换与动态工具遮罩同步

### 1. 场景化工具遮罩诉求
在“Default is Best”极简预设体系中：
- **`default` 预设**：需要暴露全量 7 大内置工具 + 10 大插件自定义工具（共 17 个）；
- **`ptc` 预设**：为实现编程化工具调用，`code-mode` 插件必须向 LLM 隐藏底层的 `read`、`write`、`edit`、`bash`、`grep`、`find`、`ls` 等原始工具，强制大模型通过 `run_code` 结合 TypeScript SDK 批量执行；
- **`plan` 预设**：规划阶段需拦截一切修改操作。

### 2. 异步生命周期卸载与动态同步链路
切换预设（如 `/profile ptc` 或 `/profile default`）时，执行以下全链路流程：

```text
用户在终端执行 /profile ptc
        │
        ▼
1. applyProfile(ctx, "ptc")
        │
        ├─► 调用 ctx.registry.delete(plugin) 卸载前序预设插件 Fiber
        │   (自动注销旧工具、销毁旧工具过滤器与事件监听器)
        ├─► 等待微任务清空 (await new Promise(r => setTimeout(r, 0)))
        ├─► 挂载新 Profile 插件 (如 code-mode 注册 run_code 并添加遮罩过滤器)
        │
        ▼
2. ExtensionService.syncActiveTools()
        │
        ├─► 计算 ctx.tools.getExportedToolNames() (经当前活跃过滤器计算后的工具列表)
        ├─► 调用 this.activePi.setActiveTools(exportedToolNames)
        │
        ▼
3. 上游 Pi AgentSession 运行时更新
        │
        └─► agent.state.tools 动态刷新，LLM API 工具 Schema 实时切换
```

---

## 三、全链路双向终端 UI 交互规范

### 1. 问题复盘：`ask_question` 为何未弹窗
在此前版本中，`ask_question` 在桩代码实现中直接返回了 `q.options?.[0]?.label`，没有挂接终端交互 UI，导致大模型发起提问后，工具在用户未操作的情况下瞬间返回假定结果。

### 2. 交互上下文通道规范
微内核中存在两种截然不同的用户交互通道，必须严格区分：

| 交互类型 | 触发入口 | 交互上下文获取方式 | 典型用途 |
| :--- | :--- | :--- | :--- |
| **命令交互 (Command UI)** | 终端用户主动输入斜杠命令（如 `/profile`、`/btw`） | 从 `handler(args, cmdCtx)` 的 `cmdCtx.ui` 获取 | 交互式选择预设、弹出旁路问答 Toast 通知 |
| **工具交互 (Tool UI)** | 大模型在推理过程中发起 `tool_call`（如 `ask_question`） | 从 `tool.execute(args, execContext)` 的 `execContext.ctx.ui` 获取 | 弹出选项下拉选择框（`ui.select`）、单行输入框（`ui.input`）、危险操作确认框（`ui.confirm`） |

### 3. 插件 UI 开发核心准则
1. **严禁在 Cordis `ctx` 上直接读取 `ctx.ui`**：Cordis Proxy 会因未声明 `inject = ["ui"]` 抛出运行时拦截异常，必须统一从上下文参数中解构；
2. **必须支持非交互模式回退**：通过 `Boolean(execContext?.ctx?.hasUI && ui?.select)` 进行环境守卫，在自动化测试或 CI 等非交互环境下平滑回退，防止进程挂起阻塞。

---

## 四、内置插件交互矩阵排查

对微内核 17 个内置插件的交互机制进行全面排查与分类：

| 插件名称 | 交互方式 | UI 接口 | 运行机制 |
| :--- | :--- | :--- | :--- |
| `@pi-cordis/profiles` | 终端命令 | `cmdCtx.ui.select`<br>`cmdCtx.ui.notify` | 弹出预设选择菜单并展示切换通知 |
| `@pi-cordis/plugin-btw` | 终端命令 | `cmdCtx.ui.notify` | 单轮旁路推理完成后展示轻量 Toast 通知 |
| `@pi-cordis/plugin-ask-question` | 工具调用 | `execContext.ctx.ui.select`<br>`execContext.ctx.ui.input` | 阻塞式弹出终端多选菜单或自定义单行输入框 |
| `@pi-cordis/plugin-code-mode` | 工具调用 | `renderCall`<br>`renderResult` | Worker 线程沙箱批量执行，自定义 ANSI 卡片渲染 |
| `@pi-cordis/plugin-todo-tracker` | 工具调用 | `renderCall`<br>`renderResult` | 待办状态机管理，自定义 ANSI 状态渲染 |
| `@pi-cordis/plugin-plan-mode` | 工具调用 | `renderCall`<br>`renderResult` | 规划文档与步骤追踪，自动阻断未授权写操作 |
| `@pi-cordis/plugin-git-guard` | 工具调用 | `renderCall`<br>`renderResult` | Git 检查点快照与回滚 |
| `@pi-cordis/plugin-safety-gate` | 事件拦截 | `pi/tool-call` 钩子 | 模式匹配直接拦截高危操作（抛出明确安全拒绝） |
| `@pi-cordis/plugin-terminal-notifier`| 事件监听 | `OSC 777` 终端协议 | 向 Warp / Ghostty / iTerm2 发射桌面弹窗通知 |

---

## 五、测试与质量保证

1. **Profile 热切换与遮罩断言**：在 `cordis-plugins-and-profiles.test.ts` 中验证了从 `default` 切换到 `ptc` 模式后 `run_code` 激活且底层工具被遮罩，切换回 `default` 后原始工具自动恢复；
2. **交互式 UI 选择与输入断言**：在 `cordis-ten-plugins.test.ts` 中覆盖了 `ui.select`、`ui.input` 自定义答案输入以及无 UI 环境自动回退；
3. **工程质量门禁**：37 个单元测试 100% 通过，`tsc --noEmit` 0 错误。
