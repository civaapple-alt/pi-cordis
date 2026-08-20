# Agent Note: Pi-Cordis 智能体自我认知（Self-Inspection）架构演进与知识沉淀

Status: implemented
Created: 2026-08-20

[English](2026-08-20-pi-cordis-agent-self-inspection-and-introspection-architecture.md) | 中文

## 摘要 (Executive Summary)

优秀的 AI 辅助编码智能体绝非机械的“工具调用执行器”，而是必须具备高度清晰的**自我认知（Self-Inspection / Introspection）与环境自知能力**。

原生 [`earendil-works/pi`](https://github.com/earendil-works/pi) 的核心优势之一就是具备出色的自省传统——它在系统提示词中注入自身文档、扩展范例、项目规则与技能列表，使 Agent 能够“认知自身”并自主开发扩展或适配项目规范。

**Pi-Cordis 100% 完整继承了原生 Pi 的这一优良传统，并基于 Cordis 微内核将其升维为一套结构化的“5 维自我认知架构模型”**。本文沉淀了 Pi-Cordis 关于智能体自我认知的架构设计、技术实现机制与最佳实践规范。

---

## 一、为什么 Coding Agent 必须具备“自我认知” (The Need for Introspection)

在复杂的真实软件工程场景中，缺乏自我认知的 Agent 极易产生以下致命缺陷：
1. **盲目尝试与幻觉调用**：不知道自身当前拥有的确切工具形态，尝试调用不存在或被禁用的工具；
2. **无法自主定制与扩展自身**：当用户要求“为当前 Agent 编写一个扩展”或“接入一个自定义 Provider”时，Agent 不知道去哪里查阅自身的 SDK 契约与扩展范例；
3. **无视项目规范与边界**：在已定义了严格代码规范（如 `AGENTS.md`、`.cursorrules`）的仓库中盲目重构，破坏既有设计模式；
4. **状态与模式盲区**：在只读审查（`plan`）或编程批处理（`ptc`）模式下，不知道当前处于受限环境，反复产生被拦截的写操作。

---

## 二、Pi-Cordis 5 维自我认知架构模型 (The 5-Dimensional Model)

Pi-Cordis 建立了从“底层文档”、“项目规则”、“服务状态”、“工具形态”到“终端可观测性”的 5 维自省体系：

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   5-Dimensional Self-Inspection Model                  │
├────────────────────────────────────────────────────────────────────────┤
│ 📚 1. 自知文档与扩展知识 : 原生 docs/examples 注入 + 10 大 Core Service 文档 │
│ 📋 2. 自知项目规则与边界 : rules-injector 递归扫描 + SHA-256 KV-Cache 保护│
│ ⚙️ 3. 自知微内核服务状态 : 10 大响应式服务运行时反射 (ctx.settings/tools...)│
│ 🛠️ 4. 自知工具形态与预设 : /profile 预设自检 + PTC 模式动态 .d.ts 遮蔽过滤  │
│ 🖥️ 5. 自知终端与系统呈现 : TUI Microkernel 看板 + OSC 777 桌面通知透视   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 维度 1：自知文档与自研能力 (Self-Documentation & Extension Grounding)

#### 1. 原生 Pi 文档自知机制完整保留
通过直接消费 `@earendil-works/pi-coding-agent`，系统在初始化提示词时自动解析并注入绝对路径：
- `readmePath`：主文档入口；
- `docsPath`：各子系统详细文档（`extensions.md`, `skills.md`, `tui.md`, `custom-provider.md`, `models.md`, `packages.md` 等）；
- `examplesPath`：扩展开发、自定义工具与 SDK 范例目录。

#### 2. Cordis 微内核 10 大服务文档内置
在 [`packages/core/docs/cordis/services/`](../../../packages/core/docs/cordis/services/README.zh.md) 中完整维护了 10 大 Core Service 的 22 篇双语详细 API 契约与使用指南。当用户要求基于 Cordis 扩展能力时，Agent 能够自主查阅这套标准文档。

---

### 维度 2：自知项目规则与边界 (Project Rules & Guidelines)

#### 1. 多层级规则递归发现
由 `@pi-cordis/plugin-rules-injector` 插件监听 `pi/prompt-transform` 事件，全自动扫描：
- 根目录规范文件：`AGENTS.md`、`CLAUDE.md`、`.clauderules`、`.cursorrules`；
- 子目录规则集合：`.claude/rules/*.md`、`.agents/rules/*.md`。

#### 2. SHA-256 哈希缓存（KV-Cache 保护）
不同于每次无脑拼接导致 Token 抖动，`rules-injector` 会计算规则文件组合内容的 SHA-256 哈希值：
```typescript
const combinedRaw = rulesFound.map((r) => `${r.file}:${r.content}`).join("\n---\n");
const currentHash = crypto.createHash("sha256").update(combinedRaw).digest("hex");

if (currentHash === cachedHash && cachedBlock) {
    event.prompt += cachedBlock; // 命中缓存，确保大模型 KV-Cache 前缀 100% 稳定
    return;
}
```
该设计确保了**规则自知**与**大模型推理首字延迟（TTFT）优化**的完美兼得。

---

### 维度 3：自知微内核服务状态 (Microkernel Services Introspection)

#### 1. 运行时强类型服务网格
系统运行在一个统一的 Cordis IoC 容器中，10 大核心服务挂载在 `ctx` 上：
- `ctx.settings`：可自检当前生效的全局与项目配置；
- `ctx.auth`：可自检当前已配置的 Provider 凭证元数据；
- `ctx.ai`：可自检可用模型列表与当前活跃模型；
- `ctx.tools`：可自检当前注册的所有工具及过滤管道；
- `ctx.session`：可自检当前活跃会话与派生树分支；
- `ctx.extensions`：可自检已加载的外部插件及其暴露的能力。

---

### 维度 4：自知工具形态与运行预设 (Dynamic Toolset & Preset Awareness)

#### 1. 场景预设自省 (`/profile`)
Agent 与用户可在终端中运行 `/profile` 命令，即时查看当前激活的 Preset 模式（`default` / `plan` / `ptc`）及当前加载的插件清单。

#### 2. PTC / Code Mode 工具遮蔽自知
在进入 `ptc`（编程工具调用）模式时：
- `ToolRegistryService` 动态遮蔽底层的单步细粒度工具（如 `read`, `write`, `edit`）；
- 向 Agent 暴露动态生成的 TypeScript `.d.ts` SDK 与单一 `run_code` 入口；
- Agent 清晰认识到自身当前处于“批处理执行”模式，自动编写紧凑的 TypeScript 脚本一次性完成数十个文件的批量分析或替换，杜绝多轮低效往返。

---

### 维度 5：自知终端与系统呈现 (Visual & Telemetry Introspection)

#### 1. TUI 启动看板透明化
在终端欢迎界面，显式打印 `[Cordis Microkernel]` 状态徽章与加载的服务/插件，人机双方对系统当前能力达成共识。

#### 2. 原生系统通知 (OSC 777)
Agent 在执行长耗时任务或等待用户输入时，感知终端通知能力并通过 OSC 777 序列向宿主终端（Warp、Ghostty、iTerm2 等）发送桌面通知。

---

## 三、原生 Pi vs Pi-Cordis 自省能力全景对比

| 自省维度 | 原生 Pi 实现 | Pi-Cordis 升维实现 |
|---|---|---|
| **自知自身文档** | 静态注入自身 `docs/` 与 `examples/` 路径 | 完整保留原生文档路径 + 补充 10 大 Core Service 独立 API 契约 |
| **自知项目规则** | 读取根目录单文件规则 | 递归扫描多目录规则文件 + **SHA-256 缓存保护 KV-Cache** |
| **自知服务状态** | 类实例分散，无法全局统一反射 | **Cordis 微内核 IoC 容器统一反射 10 大服务与状态** |
| **自知运行模式** | 无 Preset 概念，工具集静态 | **`/profile` 动态预设自检 + Code Mode 动态工具遮蔽** |
| **自知技能列表** | 格式化 `<available_skills>` 列表 | 完整保留并支持 Cordis 插件动态注册可逆技能 |
| **自知系统呈现** | 基本状态栏指示 | **TUI Microkernel 看板 + OSC 777 系统级桌面通知** |

---

## 四、工程演进规范：如何持续维护与增强自省能力

1. **新插件需提供自描述元数据**：
   - 每个新开发的 `@pi-cordis/plugin-*` 必须在其导出对象中提供清晰的 `name`、`inject` 以及工具/命令的 `description`。
2. **提示词修改必须兼顾 KV-Cache 稳定性**：
   - 任何向系统提示词或 `pi/prompt-transform` 注入动态内容的插件，必须确保内容前缀稳定，严禁在头部插入动态时间戳等导致 KV-Cache 频繁失效的挥发性数据。
3. **工具屏蔽与暴露保持原子性**：
   - 插件通过 `ctx.tools.addFilter()` 改变工具可见性时，必须确保配套的提示词说明同步更新，确保 Agent 认知与实际可用工具 100% 对齐。
