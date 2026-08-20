# Agent Note: Pi-Cordis 能力 Seams、显式依赖注入（inject）与 TUI 交互桥接架构设计

Status: implemented
Created: 2026-08-20

[English](2026-08-20-pi-cordis-capability-seams-inject-and-tui-bridge.md) | 中文

## 摘要 (Executive Summary)

本篇架构决策记录（ADR）详细阐述了 **Pi-Cordis 对 DeepSeek Harness (DSH) 官方 Capability Seams 规范的对齐与落地**，深入剖析了 **Cordis v4 显式依赖注入（`inject`）的微内核机制**，以及从 **微内核控制面到 `pi-tui` 双缓冲终端视口的全链路 UI 交互桥接原理**。

通过这一套架构，Pi-Cordis 实现了控制面契约、驱动实现、业务消费与终端表现层的彻底解耦，为开发者提供了安全、类型完备且体验极致的终端 AI 编码插件开发体系。

---

## 一、DSH Capability Seams 在 Pi-Cordis 中的三层映射

DSH 规范强制要求将每一个系统能力拆分为 **3 种正交角色**。Pi-Cordis 完整继承了这一设计哲学：

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Service Definition (契约定义层)                                    │
│    • packages/.../cordis/types.ts                                      │
│    • Context 强类型扩展声明 (ctx.tools, ctx.ai, ctx.settings...)          │
│    • 生命周期事件规范 (pi/tool-call, pi/session-before, pi/prompt-transform)│
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ 依赖注入 / IoC 容器
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 2. Service Provider (能力驱动实现层)                                   │
│    • packages/.../cordis/services/SettingsService (本地文件与配置驱动) │
│    • packages/.../cordis/services/AIService (1307+ 模型运行时驱动)     │
│    • packages/.../cordis/services/ToolRegistryService (工具注册中心)   │
│    • packages/.../cordis/services/SessionService (SQLite / 内存驱动)   │
│    • packages/.../cordis/services/ExtensionService (TUI 交互桥接驱动)  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ 声明式依赖注入 (inject)
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 3. Consumer (能力消费与工具层)                                         │
│    • @pi-cordis/plugin-safety-gate (消费 tool-call 事件执行安全拦截)   │
│    • @pi-cordis/plugin-todo-tracker (消费 ctx.tools 注入 todo_write 工具)│
│    • @pi-cordis/plugin-rules-injector (消费 prompt-transform 注入规则) │
│    • @pi-cordis/plugin-git-guard (消费 ctx.settings 执行自动检查点)   │
└────────────────────────────────────────────────────────────────────────┘
```

1. **契约定义层（Service Definition）**：在 `types.ts` 中通过 TypeScript 模块合并声明 `Context` 与 `Events` 接口，定义服务提供的标准方法与事件参数规格；
2. **驱动实现层（Service Provider）**：在 `services/*.ts` 中继承 `Service` 基类并声明 `static provide = 'key'`，实现具体的文件读写、网络请求或存储逻辑；
3. **能力消费层（Consumer）**：在 `packages/plugins/*` 中作为纯业务插件，只通过 `inject` 声明所需能力，杜绝直接耦合底层驱动。

---

## 二、显式依赖注入（`export const inject`）的微内核机制

在 Cordis v4.0.1 中，`export const inject = [...]` 在运行时和工程治理上具有 **3 大核心价值**：

### 1. 严格的属性访问权限沙箱（Access Control）
Cordis 通过 Proxy 对 `Context` 上的属性访问进行运行时沙箱保护：
- 若插件**未**在 `inject` 中声明某服务（如 `ctx.settings`），但在代码中试图访问，Cordis 运行时直接抛出：`Error: cannot get property "settings" without inject`；
- 强制杜绝“隐式未声明依赖”代码异味。

### 2. 无序启动与拓扑就绪等待（Out-of-Order Lifecycle Resolution）
- 插件加载时不依赖固定的物理加载顺序；
- 若插件依赖的 Service 尚未就绪，Cordis 会将该插件的 Fiber 置于 `PENDING` 状态，待提供方初始化完毕后自动激活执行 `apply()`。

### 3. 级联安全卸载（Cascading Safe Disposal）
- 当底层 Service 被卸载或热替换时，依赖该 Service 的下游插件会自动被挂起或干净注销，防止野指针调用与内存泄漏。

---

## 三、从控制面到 `pi-tui` 终端 UI 渲染的全链路流转

插件通过 `inject = ["tools"]` 或 `inject = ["tools", "extensions"]` 影响终端界面的完整链路如下：

```text
┌───────────────────────────────────────────────────────────────┐
│ 1. 插件控制面 (@pi-cordis/plugin-todo-tracker)                │
│    • 声明 inject = ['tools', 'extensions']                    │
│    • ctx.tools.register({ name: "todo_write", ... })          │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│ 2. 工具注册中心 (ToolRegistryService: ctx.tools)              │
│    • 将工具汇入全局工具池并生成 LLM Function Calling Schema   │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│ 3. 智能体推理与事件总线 (AgentService / Session Events)       │
│    • 模型发起调用: todo_write(action="add", title="...")      │
│    • 触发会话生命周期事件: tool_execution_start / end        │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│ 4. 终端 UI 渲染引擎 (@earendil-works/pi-tui)                  │
│    • 捕获工具调用事件，根据 Tool Name 派发给对应渲染器        │
│    • 默认渲染器: 绘制可折叠的终端卡片 (Tool Card)             │
│    • 渲染: ⚡ todo_write (action="add", title="重构鉴权")     │
│    • 渲染: ✔ Added task "重构鉴权" [todo_1]                   │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│ 5. 提示词动态注入闭环 (ctx.on('pi/prompt-transform'))         │
│    • 自动将当前活跃任务注入后续轮次 System Prompt             │
│    • 模型在后续流式回答中输出任务进展，TUI 进行 Markdown 渲染  │
└───────────────────────────────────────────────────────────────┘
```

---

## 四、`ExtensionService` 与 `pi-tui` 的 7 大终端交互槽位

`ExtensionService`（`ctx.extensions`）将 Pi 的 `ExtensionAPI` 完整暴露给 Cordis 插件，支持以下 **7 大终端 UI 槽位**：

| TUI 交互与渲染槽位 | 代码调用方式 | 终端实际视觉呈现 |
| :--- | :--- | :--- |
| **1. 交互式下拉选择器** | `await ctx.ui.select("选择待办", items)` | 在终端弹出高亮光标菜单，支持方向键选择与回车确认（如 `/profile` 菜单） |
| **2. 二次确认弹窗** | `await ctx.ui.confirm("确定执行该操作吗？")` | 弹出 `[Y/n]` 模态框，阻止非预期破坏性执行 |
| **3. 顶部/底部常驻挂件** | `ctx.ui.setHeader(...)` / `setFooter(...)` | 在终端顶部/底部渲染常驻状态条（如当前任务进度、Git 分支状态） |
| **4. 浮动 Toast 通知** | `ctx.ui.notify("已添加新待办", "info")` | 在终端角落弹出带颜色的浮动提示框 |
| **5. 工具专属自定义渲染器** | `pi.registerToolRenderer("todo_write", fn)` | 覆盖默认的 JSON 卡片，将待办工具渲染为带复选框 `[✓]` 的图形列表 |
| **6. 消息与条目自定义渲染** | `pi.registerMessageRenderer(fn)` | 完全自定义模型消息与思考链（Thinking）的折叠/展开动画与排版 |
| **7. 状态栏微件 (Status)** | `ctx.ui.setStatus("tasks", "3 pending")` | 在 TUI 底部状态行实时显示当前任务统计 |

---

## 五、实机代码示例：完整的 TUI 交互式 Cordis 插件

```typescript
import type { Context } from "@deepseek-ai/cordis";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export const name = "interactive-todo";
export const inject = ["tools", "extensions"];

export function apply(ctx: Context) {
  // 1. 注册供大模型调用的底层工具 (Consumer of ctx.tools)
  ctx.tools.register({
    name: "todo_write",
    description: "Add or update task in todo list",
    parameters: { ... },
    execute: async (args) => { ... },
  });

  // 2. 注册供开发者交互的 TUI 扩展命令与弹窗 (Consumer of ctx.extensions)
  ctx.extensions.register((pi: ExtensionAPI) => {
    pi.registerCommand("todos", {
      description: "在 TUI 中交互式查看与切换待办事项",
      handler: async (args, sessionCtx) => {
        if (sessionCtx.hasUI) {
          const chosen = await sessionCtx.ui.select("当前任务列表", [
            "1. [▶] 重构鉴权模块",
            "2. [ ] 编写集成测试",
          ]);
          sessionCtx.ui.notify(`你选中了: ${chosen}`, "info");
        }
      },
    });
  });
}
```

---

## 结论 (Consequences)

1. **架构高度统一**：完美对齐 DSH Capability Seam 三层角色规范与 Cordis 显式注入准则；
2. **表现层零污染**：UI 交互完全收敛在 `pi-tui` 双缓冲字符画布内，避免了传统 CLI 输出导致的终端花屏；
3. **生态可扩展性**：任何第三方 Cordis 插件只需声明依赖，即可同时获得 LLM 工具调用与终端交互式 UI 呈现的完整能力。
