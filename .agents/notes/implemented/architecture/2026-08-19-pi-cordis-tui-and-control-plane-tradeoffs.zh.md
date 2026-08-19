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

#### 1. 为什么表面上看起来“这么简单”？
通过在 `packages/coding-agent/src/core/cordis/` 建立 10 大核心服务与 `createPiContext()` 引导器，我们快速完成了 Cordis 微内核对整个 Pi 的控制权接管。其可行性源于：
- **Pi 原生架构高度模块化**：`pi-ai`、`pi-agent-core`、`pi-tui` 本身职责划分清晰，无恶性全局状态；
- **经典绞杀者模式（Strangler Fig Pattern）**：不盲目推倒底层数十万行经过严密测试的算法代码，而是在装配层建立高维控制面（IoC 容器与事件总线）；
- **TypeScript 声明合并（Declaration Merging）**：通过 `declare module "@deepseek-ai/cordis"` 在编译期无缝注入服务类型。

#### 2. 背后付出的 4 大真实代价与隐性成本
- **代价 1：双重事件体系与桥接开销（Indirection Overhead）**：维护了 Pi 的原生 `ExtensionAPI`（钩子式）与 Cordis `Context`（服务与事件总线）两套概念映射，存在微小的事件转发开销；
- **代价 2：绕过微内核的“双轨制风险”（Bypass Risk）**：底层子包仍是独立的 npm 包，需依靠工程规范约束开发者必须通过 `ctx.*` 消费能力，避免私自 `new Agent()` 导致实例游离于微内核监管之外；
- **代价 3：Cordis 深度特性尚未完全施展（HMR & Forking Limits）**：由于某些底层模块包含静态缓存或终端句柄，目前尚无法做到 100% 细粒度的运行时插件热卸载（HMR）与无泄漏的上下文深度分叉（Context Forking）；
- **代价 4：团队心智模型迁移成本（Mental Model Shift）**：开发者必须理解依赖注入（IoC）、服务提供者协议（`static provide`）、副作用自动回收（`ctx.effect`）与异步微任务 Fiber 激活调度机制。

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
