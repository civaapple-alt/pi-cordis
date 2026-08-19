<div align="center">

# 🥧 Pi-Cordis

**专为开发者打造的终端 AI 编码智能体，基于 Cordis (v4.0.1) 微内核与“一切皆插件”架构重构。**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Cordis: v4.0.1](https://img.shields.io/badge/Cordis-v4.0.1-brightgreen.svg?style=flat-square)](vendor/)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict_Mode-blue.svg?style=flat-square)](tsconfig.json)
[![Tests: 3500+ Passing](https://img.shields.io/badge/Tests-3500+_Passing-success.svg?style=flat-square)](packages/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/civaapple-alt/pi-cordis/pulls)

[English](README.md) | 中文说明 | [架构决策记录 (ADR)](.agents/notes/README.zh.md) | [开发与贡献规范](AGENTS.md)

</div>

---

## 📖 目录索引

- [项目概述](#-项目概述)
- [快速开始](#-快速开始)
- [核心特性对比矩阵](#-核心特性对比矩阵)
- [原生 Cordis 插件与 Presets 预设矩阵](#-原生-cordis-插件与-presets-预设矩阵)
- [交互式 TUI /profile 斜杠命令](#-交互式-tui-profile-斜杠命令)
- [架构拓扑与控制面](#-架构拓扑与控制面)
- [Cordis 10 大核心服务矩阵](#-cordis-10-大核心服务矩阵)
- [双轨插件与扩展生态](#-双轨插件与扩展生态)
- [仓库目录结构](#-仓库目录结构)
- [质量门禁与测试体系](#-质量门禁与测试体系)
- [架构决策记录 (ADRs)](#-架构决策记录-adrs)
- [开源协议](#-开源协议)

---

## 🌟 项目概述

**Pi-Cordis** 融合了 [`earendil-works/pi`](https://github.com/earendil-works/pi) 极简纯粹的 Coding 核心能力与极速交互式终端 UI（TUI），以及 **Cordis v4.0.1** 的依赖注入（IoC）与“一切皆插件（Everything is a plugin）”设计哲学。

### 为什么选择 Pi-Cordis？

1. **100% 保持 Pi 的功能与 TUI 体验**：保留全屏交互式终端、Diff 代码对比、会话分支树切换、状态看板与 Prompt 模板，零用户体验降级；
2. **“一切皆插件”的服务化解耦**：将配置、鉴权、多模型驱动、工具注册、会话存储、技能、提示词、扩展系统、包管理器与智能体推理循环 10 大能力全面重构为 Cordis 一等公民服务；
3. **独立插件包与 Presets 独立目录（类似 `pi-dsh/presets`）**：在 `packages/plugins/*` 提供自治插件包，在 `presets/<name>/`（包含 `preset.yml` 与 `cordis.yml`）提供声明式预设，零修改源码即可扩展；
4. **运行时热切换（`/profile`）**：在 TUI 终端中通过斜杠命令即时查看、选择与切换不同安全等级与能力组合；
5. **全面兼容 `pi.dev/packages` 插件市场**：支持通过 `npm:`、`git:` 或本地路径一键安装社区扩展（如 `@juicesharp/rpiv-todo`）；
6. **严格依赖隔离**：完全独立自洽，零依赖 DSH 业务插件，底层仅依赖 `vendor/` 下的 Cordis 内核套件。

---

## ⚡ 快速开始

### 1. 环境准备

- **Node.js**: `>= 20.0.0`
- **pnpm**: `>= 9.0.0`

### 2. 源码克隆与依赖安装

```bash
git clone https://github.com/civaapple-alt/pi-cordis.git
cd pi-cordis
pnpm install
```

### 3. 配置 API Key

在项目根目录创建 `.env` 或配置环境变量：

```env
# DeepSeek (推荐)
DEEPSEEK_API_KEY=sk-your-deepseek-api-key

# 或 OpenAI / Anthropic / Gemini / Ollama
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-your-anthropic-api-key
```

### 4. 运行体验

```bash
# 启动全屏交互式 TUI
pnpm pi

# 在 TUI 终端中即时切换 Profile 预设
/profile safe
/profile full

# 非交互模式执行单次任务（打印输出）
pnpm pi -p "检查当前项目结构并列出 10 大核心服务"

# 一键安装社区插件
pnpm pi install npm:@juicesharp/rpiv-todo
```

---

## 🎯 核心特性对比矩阵

| 能力维度 | 原生 Pi | Pi-Cordis | 亮点说明 |
| :--- | :---: | :---: | :--- |
| **交互式终端 TUI** | ✅ | ✅ | 全屏 Canvas、双缓冲 Diff 对比、分支树选择器、状态看板 |
| **核心编码工具集** | ✅ | ✅ | 内置 `read`, `write`, `edit`, `bash` + 可选 `grep`, `find`, `ls` |
| **多模型运行时** | ✅ | ✅ | 内置 1307+ 个模型（DeepSeek, OpenAI, Anthropic, Gemini, Ollama 等） |
| **微内核 IoC 控制体系** | ❌ | ✅ | 可逆副作用回收（`ctx.effect`）、服务自动注入（`static provide`） |
| **原生 Cordis 插件集合** | ❌ | ✅ | `packages/plugins/*` 模块化子包（安全拦截、Git 守护、待办、规则） |
| **独立 Presets 目录预设** | ❌ | ✅ | `presets/<name>/` 目录结构（`preset.yml` + `cordis.yml`）声明式扩展 |
| **TUI `/profile` 热切换** | ❌ | ✅ | 终端输入 `/profile` 支持 Tab 补全与交互式下拉选择菜单 |
| **扩展市场生态兼容** | ✅ | ✅ | 100% 兼容 `pi.dev/packages`，透明桥接 `ExtensionAPI` 至事件总线 |
| **零 DSH 业务依赖** | N/A | ✅ | 独立自洽，仅使用 `vendor/` 下的 Cordis 纯净内核 |

---

## 🧩 原生 Cordis 插件与 Presets 预设矩阵

### 1. 四大原生 Cordis 插件 (`packages/plugins/*`)

- 🔒 **`@pi-cordis/plugin-safety-gate`**：阻断破坏性 Shell 命令（`rm -rf /`, `mkfs`）与敏感配置文件篡改（`.env`, `.git/`, `id_rsa`）。
- 🛡️ **`@pi-cordis/plugin-git-guard`**：感知工作区脏状态，在关键操作轮次自动创建 `git stash` 检查点以供安全回滚。
- 📋 **`@pi-cordis/plugin-todo-tracker`**：注册 `todo_write`/`todo_read` 待办工具并自动将活跃任务注入提示词。
- 📜 **`@pi-cordis/plugin-rules-injector`**：自动扫描 `AGENTS.md`、`.claude/rules/*.md`、`.cursorrules` 并注入上下文提示词。

### 2. 五大开箱即用 Presets 目录预设 (`presets/`)

```text
presets/
├── default/    # 规则注入 + 待办任务追踪 (日常标准开发)
├── safe/       # 安全拦截 + Git 检查点 + 规则注入 + 待办追踪 (安全生产工程)
├── strict/     # 只读安全拦截 + Git 检查点 + 规则注入 (严格代码审计)
├── full/       # 激活全部 4 大原生 Cordis 插件能力 (全能极客模式)
└── minimal/    # 零额外插件，仅保留 10 大核心微内核服务 (超轻量纯净模式)
```

---

## 🕹️ 交互式 TUI `/profile` 斜杠命令

在 `pnpm pi` 交互式会话中，可随时使用 `/profile` 查看与切换预设：

```text
/profile safe       ── 立即切换至【安全生产工程模式】
/profile full       ── 立即切换至【全能极客模式】
/profile default    ── 立即切换至【标准日常模式】
/profile minimal    ── 立即切换至【极简微内核模式】
```

直接输入 `/profile` 并回车，将弹出交互式高亮选择菜单：
```text
┌─ Select Cordis Profile ────────────────────────────────────────────────────────┐
│ > default - Standard coding agent with rule injection and todo task tracking  │
│   safe    - Safe engineering mode with destructive action blocking & git stash│
│   strict  - Strict security mode with read-only inspection & dangerous block   │
│   full    - Power user mode with all native Cordis plugins activated           │
│   minimal - Zero extra plugins for raw, lightweight execution                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏛️ 架构拓扑与控制面

Pi-Cordis 采用经典的**绞杀者模式（Strangler Fig Pattern）**：

```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │                 Cordis 微内核控制面 (v4.0.1 Microkernel)               │
  │     Context 容器 / static provide / 生命周期事件 / 插件与 Presets 扫描  │
  └──────────────────┬──────────────────────────────────┬──────────────────┘
                     │                                  │
      ┌──────────────▼─────────────┐      ┌─────────────▼──────────────┐
      │  Service 插件适配包装层    │      │  ExtensionAPI 桥接适配器   │
      │  (Settings, AI, Tools...)  │      │  (pi.on <-> ctx.on)        │
      └──────────────┬─────────────┘      └─────────────┬──────────────┘
                     │                                  │
  ┌──────────────────▼──────────────────────────────────▼──────────────────┐
  │                        Pi 底层数据与算法面                             │
  │      LLM Stream Token 处理 / 会话分支树 / TUI 双缓冲字符渲染引擎        │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 🎛️ Cordis 10 大核心服务矩阵

| 服务类 | 挂载属性 | 核心职责 |
| :--- | :--- | :--- |
| `SettingsService` | `ctx.settings` | 全局 (`~/.pi/agent/settings.json`) 与项目 (`.pi/settings.json`) 配置管理 |
| `AuthService` | `ctx.auth` | API 密钥、OAuth 令牌与凭证安全存储 |
| `AIService` | `ctx.ai` | 多模型运行时封装，内置 1307+ 个模型定义与 Token 消耗统计 |
| `ToolRegistryService` | `ctx.tools` | 统一管理 7 大内置编码工具与动态自定义工具注册中心 |
| `SessionService` | `ctx.session` | SQLite 与内存会话持久化存储、多分支树切换与会话导出 |
| `SkillsService` | `ctx.skills` | 自动扫描、解析并提供提示词与目录技能 |
| `PromptsService` | `ctx.prompts` | 提示词模板引擎与参数变量插值 |
| `ExtensionService` | `ctx.extensions` | 加载 Pi 原生扩展并透明桥接 `ExtensionAPI` 至 Cordis 事件 |
| `PackageManagerService` | `ctx.packageManager` | 跨 `pi.dev`、npm、git 与本地来源的插件包安装管理 |
| `AgentService` | `ctx.agent` | 智能体多轮会话推理循环调度 |

---

## 📂 仓库目录结构

```text
pi-cordis/
├── vendor/                           # Vendored Cordis (v4.0.1) 内核套件
│   ├── cordis/                       # @deepseek-ai/cordis
│   ├── cosmokit/                     # @deepseek-ai/cosmokit
│   └── schemastery/                  # @deepseek-ai/schemastery
│
├── presets/                          # 🌟 声明式 Agent 能力与 Profile 预设目录
│   ├── default/                      # preset.yml + cordis.yml
│   ├── safe/                         # preset.yml + cordis.yml
│   ├── strict/                       # preset.yml + cordis.yml
│   ├── full/                         # preset.yml + cordis.yml
│   └── minimal/                      # preset.yml + cordis.yml
│
├── packages/
│   ├── coding-agent/                 # CLI 入口、TUI 界面与 Cordis 引导器
│   │   └── src/core/cordis/          # 10 大核心服务 + createPiContext + profile command
│   └── plugins/                      # 🌟 原生 Cordis 插件集合
│       ├── safety-gate/              # @pi-cordis/plugin-safety-gate
│       ├── git-guard/                # @pi-cordis/plugin-git-guard
│       ├── todo-tracker/             # @pi-cordis/plugin-todo-tracker
│       ├── rules-injector/           # @pi-cordis/plugin-rules-injector
│       └── profiles/                 # @pi-cordis/profiles (YAML & 目录预设装配中枢)
│
├── .agents/notes/                    # 架构决策记录 (ADR)
│   ├── implemented/architecture/     # 架构与生态决策
│   ├── implemented/simplification/   # 仓库精简与解耦决策
│   └── README.zh.md                  # 中文索引
│
├── CHANGELOG.md                      # 中文更新日志 (Keep a Changelog)
├── pnpm-workspace.yaml               # pnpm 工作区配置
└── tsconfig.json                     # TypeScript 统一路径映射
```

---

## 🧪 质量门禁与测试体系

```bash
# 运行全部 Cordis 服务、原生插件与 Presets 专属测试
npx vitest run packages/coding-agent/test/cordis-plugins-and-profiles.test.ts packages/coding-agent/test/cordis-bootstrap.test.ts

# TypeScript 类型检查
pnpm run check

# 启动交互式终端体验
pnpm pi
```

---

## 📝 架构决策记录 (ADRs)

| 提出日期 | 决策标题 | 核心主题 |
| :--- | :--- | :--- |
| `2026-08-19` | [Pi-Cordis: 基于 Cordis v4.0.1 的微内核架构设计](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-microkernel-architecture.zh.md) | “一切皆插件”哲学、Vendored Cordis、严格依赖隔离、100% 保持 Pi 体验 |
| `2026-08-19` | [Pi-Cordis: 服务矩阵划分与扩展生态集成](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-services-and-plugin-ecosystem.zh.md) | 10 大核心服务、`pi.dev/packages` 插件市场兼容、`ExtensionAPI` 事件桥接 |
| `2026-08-19` | [Pi-Cordis: TUI、UI 插件体系与控制面重构权衡](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-tui-and-control-plane-tradeoffs.zh.md) | 控制面重构代价、TUI 静默装配、字符终端与 WebServer 困境、7 插槽演进 |
| `2026-08-19` | [Pi-Cordis: 仓库精简与上游依赖解耦](.agents/notes/implemented/simplification/2026-08-19-pi-cordis-repository-simplification.zh.md) | 移除 1200+ 冗余源码文件、直接消费官方 npm 依赖、仓库体积骤降 85% |
| `2026-08-19` | [Pi AgentHarness: 工业级事务规格与 Cordis 架构融合](.agents/notes/implemented/architecture/2026-08-19-pi-agent-harness-specification-and-cordis-integration.zh.md) | 三存储模型、副作用三明治（Effect Sandwich）、Lanes 多车道并发 |
| `2026-08-19` | [Pi-Cordis: 原生 Cordis 插件与独立 Presets 目录体系](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-native-plugins-and-profiles.zh.md) | 独立子包工作区（`packages/plugins/*`）、独立 `presets/` 目录规范、`/profile` 终端热切换 |

---

## 📄 开源协议

[MIT](LICENSE) © 2026 civaapple-alt & Earendil Works.
