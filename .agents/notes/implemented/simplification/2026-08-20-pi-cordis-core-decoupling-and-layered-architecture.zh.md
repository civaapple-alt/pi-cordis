# Agent Note: Pi-Cordis 核心层 (@pi-cordis/core) 上游彻底解耦与 4 层架构重构落地

Status: implemented
Created: 2026-08-20

[English](2026-08-20-pi-cordis-core-decoupling-and-layered-architecture.md) | 中文

## 摘要 (Executive Summary)

本篇架构决策记录（ADR）记录了对 `pi-cordis` 核心控制层进行的**终极上游解耦重构（Ultimate Upstream Decoupling & 4-Layer Architecture）**。

通过将 `packages/coding-agent`（原包名 `@earendil-works/pi-coding-agent`）更名为 **`@pi-cordis/core`**，并转为直接通过 npm 消费官方发布发布的 `@earendil-works/pi-coding-agent` 依赖，彻底清除了数百个本地克隆的上游源码文件。同时确立了自底向上严格分层的 **4 层架构金字塔**，建立了 **两阶段 CLI 启动装配器（2-Phase Bootstrapper）**，以及 **`picds` 独立命令与 `~/.picds` 用户目录完全物理隔离策略**。

---

## 一、问题背景与现状诊断 (Problem & Diagnosis)

在上一阶段的仓库精简中，虽然将 `packages/ai`、`packages/agent`、`packages/tui` 等子包替换为官方 npm 包，但核心层依然存在关键瓶颈：
1. **工作区包名冲突与遮蔽**：`packages/coding-agent/package.json` 的包名仍为 `@earendil-works/pi-coding-agent`，导致 pnpm 将其当成本地包，无法从 npm 安装官方真实包；
2. **源码冗余克隆**：保留了上游大量未修改的 `modes/`、`tools/`、`utils/` 源码，代码重复率高；
3. **上游升级受阻**：上游发布新版本时无法通过 `pnpm update` 升级，必须人工手动合并代码。

---

## 二、4 层架构全景与职责拓扑 (The 4-Layer Architecture)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Pi-Cordis 完整 4 层架构金字塔                   │
├────────────────────────────────────────────────────────────────────────┤
│ 【Level 4: 场景预设与原生插件生态】                                     │
│   • presets/ (default, plan, ptc)                                      │
│   • packages/plugins/* (safety-gate, plan-mode, subagent, todo, etc.)  │
│   • 职责: 仅面向 Cordis 服务矩阵编程 (inject: ["tools", "session"])     │
├────────────────────────────────────────────────────────────────────────┤
│                                  ▲                                     │
│                                  │ 驱动与装配                          │
│                                  │                                     │
│ 【Level 3: 微内核控制面与服务网格】 ── @pi-cordis/core (核心资产)        │
│   • Cordis 微内核底座 (IOC 容器, Fiber 作用域, 可逆 Disposer)          │
│   • 10 大核心 Cordis 服务矩阵 (SettingsService, AIService, Session...) │
│   • 统一中央事件总线 (Central EventBus -> pi/* 响应式事件流)            │
│   • 微内核启动器与预设加载器 (createPiContext, applyProfile, /profile) │
├────────────────────────────────────────────────────────────────────────┤
│                                  ▲                                     │
│                                  │ 包装与桥接 (import 消费)            │
│                                  │                                     │
│ 【Level 2: 上游 Coding 场景特化层】 ── @earendil-works/pi-coding-agent   │
│   • 编程工具矩阵 (read, edit, write, bash, grep, find 的真实执行逻辑)   │
│   • 终端交互 TUI (pi-tui 双缓冲渲染, Diff, highlight.js, 消息排队)     │
│   • 树状会话持久化 (SessionManager, SQLite/JSONL, /fork, /rewind)      │
│   • 智能上下文压缩 (Compaction, 自动摘要)                              │
│   • 官方扩展与包运行时 (ExtensionRunner, SkillsManager, RPC Mode)      │
├────────────────────────────────────────────────────────────────────────┤
│                                  ▲                                     │
│                                  │ 底层驱动 (npm 内部依赖)             │
│                                  │                                     │
│ 【Level 1: 上游通用 Agent 底座内核】 ── @earendil-works/pi-agent-core   │
│   • 通用 Turn 循环状态机 (Message -> Model -> Tool Call -> Result)     │
│   • 通用 AgentContext 消息容器                                         │
│   • LLM 流式输出解析器 (Thinking, Text, ToolCall stream parsing)        │
│   • 纯抽象 Tool 接口定义                                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 三、落地方案与架构细节 (Implementation Details)

### 1. 包名更名与依赖引入
- `packages/coding-agent/package.json` 更名为 **`@pi-cordis/core`**；
- 在 `dependencies` 中正式引入 `@earendil-works/pi-coding-agent: ^0.84.2`、`@earendil-works/pi-ai`、`@earendil-works/pi-agent-core`、`@earendil-works/pi-tui` 等。

### 2. 10 大核心 Cordis 服务全面改为从 npm 导入
- `SettingsService`：导入 `SettingsManager`, `getAgentDir`；
- `AuthService`：基于 `readStoredCredential` 与 `getAgentDir` 提供独立凭据读写；
- `AIService`：导入 `ModelRuntime` 并集成 Cordis 注册销毁；
- `ToolRegistryService`：导入 `createReadToolDefinition`, `createEditToolDefinition` 等并桥接 Cordis 拦截器；
- `SessionService`：导入 `SessionManager`；
- `SkillsService`：导入 `loadSkills`；
- `PromptsService`：导入 `DefaultResourceLoader`；
- `ExtensionService`：导入 `discoverAndLoadExtensions`；
- `PackageManagerService`：导入 `DefaultPackageManager`；
- `AgentService`：导入 `AgentSession`, `createAgentSession`。

### 3. 启动入口两阶段装配设计 (2-Phase Bootstrapper in `src/cli.ts`)
```typescript
#!/usr/bin/env node
import { createPiContext } from "./core/cordis/index.ts";
import { createProfileCommandExtension, createBtwCommandExtension, setupTerminalNotifier } from "./core/cordis/profile-command.ts";
import { main } from "@earendil-works/pi-coding-agent";

async function runCli() {
  process.title = "picds";
  process.env.PI_CODING_AGENT = "true";
  process.env.AI_AGENT = "picds";

  const rawArgs = process.argv.slice(2);
  let profileName = "default";
  const profileIdx = rawArgs.indexOf("--profile");
  if (profileIdx !== -1 && rawArgs[profileIdx + 1]) {
    profileName = rawArgs[profileIdx + 1];
    rawArgs.splice(profileIdx, 2);
  }

  // 阶段 1: 启动 Cordis 微内核容器，装配 10 大服务与场景预设
  const cordisCtx = await createPiContext({ profile: profileName, cwd: process.cwd() });
  setupTerminalNotifier(cordisCtx);

  const extensionFactories = [
    createProfileCommandExtension(cordisCtx),
    createBtwCommandExtension(cordisCtx),
  ];

  // 阶段 2: 转交上游官方 CLI，无缝驱动 TUI 终端
  await main(rawArgs, { extensionFactories });
}
runCli().catch((err) => { console.error("Pi-Cordis Boot Error:", err); process.exit(1); });
```

### 4. 用户与项目配置目录隔离 (~/.picds 与 .picds/ 策略)
- **全局用户目录 (`~/.picds/`)**：`settings.json`、`auth.json`、`sessions/`、`presets/` 均存放在 `~/.picds/agent/` 中，与原生 `~/.pi/` 物理隔离，杜绝数据破坏；
- **项目级配置目录 (`<cwd>/.picds/`)**：优先读取 `<cwd>/.picds/`，不存在时自动向下兼容读取 `<cwd>/.pi/`。

### 5. CLI 可执行命令与 Bin 隔离决策 (Zero-Collision Bin Strategy)
- 废除 `pi` 命令；
- 官方注册 `picds`（首选 5 字符命令）与 `picordis`（全称）；
- 根目录脚本提供 `pnpm picds` 与 `pnpm picordis`。

---

## 四、架构收益与影响 (Consequences & Benefits)

1. **一条命令无感升级上游 (Effortless Upstream Tracking)**：
   ```bash
   pnpm update @earendil-works/pi-coding-agent @earendil-works/pi-ai @earendil-works/pi-agent-core
   ```
   即可瞬间获得上游所有最新功能与 Bug 修复，彻底告别痛苦的人工 git merge；
2. **零全局命令与数据冲突**：独立命令 `picds` 与独立目录 `~/.picds/` 确保与原生 `pi` 100% 安全共存；
3. **仓库体积再缩减 80%+**：彻底删除数百个克隆文件，源码纯净轻量；
4. **单向依赖流**：各层职责清晰分明。
