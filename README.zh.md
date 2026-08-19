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
3. **全面兼容 `pi.dev/packages` 插件市场**：支持通过 `npm:`、`git:` 或本地路径一键安装社区扩展（如 `@juicesharp/rpiv-todo`）；
4. **严格依赖隔离**：完全独立自洽，零依赖 DSH 业务插件，底层仅依赖 `vendor/` 下的 Cordis 内核套件。

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

# 非交互模式执行单次任务（打印输出）
pnpm pi -p "检查当前项目结构并列出核心模块"

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
| **扩展市场生态兼容** | ✅ | ✅ | 100% 兼容 `pi.dev/packages`，透明桥接 `ExtensionAPI` 至事件总线 |
| **零 DSH 业务依赖** | N/A | ✅ | 独立自洽，仅使用 `vendor/` 下的 Cordis 纯净内核 |

---

## 🏗️ 架构拓扑与控制面

Pi-Cordis 采用经典的**绞杀者模式（Strangler Fig Pattern）**，将 **Cordis 控制面** 与 **Pi 底层数据与算法面** 严格解耦：

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

---

## 🧩 Cordis 10 大核心服务矩阵

所有核心子系统通过 TypeScript 声明合并挂载至 Cordis `Context`：

| 服务类 | 挂载键 | 核心职责 |
| :--- | :--- | :--- |
| `SettingsService` | `ctx.settings` | 用户配置 (`~/.pi/agent/settings.json`) 与项目配置 (`.pi/settings.json`) 管理 |
| `AuthService` | `ctx.auth` | API 密钥、OAuth 令牌与凭证安全持久化 |
| `AIService` | `ctx.ai` | 1307+ 模型目录索引、流式补全与 Token 消耗追踪 |
| `ToolRegistryService` | `ctx.tools` | 4 大核心工具 + 3 大可选工具与动态扩展工具注册中心 |
| `SessionService` | `ctx.session` | SQLite 与内存会话存储、多分支树切换与会话导出 |
| `SkillsService` | `ctx.skills` | 自动扫描、解析并提供提示词与目录技能 |
| `PromptsService` | `ctx.prompts` | 提示词模板引擎与参数变量插值 |
| `ExtensionService` | `ctx.extensions` | 加载 Pi 扩展并透明桥接 `ExtensionAPI` 至 Cordis 事件总线 |
| `PackageManagerService` | `ctx.packageManager` | 跨 `pi.dev`、npm、git 与本地来源的插件包安装管理 |
| `AgentService` | `ctx.agent` | 智能体多轮会话推理循环与上下文协调调度 |

---

## 🔌 双轨插件与扩展生态

Pi-Cordis 支持双轨并行的插件开发方式：

### 1. Pi 原生社区扩展 (`ExtensionAPI`)
开发者无需了解 Cordis 底层细节，直接编写原生 Pi 扩展：
```typescript
export default function(pi) {
  pi.registerTool({
    name: "my_tool",
    description: "自定义工具",
    parameters: { type: "object", properties: { query: { type: "string" } } },
    execute: async ({ query }) => `查询结果: ${query}`,
  });
}
```

### 2. Cordis 微内核深度插件 (`Context`)
高级开发者可直接编写纯粹的 Cordis 插件，利用全量 IoC 与生命周期拦截：
```typescript
import { Context } from "@deepseek-ai/cordis";

export default function(ctx: Context) {
  ctx.on("pi/tool-call", async ({ name, args }) => {
    console.log(`工具被调用: ${name}`);
  });
}
```

---

## 📂 仓库目录结构

```text
pi-cordis/
├── vendor/                           # Vendored Cordis (v4.0.1) 框架源码
│   ├── cordis/                       # 核心 IoC 容器
│   ├── cosmokit/                     # 底层工具库
│   └── schemastery/                  # Schema 模式校验
├── packages/                         # Monorepo 子包工作区
│   └── coding-agent/                 # 编码智能体应用主包 (CLI 入口、TUI 界面与 Cordis 微内核中枢)
│       └── src/core/cordis/          # 10 大核心服务实现与 createPiContext 引导器
├── .agents/notes/                    # 架构决策记录 (ADRs)
├── AGENTS.md                         # 开发者与 AI 编码助手工程规范
├── CHANGELOG.md                      # 中文更新日志 (Keep a Changelog)
└── README.md                         # 英文主页
```

---

## 🧪 质量门禁与测试体系

Pi-Cordis 在全工作区保持严格的自动化测试保障：

```bash
# 运行全工作区单元测试 (3500+ 用例)
pnpm test

# 运行微内核装配与引导专属测试
npx vitest run packages/coding-agent/test/cordis-bootstrap.test.ts

# 运行全仓库 TypeScript 类型检查
pnpm run check
```

---

## 📚 架构决策记录 (ADRs)

深度的架构决策与技术权衡记录于 [`.agents/notes/`](.agents/notes/README.zh.md)：

- [Pi-Cordis: 基于 Cordis v4.0.1 的微内核架构设计](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-microkernel-architecture.zh.md)
- [Pi-Cordis: 服务矩阵划分与扩展生态集成](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-services-and-plugin-ecosystem.zh.md)
- [Pi-Cordis: TUI、UI 插件体系与控制面重构权衡及发散探索](.agents/notes/implemented/architecture/2026-08-19-pi-cordis-tui-and-control-plane-tradeoffs.zh.md)

---

## 📄 开源协议

本项目基于 [MIT 许可证](LICENSE) 开源。
部分代码源自 [`earendil-works/pi`](https://github.com/earendil-works/pi)（MIT 协议）。
微内核组件基于 Cordis 元框架（MIT 协议）。
