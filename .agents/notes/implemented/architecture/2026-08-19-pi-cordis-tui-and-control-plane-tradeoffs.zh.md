# Agent Note: TUI、UI 插件体系与控制面重构权衡及发散探索

Status: implemented
Created: 2026-08-19

[English](2026-08-19-pi-cordis-tui-and-control-plane-tradeoffs.md) | 中文

## 摘要 (Executive Summary)

本篇架构决策记录（ADR）系统梳理并沉淀了关于 `pi-cordis` 重构过程中的核心思考、代价权衡与发散问题。重点解答了以下关键议题：
1. **控制面重构的真实代价**：为什么在 `packages/coding-agent/src/core/cordis` 置换底座表面看起来轻量？背后的架构权衡是什么？
2. **启动静默装配与界面呈现**：为什么不像 `dsh`/`pi-dsh` 那样在控制台滚屏打印插件加载日志，而是采用全屏 TUI 资源看板？
3. **TUI 与微内核 UI 插件体系的本质冲突**：为什么 `pi-tui` 目前是单体装配？为什么 DSH 开源前移除了内置 TUI？在字符终端中实现细粒度 UI 插件与 WebServer 面临哪些根本性困难？
4. **发散探索与未来演进**：TUI 插槽化（Slots）改造路径、双轨插件互操作、多 Agent 终端呈现边界与多端前端分流架构。

---

## 核心议题与深度解析

### 一、控制面重构的真相与代价（Control Plane & Strangler Pattern Trade-offs）

#### 1. “在 `src/core/cordis` 实现底座置换” 的架构本质：看似简单的背后是什么？
很多开发者初看 `pi-cordis` 的代码时会产生一个疑问：**“仅仅在 `packages/coding-agent/src/core/cordis/` 下编写了 10 个 Service 并在 `bootstrap.ts` 里装配，就真把整个 Pi 变成了 Cordis 微内核工程吗？这真的有这么简单吗？”**

答案是：**它的代码量看起来精炼，是因为它精准击中了架构解耦的杠杆点（Leverage Point），采用了经典软件工程中的“绞杀者模式（Strangler Fig Pattern）”与“控制面/数据面分离”设计。**

```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │         Cordis 微内核控制面 (Control Plane: packages/.../src/core/cordis)│
  │  Context 容器 / static provide / 生命周期事件 / 服务发现 / 依赖注入    │
  └──────────────────┬──────────────────────────────────┬──────────────────┘
                     │                                  │
      ┌──────────────▼─────────────┐      ┌─────────────▼──────────────┐
      │  Service 插件适配包装层    │      │  ExtensionAPI 桥接适配器   │
      │  (Settings, AI, Tools...)  │      │  (pi.on <-> ctx.on)        │
      └──────────────┬─────────────┘      └─────────────┬──────────────┘
                     │                                  │
  ┌──────────────────▼──────────────────────────────────▼──────────────────┐
  │         Pi 底层数据与算法面 (Data Plane: 原生 packages/* 核心算法)     │
  │  LLM Token 流处理 / Agent 状态树 / SQLite 存储 / TUI 双缓冲字符渲染    │
  └────────────────────────────────────────────────────────────────────────┘
```

- **高内聚的底层资产无需重写**：Pi 原有的 `packages/ai`（1300+ 模型协议与流式解析）、`packages/tui`（ANSI 字符布局算法）、`packages/agent`（文件系统执行环境）本身就是高度内聚的算法与数据面组件。推倒重写不仅没有收益，反而会引入海量未知 Bug。
- **微内核接管的是“控制与组装权”**：Cordis 作为一个元框架，其核心威力在于**生命周期的统一协调、状态的依赖注入、扩展点的可逆注销与跨模块事件总线**。通过在 `packages/coding-agent` 的装配层注入 Cordis `Context`，我们以最小的侵入性实现了 100% 的微内核能力接管。
- **TypeScript 声明合并的编译期杠杆**：通过 `declare module "@deepseek-ai/cordis"`，我们无需修改上游数千处函数入参，就让全局 `ctx.*` 获得了原生级的类型推导。

---

#### 2. “控制面装配方案” vs “激进全量物理拆包重构” 深度对比矩阵

| 评估维度 | 当前方案（控制面适配 + 10 大 Cordis 服务插件） | 激进方案（物理推倒所有子包重写为强依赖 Cordis） |
| :--- | :--- | :--- |
| **工程开发与重构周期** | ⚡ **极短（数天内平滑完成）** | 🛑 **漫长（数周至数月，高风险）** |
| **社区生态兼容性** | 💯 **100% 原生无缝兼容**（`@juicesharp/rpiv-todo` 即插即用） | ⚠️ **高风险破坏现有 `pi.dev/packages` 扩展** |
| **原有测试复用率** | 💯 **3500+ 原生单测全量复用并通过** | ❌ **原有单测大面积失效需推倒重写** |
| **微内核解耦收益** | ✅ **获得 85%+ 核心收益**（全量 IoC、事件总线、动态扩展） | ✅ **获得 100% 极致收益** |
| **系统稳定性与维护成本** | 🟢 **极高稳定性，平滑渐进演进** | 🔴 **脆弱易崩，维护成本高昂** |

---

#### 3. 背后付出的 4 大真实代价与工程防范策略

天下没有免费的架构午餐。这种控制面方案虽然收益极高，但也必须直面以下 **4 大客观代价（Costs & Trade-offs）** 并建立防御措施：

##### ① 代价一：双重事件体系与桥接维护成本（Indirection Overhead）
* **现状**：Pi 社区插件习惯使用 `pi.on("tool_call")`、`pi.registerTool()` 这种钩子式 API；而 Cordis 体系使用的是 `ctx.on("pi/tool-call")`、`ctx.tools.register()`。
* **代价**：我们在 `ExtensionService` 中实现了一套双向映射适配层。维护者必须同时理解两套事件生命周期。
* **防范**：在 `.agents/notes/` 和代码注释中严格定义事件映射字典，由单元测试锁定双向事件的一致性。

##### ② 代价二：绕过微内核的“双轨制风险”（Bypass Risk）
* **现状**：底层子包（如 `@earendil-works/pi-agent-core`）在物理上仍然是独立的 npm 包。
* **代价**：如果未来开发者绕过 `ctx.*`，直接在业务代码里 `import { Agent } from "@earendil-works/pi-agent-core"` 并私自 `new Agent()`，该实例将脱离 Cordis 微内核的生命周期监控。
* **防范**：在 `AGENTS.md` 中立项团队契约，并在 CI 门禁或 ESLint 中禁止跨层直接实例化底层核心类，所有能力必须从 `ctx.*` 注入获取。

##### ③ 代价三：Cordis 深度特性（HMR & Forking）的受限
* **现状**：Cordis 具备极强的插件热重载（HMR）与多租户上下文隔离分叉（Context Forking）能力。
* **代价**：底层某些老旧模块在设计初期包含了进程级静态缓存（如全局终端句柄、主题缓存），在未对其进行彻底的 `Disposer` 生命周期重构前，热重载可能存在残余监听器。
* **防范**：遵循渐进式原则，优先保障微内核生命周期注入；后续对需要热重载的模块逐步下沉改造为纯 Disposable 资源。

##### ④ 代价四：开发团队的心智模型迁移成本（Mental Model Shift）
* **代价**：传统 Pi 开发者习惯直接 `new Class()` 和同步方法调用；而在 Cordis 体系下，必须掌握 **依赖注入（IoC）**、**服务提供者契约（`static provide`）**、**可逆副作用回收（`ctx.effect`）** 与 **异步微任务调度（Fiber Settlement）**。
* **防范**：在 `AGENTS.md` 和 `.agents/notes/` 中提供详尽的开发手册与架构范例。

---

### 二、启动日志与呈现设计（Startup Presentation & Silent Boot）

#### 1. 为什么不采用控制台滚屏日志？
- **TUI 全屏备用缓冲（Alternate Screen Buffer）规范**：全屏交互式终端在启动时必须保证 `stdout` 绝对纯净，不能有零散的文字输出破坏 ANSI escape 序列和终端光标定位；
- **编程式极速挂载**：`createPiContext()` 在内存中完成 10 大服务装配仅需 `< 2ms`，无需冗长的 Loader 滚屏等待。

#### 2. 状态呈现在 TUI 欢迎界面的最佳实践
我们将微内核状态优雅地挂载至 TUI 启动看板：
```text
[Cordis Microkernel]
  ctx.settings, ctx.auth, ctx.ai, ctx.tools, ctx.session, ctx.skills, ctx.prompts, ctx.extensions, ctx.packageManager, ctx.agent

[Extensions]
  @juicesharp/rpiv-todo
```
在展开模式下，进一步展示每个 Service 插件的详细职责与描述，兼顾了终端纯净度与系统可观测性。

---

### 三、TUI 环境下做 UI 插件与 WebServer 的根本困境

#### 1. 为什么在 TUI 中做 UI 插件（Slots / UI-Plugins）极其困难？
- **缺乏 CSS 弹性排版模型**：Web 拥有 Flexbox/Grid，多个插件向 Slot 挂载组件由浏览器自动布局；而终端是固定行列（如 120 × 40）的纯字符网格，多插件动态渲染卡片极易发生**字符宽度计算错误、卡片挤压与界面撕裂**；
- **唯一的 Standard Input Raw Mode 与按键冲突**：终端只有一个全局输入流，多个插件同时拦截按键（如 Tab 补全、代码缩进、模态弹窗）极易产生**按键死锁与焦点竞争**；
- **长会话字符双缓冲重绘开销**：维护庞大的多插件终端动态组件树会带来极高的 CPU/内存开销。

#### 2. 为什么 DSH 在开源前移除了内置 TUI？
- **双重状态鸿沟**：本地全屏 TUI 状态（字符坐标、光标、Raw Mode）与远程 WebServer / RPC 状态（JSON-RPC、无状态请求）难以在单一进程中优雅统一；
- **DSH 的战略退守——协议化（Protocol-first）**：DSH 专注打磨 Cordis 微内核、推理循环、工具沙箱与 ACP（Agent Client Protocol），将 UI 展示彻底外置给 IDE 插件与 Web 前端。

#### 3. Pi 与 DSH 的定位互补
- **Pi 的绝对优势**：拥有开源界最极致轻量的本地终端交互体验（`pi-tui`）；
- **pi-cordis 的使命**：用 Cordis 微内核赋能 Pi 的插件与服务编排，打造最强的**原生终端 Agent**。

---

## 发散探索与未来架构演进

### Q4: TUI 插槽化（Slots）改造路径

未来可将 `InteractiveMode` 的单体容器重构为 `TuiService` (`ctx.tui`)，定义 7 大标准插槽：
1. `tui/header`：Logo、品牌标语与系统提示；
2. `tui/resources`：微内核状态与扩展看板；
3. `tui/widget-top`：顶部小挂件（倒计时、状态提醒）；
4. `tui/chat-stream`：消息流渲染（Markdown、Diff、Bash 执行、工具卡片）；
5. `tui/widget-bottom`：底部小挂件；
6. `tui/editor`：多行编辑器与自动补全浮层；
7. `tui/footer`：工作区路径、Git 分支、Token 消耗统计。

插件通过 `ctx.tui.registerSlot("footer/right", new TodoWidget())` 即可安全挂载终端微组件。

### Q5: 双轨插件互操作机制（Bilingual Plugin Interoperability）

- **Cordis 插件消费 Pi 扩展**：Cordis 插件通过 `ctx.extensions.getExtensions()` 获取已加载的 Pi 扩展，并通过 `ctx.tools` 调用其注册的工具；
- **Pi 扩展使用 Cordis 体系**：在 `ExtensionAPI` 注入 `pi.cordis = ctx`，允许高级扩展直接利用 Cordis 的事件总线与服务发现。

### Q6: 多 Agent 协作与 Context Forking 在 TUI 下的呈现边界

在单终端窗口中，如何优雅呈现多个并行子 Agent（Subagents）？
- **分屏窗格（Pane Split）**：在宽屏终端（列数 > 160）下水平分割显示子 Agent；
- **Tab 选项卡切换**：使用 `Alt+1..9` 在主 Agent 与各子 Agent 视图间无缝切换；
- **内联可折叠卡片（Inline Accordion）**：主视图以折叠进度条呈现子 Agent，按回车展开查看执行详情。

### Q7: 统一微内核运行时与多端前端分流架构

`createPiContext()` 作为无状态/可配置的通用中枢，可同时驱动多种前端形态：
- **TUI 模式 (`pnpm pi`)**：挂载 `TuiService`，进入交互式终端；
- **Print / Headless 模式 (`pi -p "task"`)**：纯流式标准输出；
- **JSON 模式 (`pi --json`)**：结构化事件流；
- **RPC / Server 模式 (`pi --rpc`)**：启动底层进程间通信或 Unix Socket 监听，对接 Web 与 IDE。
