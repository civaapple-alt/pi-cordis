<div align="center">

# 🥧 Pi-Cordis

**专为开发者打造的终端 AI 编码智能体，基于 Cordis (v4.0.1) 微内核与“一切皆插件”架构重构。**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Cordis: v4.0.1](https://img.shields.io/badge/Cordis-v4.0.1-brightgreen.svg?style=flat-square)](vendor/)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict_Mode-blue.svg?style=flat-square)](tsconfig.json)
[![Tests: 38 Passing](https://img.shields.io/badge/Tests-38_Passing-success.svg?style=flat-square)](packages/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/civaapple-alt/pi-cordis/pulls)

[English](README.md) | [中文说明](README.zh.md) | [架构决策记录 (ADR)](.agents/notes/README.zh.md) | [开发与贡献规范](AGENTS.md)

</div>

---

## 📖 渐进式目录索引 (Progressive Index)

- [第一层：快速上手与核心概览](#-第一层快速上手与核心概览)
  - [项目定位与核心价值](#项目定位与核心价值)
  - [清晰的 4 层架构金字塔](#清晰的-4-层架构金字塔)
  - [1 分钟快速上手](#1-分钟快速上手)
  - [核心特性全景对比矩阵](#核心特性全景对比矩阵)
- [第二层：3 大场景预设 (Default is Best)](#-第二层3-大场景预设-default-is-best)
  - [1. 标准开发模式 (`default`)](#1-标准开发模式-default)
  - [2. 规划与审计模式 (`plan`)](#2-规划与审计模式-plan)
  - [3. 编程化工具调用模式 (`ptc`)](#3-编程化工具调用模式-ptc)
- [第三层：核心架构与 5 大设计准则](#-第三层核心架构与-5-大设计准则)
  - [DSH 5 大核心架构准则 (The 5 Pillars)](#dsh-5-大核心架构准则-the-5-pillars)
  - [10 大原生 Cordis 核心服务](#10-大原生-cordis-核心服务)
  - [15 个内置插件工作区](#15-个内置插件工作区)
  - [双轨 HMR 热重载与 7 大 TUI 交互槽位](#双轨-hmr-热重载与-7-大-tui-交互槽位)
- [第四层：仓库目录、质量门禁与决策清单](#-第四层仓库目录质量门禁与决策清单)
  - [代码库目录组织](#代码库目录组织)
  - [自动化测试与质量门禁](#自动化测试与质量门禁)
  - [架构决策记录 (ADRs) 索引](#架构决策记录-adrs-索引)

---

## 🚀 第一层：快速上手与核心概览

### 项目定位与核心价值
**Pi-Cordis** 深度融合了 [`earendil-works/pi`](https://github.com/earendil-works/pi) 极简纯粹的终端交互灵魂与 **Cordis v4.0.1** 的微内核控制面：

1. **100% 保持 Pi 的功能与 TUI 体验**：保留全屏 Canvas、双缓冲 Diff 对比、分支树选择器、状态看板与流式 Markdown 高亮，零用户体验降级；
2. **“一切皆插件”的服务化解耦**：将配置、鉴权、多模型驱动、工具注册、会话存储、技能、提示词、扩展系统、包管理器与智能体推理循环 10 大能力全面重构为 Cordis 响应式服务；
3. **上游彻底解耦直连**：直接通过 npm 消费官方 `@earendil-works/pi-coding-agent: ^0.84.2`，清空本地冗余克隆源码，一条 `pnpm update` 即可无感升级上游能力；
4. **“Default is Best” 极简哲学**：无需复杂配置，默认启动即具备完整安全拦截、Git 检查点、规则自动注入与待办追踪；
5. **PTC 编程化调用 (Code Mode)**：将 5~10 轮串行网络交互坍缩为 1 轮本地程序化执行（在独立 Node.js Worker 线程中执行强类型 TypeScript SDK），节省 90%+ 上下文；
6. **命令行与用户数据物理隔离**：独立注册 `picds`/`picordis` CLI 命令与 `~/.picds/agent/` 用户空间，防止与本地全局安装的原生 Pi 发生冲突；
7. **生态完全兼容**：全面支持 [`pi.dev/packages`](https://pi.dev/packages) 社区扩展市场。

### 清晰的 4 层架构金字塔

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Level 4: 场景预设与原生插件生态 (presets/*, packages/plugins/*)        │
│   ├── 3 大场景化预设 (default, plan, ptc)                              │
│   └── 15 个原生 Cordis 插件 (safety-gate, git-guard, todo-tracker...)   │
├────────────────────────────────────────────────────────────────────────┤
│ Level 3: Cordis 微内核控制面与服务网格 (@pi-cordis/core)               │
│   ├── 10 大核心响应式服务 (Settings, Auth, AI, Tools, Session...)      │
│   ├── 统一中央事件总线 (Central EventBus -> pi/* 响应式事件流)         │
│   ├── 原生终端增强能力 (OSC 777 系统级通知, /btw 零污染侧信道问答)     │
│   └── 两阶段微内核 CLI 启动器 (picds, picordis)                        │
├────────────────────────────────────────────────────────────────────────┤
│ Level 2: 上游 Coding 场景特化层 (@earendil-works/pi-coding-agent)      │
│   ├── 交互式终端 TUI Canvas & Diff 差异对比组件                        │
│   ├── 编程场景专用系统提示词与编码工具实现                             │
│   └── 多轮智能体推理循环调度器                                         │
├────────────────────────────────────────────────────────────────────────┤
│ Level 1: 上游通用 Agent 底座内核 (@earendil-works/pi-agent-core)       │
│   ├── LLM 供应商适配器与多模型流式传输                                 │
│   └── 核心工具抽象与执行基元                                           │
└────────────────────────────────────────────────────────────────────────┘
```

### 1 分钟快速上手

```bash
# 1. 源码克隆与安装
git clone https://github.com/civaapple-alt/pi-cordis.git
cd pi-cordis
pnpm install

# 2. 配置 API Key (.env)
echo "DEEPSEEK_API_KEY=sk-your-key" > .env

# 3. 启动交互式终端 (Default is Best: 全功能就绪且自带最高安全防线)
pnpm picds

# 4. 在终端中即时切换场景模式
/profile plan
/profile ptc
```

### 核心特性全景对比矩阵

| 核心能力 | 原生 Pi | Pi-Cordis | 核心亮点 |
| :--- | :---: | :---: | :--- |
| **交互式终端 TUI** | ✅ | ✅ | 全屏 Canvas、双缓冲 Diff、会话树分支切换、状态栏部件 |
| **基础编码工具** | ✅ | ✅ | 内置 `read`, `write`, `edit`, `bash` + 可选 `grep`, `find`, `ls` |
| **多模型运行时** | ✅ | ✅ | 支持 1307+ 个模型 (DeepSeek, OpenAI, Anthropic, Gemini, Ollama 等) |
| **微内核 IoC 引擎** | ❌ | ✅ | 可逆副作用收集 (`ctx.effect`)，强类型服务注入 (`static provide`) |
| **显式 `inject` 沙箱** | ❌ | ✅ | `inject = ['tools']` 依赖访问控制，拓扑排序无序启动 |
| **副作用可逆销毁** | ❌ | ✅ | 所有注册必返回 `Disposer` 销毁函数，彻底消灭僵尸监听器 |
| **双轨分层 HMR** | ❌ | ✅ | 极速编程式核心启动 + 零重启 YAML 预设与插件源码热重载 |
| **3 大场景化预设** | ❌ | ✅ | `default` (标准开发), `plan` (只读规划), `ptc` (编程调用) |
| **PTC / Code Mode** | ❌ | ✅ | 动态 `.d.ts` SDK + 单一 `run_code` 入口 + Worker 线程沙箱 |
| **系统级终端通知 (OSC 777)** | ❌ | ✅ | 长轮次完成或等待提问时向 Warp / Ghostty / iTerm2 发送桌面通知 |
| **零污染侧信道问答** | ❌ | ✅ | `/btw <问题>` 快捷解答旁支疑问，不污染主会话上下文与历史日志 |

---

## 🎯 第二层：3 大场景预设 (Default is Best)

践行 **“默认即最佳 (Default is Best)” 极简设计哲学**，彻底废除基于内部开关排列组合的繁杂预设，收敛为 **3 个语义鲜明、形态迥异的场景化 Agent 模式**：

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        3 大核心场景预设 (Presets)                       │
├────────────────────────────────────────────────────────────────────────┤
│ 🌟 1. default (标准开发模式) : 开箱即用全能安全，规则注入 + 任务追踪   │
│ 🛡️ 2. plan (规划与审计模式) : 严格只读保护，步骤状态机 + 拦截写操作   │
│ ⚡ 3. ptc (编程调用模式)     : 强类型 TypeScript SDK + 1 轮极速批处理  │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. 标准开发模式 (`default`)
- **定位**：**默认即最佳**。适用于 95% 以上的日常 AI 辅助编码工作；
- **激活能力**：`safety-gate` (高危命令与敏感路径拦截)、`git-guard` (快照检查点)、`rules-injector` (自动扫描 `AGENTS.md`/`CLAUDE.md`)、`todo-tracker` (四态任务管理)、`output-truncator` (双端保留与 Spill 溢出转存)、`ask-question` (推荐高亮问答)、`subagent` (子智能体派生)、`context-compactor`、`git-automation`、`session-handoff`、`ssh-delegator`、`tools-manager`。
- **使用**：直接执行 `pnpm picds`，零配置启动。

### 2. 规划与审计模式 (`plan`)
- **定位**：专用于大型重构、架构探索、需求拆解与安全审计的**只读沙箱模式**；
- **激活能力**：`plan-mode` (步骤状态机与进度条)、`safety-gate` (`readOnly: true` 强制阻断一切写操作)、`rules-injector`、`todo-tracker`、`output-truncator`、`ask-question`、`context-compactor`。
- **使用**：在 TUI 中输入 `/profile plan` 或 CLI 启动 `pnpm picds --profile plan`。

### 3. 编程化工具调用模式 (`ptc`)
- **定位**：专用于海量文件扫描、批量文本替换与复杂数据过滤的**程序化调用模式**；
- **激活能力**：`code-mode` (动态 `.d.ts` 生成 + 表现层工具遮蔽 + `worker_threads.Worker` 独立线程沙箱)、`safety-gate`、`git-guard`、`rules-injector`、`todo-tracker`、`output-truncator`、`context-compactor`。
- **使用**：在 TUI 中输入 `/profile ptc` 或 CLI 启动 `pnpm picds --profile ptc`。

---

## 🏛️ 第三层：核心架构与 5 大设计准则

### DSH 5 大核心架构准则 (The 5 Pillars)
系统内所有服务与插件严格遵循：
1. **能力接缝 (Capability Seam)**：强类型契约 (`types.ts`)、解耦的服务提供者 (`services/*.ts`) 与显式依赖声明 (`inject = [...]`)。
2. **可逆销毁 (Reversibility & Fiber Teardown)**：动态注册均返回 `this.ctx.effect()` 注销句柄，在 Fiber 卸载时自动回收。
3. **响应式事件总线 (Reactive Event Bus)**：在中央 Cordis 总线上广播细粒度类型化事件 (`pi/settings-updated`、`pi/tool-call`、`pi/session-created` 等)。
4. **瀑布与串行拦截链 (Waterfall & Interceptors)**：支持前置校验、耗时统计与后置处理拦截管道。
5. **作用域隔离 (Context Isolation)**：支持 `ctx.extend()` 子 Fiber 派生与零环境污染。

### 10 大原生 Cordis 核心服务

各服务详细使用指南与接口文档见 [`packages/core/docs/cordis/services/`](packages/core/docs/cordis/services/README.zh.md)：

| 核心服务 | 挂载属性 | 核心职责与事件流 |
| :--- | :--- | :--- |
| **SettingsService** | `ctx.settings` | 全局与项目级配置管理；广播 `pi/settings-updated`。 |
| **AuthService** | `ctx.auth` | 凭证与 API Key 存取；广播 `pi/auth-updated`。 |
| **AIService** | `ctx.ai` | 多模型运行时封装与动态 Provider 注册；广播 `pi/model-change`。 |
| **ToolRegistryService** | `ctx.tools` | 7 大内置工具、动态工具、模型侧屏蔽过滤与 `executeTool` 拦截管道。 |
| **SessionService** | `ctx.session` | SQLite 与内存会话工厂、活跃池追踪；广播 `pi/session-created`/`closed`。 |
| **SkillsService** | `ctx.skills` | 本地与动态技能发现；广播 `pi/skill-registered`。 |
| **PromptsService** | `ctx.prompts` | 提示词模板引擎与动态模板注册；广播 `pi/prompt-registered`。 |
| **ExtensionService** | `ctx.extensions` | 加载 Pi 扩展并桥接 `ExtensionAPI` 至 Cordis 事件与 7 大 TUI 槽位。 |
| **PackageManagerService** | `ctx.packageManager` | 扩展包安装生命周期与实时进度流 `pi/package-progress`。 |
| **AgentService** | `ctx.agent` | 编排 `AgentSession` 完整生命周期与多轮事件映射。 |

### 17 个内置插件工作区

所有原生插件均位于 `packages/plugins/*`：

| 插件名称 | 对应 npm 包名 | 核心特性与亮点 |
| :--- | :--- | :--- |
| **`code-mode`** | `@pi-cordis/plugin-code-mode` | PTC 模式：动态 `.d.ts` + `worker_threads` 沙箱 + 工具屏蔽。 |
| **`output-truncator`** | `@pi-cordis/plugin-output-truncator` | Head (30) + Tail (20) 双端保留 + `.pi/spill/` 溢出转存。 |
| **`safety-gate`** | `@pi-cordis/plugin-safety-gate` | 命令 AST 正则识别 + 敏感文件黑名单 + 只读模式拦截。 |
| **`git-guard`** | `@pi-cordis/plugin-git-guard` | 脏仓库状态告警 + 轮次级 `git stash create` 轻量快照。 |
| **`ask-question`** | `@pi-cordis/plugin-ask-question` | 交互式多问题批处理 + `(Recommended)` 推荐选项高亮。 |
| **`plan-mode`** | `@pi-cordis/plugin-plan-mode` | 步骤状态机 + 进度仪表盘 + 规划期写工具强制拦截。 |
| **`todo-tracker`** | `@pi-cordis/plugin-todo-tracker` | 四态任务管理 + 拓扑排序依赖环路校验 + 提示词自适应折叠压缩。 |
| **`subagent`** | `@pi-cordis/plugin-subagent` | `ctx.session.inMemory()` 物理会话隔离 + 派生深度限制 + 角色工具切片。 |
| **`context-compactor`**| `@pi-cordis/plugin-context-compactor` | 四维资产结构化压缩（文件、决策、修复、待办）。 |
| **`session-handoff`** | `@pi-cordis/plugin-session-handoff` | 标准化交接信封 (Handoff Envelope) 与 Markdown 产物。 |
| **`git-automation`** | `@pi-cordis/plugin-git-automation` | 暂存区语义分析与 Conventional Commit 规范生成。 |
| **`ssh-delegator`** | `@pi-cordis/plugin-ssh-delegator` | 远程 SSH 工具代理与连接延迟探测。 |
| **`rules-injector`** | `@pi-cordis/plugin-rules-injector` | 多目录规则发现与 SHA-256 缓存（维持 KV-Cache 稳定）。 |
| **`tools-manager`** | `@pi-cordis/plugin-tools-manager` | 动态能力切片与工具可见性管理。 |
| **`btw`** | `@pi-cordis/plugin-btw` | 零上下文污染旁路问答：通过 `ctx.ai` 单轮推理并在 TUI 展示，不写日志。 |
| **`terminal-notifier`** | `@pi-cordis/plugin-terminal-notifier` | 原生桌面通知：向 Warp/Ghostty/iTerm2 发射 `OSC 777` 弹窗。 |
| **`profiles`** | `@pi-cordis/profiles` | 预设解析加载器、`/profile` 切换命令与双轨 HMR 引擎。 |

### 双轨 HMR 热重载与 7 大 TUI 交互槽位
- **双轨分层 HMR**：极速编程式核心启动 + 零重启 YAML 预设与插件源码热重载（通过 `pathToFileURL + ?t=timestamp` 穿透 Node.js 缓存），会话树与内存寄存器全程无损；
- **7 大 TUI 交互槽位**：无缝驱动 Select 单选菜单、Confirm 确认弹窗、Header/Footer 状态条、Toast 提示、自定义工具图形渲染器、消息折叠渲染器与状态栏指标。

---

## 📂 第四层：仓库目录、质量门禁与决策清单

### 代码库目录组织

```text
pi-cordis/
├── vendor/                           # Vendored Cordis (v4.0.1) 微内核源码
│   ├── cordis/                       # @deepseek-ai/cordis
│   ├── cosmokit/                     # @deepseek-ai/cosmokit
│   └── schemastery/                  # @deepseek-ai/schemastery
│
├── presets/                          # 🌟 3 大场景化 Agent 运行预设
│   ├── default/                      # preset.yml + cordis.yml (默认即最佳)
│   ├── plan/                         # preset.yml + cordis.yml (规划与审计)
│   └── ptc/                          # preset.yml + cordis.yml (编程调用)
│
├── packages/
│   ├── core/                         # @pi-cordis/core (CLI 入口、10 大 Cordis 服务与微内核引导器)
│   │   ├── docs/cordis/services/     # 10 大核心服务独立详细文档
│   │   └── src/core/cordis/          # 10 大核心服务 + createPiContext + profile command
│   └── plugins/                      # 🌟 15 个原生 Cordis 插件工作区
│
├── .agents/notes/                    # 架构决策记录 (ADRs)
│   ├── implemented/architecture/     # 已实施的核心架构决策
│   ├── implemented/simplification/   # 精简与解耦决策
│   ├── archived/architecture/        # 历史归档快照
│   └── README.zh.md                  # 中文决策索引与演进方法论
│
├── CHANGELOG.md                      # 中文更新日志 (Keep a Changelog)
├── pnpm-workspace.yaml               # pnpm 工作区关联
└── tsconfig.json                     # 统一 TypeScript 路径映射配置
```

### 自动化测试与质量门禁

```bash
# 运行全套 Cordis 核心服务、原生插件、预设与 HMR 单元测试
pnpm test

# TypeScript 严格类型检查
pnpm run check

# 启动全屏终端实机体验
pnpm picds
```

### 架构决策记录 (ADRs) 索引

完整架构决策清单见 [`.agents/notes/README.zh.md`](.agents/notes/README.zh.md)：

| 制定日期 | 决策标题 | 状态 |
| :--- | :--- | :--- |
| `2026-08-19` | [Pi-Cordis 基于 Cordis v4.0.1 的微内核架构演进](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-microkernel-architecture.zh.md) | `implemented` |
| `2026-08-19` | [Pi-Cordis 服务矩阵与扩展生态融合](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-services-and-plugin-ecosystem.zh.md) | `implemented` |
| `2026-08-19` | [Pi-Cordis TUI 与控制面重构的工程取舍分析](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-tui-and-control-plane-tradeoffs.zh.md) | `implemented` |
| `2026-08-19` | [Pi-Cordis 代码库精简与上游解耦架构方案](.agents/notes/implemented/simplification/2026-08-19-pi-cordis-repository-simplification.zh.md) | `implemented` |
| `2026-08-19` | [Pi-Cordis 原生插件生态全景规划与优先级演进矩阵](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-plugin-ecosystem-roadmap-and-priority.zh.md) | `implemented` |
| `2026-08-20` | [Pi-Cordis 加载器权衡与双轨 HMR 热重载架构](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-loader-and-dual-track-hmr-architecture.zh.md) | `implemented` |
| `2026-08-20` | [Pi-Cordis 能力接缝、显式注入与 TUI 交互桥接设计](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-capability-seams-inject-and-tui-bridge.zh.md) | `implemented` |
| `2026-08-20` | [Pi-Cordis “注册即副作用，副作用必可逆” 与 Disposer 模式深度实践](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-reversible-side-effects-and-disposer-pattern.zh.md) | `implemented` |
| `2026-08-20` | [Pi-Cordis 编程化工具调用（PTC / Code Mode）架构设计](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-ptc-code-mode-architecture-proposal.zh.md) | `implemented` |
| `2026-08-20` | [Pi-Cordis 极简设计哲学与 “Default is Best” 预设体系重构](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-minimalist-presets-and-default-is-best-philosophy.zh.md) | `implemented` |
| `2026-08-20` | [Pi-Cordis 全套内置插件最优解架构演进蓝图与实践指南](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-plugin-ecosystem-optimal-architecture-and-roadmap.zh.md) | `implemented` |
| `2026-08-20` | [Pi-Cordis: 核心控制面彻底解耦、分层架构落地与上游零负担升级方案](.agents/notes/implemented/simplification/2026-08-20-pi-cordis-core-decoupling-and-layered-architecture.zh.md) | `implemented` |
| `2026-08-20` | [Pi-Cordis 智能体自我认知（Self-Inspection）架构演进与知识沉淀](.agents/notes/implemented/architecture/2026-08-20-pi-cordis-agent-self-inspection-and-introspection-architecture.zh.md) | `implemented` |
| `2026-08-19` | [Pi AgentHarness 工业级事务规格与 Cordis 微内核架构融合](.agents/notes/archived/architecture/2026-08-19-pi-agent-harness-specification-and-cordis-integration.zh.md) | `archived` |

---

## 📄 开源协议

[MIT](LICENSE) © 2026 civaapple-alt & Earendil Works.
