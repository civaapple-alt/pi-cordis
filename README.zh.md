# Pi-Cordis

Pi-Cordis 是 Pi 终端编程智能体之上的轻量 Cordis 控制面。它把 Pi 的 TUI、Agent Loop、模型适配、会话和基础工具保留为数据面，只在外围增加可逆的策略与组合接缝。

[English](README.md) · [架构决策](.agents/notes/README.zh.md) · [插件指南](packages/plugins/README.zh.md)

## 生态位

```text
Pi-Cordis Profiles / Plugins       场景策略与能力组合
Pi-Cordis Cordis Control Plane     生命周期、事件、工具可见性、拦截
Pi Coding Agent                    TUI、提示词、会话、编程 Agent Loop
Pi Agent Core                      模型适配与工具执行原语
```

- **Pi** 仍是产品数据面。Pi-Cordis 不 Fork、不重写它的终端界面和智能体循环。
- **Cordis** 提供 IoC 容器、作用域 Fiber、类型事件与可逆 Effect。项目直接消费公开的 [`@deepseek-ai/cordis`](https://www.npmjs.com/package/@deepseek-ai/cordis)，不再内置源码。
- **DeepSeek Harness（DSH）** 是架构思想来源，而不是运行时依赖。Pi-Cordis 吸收能力接缝、显式注入、作用域组合和副作用可逆等原则，但不引入 DSH 的完整应用栈。

因此，Pi-Cordis 的本质不是“另一个 Pi”或“小型 DSH”，而是为 Pi 提供运行时策略与场景组合的薄控制面。

## 设计准则

1. **数据面留在上游。** 模型通信、编程循环、TUI 渲染和基础工具由 Pi 负责。
2. **注册即副作用，副作用必须可逆。** 工具、命令、过滤器、提示词和监听器都返回 Disposer，并归属 Cordis Fiber。
3. **Profile 只改变能力面，不改变产品身份。** 切换时销毁上一 Profile 的精确 Fiber，并同步 Pi 可见工具。
4. **安全拦截必须串行。** 包括 PTC 内部调用在内，所有工具执行都经过同一条 Cordis 安全管线。
5. **未实现的能力不得伪装成功。** Subagent、SSH 和 Compaction 原型已私有化，并从可发布 Profile 依赖图移除。

## Profile 与 Plan 状态

### `default`

默认 Profile 保留 Pi 的普通工具呈现，并挂载八项已核验增强：`safety-gate`、`git-guard`、`rules-injector`、`todo-tracker`、`output-truncator`、`ask-question`、`btw` 与 `terminal-notifier`。

### `ptc`

PTC Profile 增加 `code-mode`，通过动态 `pi` SDK 与 `run_code` 呈现底层工具。Worker 只提供超时与故障隔离，不是权限沙箱；内部调用仍经过 Cordis 拦截。

### Plan

Plan 是每 Session 协作状态，不是 Profile。根作用域稳定挂载的 `plan-mode` 插件在两个 Profile 中都提供 `/plan`、`/plan off` 与 `exit_plan_mode`。进入或退出 Plan 不装卸插件，也不改变工具 Schema；激活期间的规划规则与修改护栏同时覆盖普通调用和 PTC 内部调用。
## 从源码启动

要求 Node.js 22.19 或更高版本，以及 pnpm。

```bash
pnpm install
pnpm picds
pnpm picds --plan
pnpm picds --profile ptc
```

命令名仅为 `picds` 和 `picordis`，不会抢占 `pi`。全局用户数据位于 `~/.picds/agent/`。Pi-Cordis 控制面文件（Profile 与 Spill 输出）使用 `.picds/`，只在明确说明处回退 `.pi/`；Prompt Template 等 Pi 所有的项目资源继续遵循上游 Pi 路径。

## 包与插件状态

可发布依赖图由 13 个能力插件、`@pi-cordis/profiles` 和 `@pi-cordis/core` 组成。每个可发布包都会生成 `dist/` ESM JavaScript 与类型声明，声明显式 exports，并通过 `publint`。

以下原型不会进入发布依赖图：

- `plugin-subagent`：只创建了会话，没有真正驱动子智能体执行任务；
- `plugin-ssh-delegator`：返回模拟输出，没有建立 SSH 传输；
- `plugin-context-compactor`：只广播事件，没有接入 Pi 原生压缩操作。

只有补齐真实驱动、失败语义、生命周期测试和端到端验证后，它们才可以重新公开。

## 开发与发布门禁

```bash
pnpm run check       # TypeScript 严格检查
pnpm test            # 单元与集成测试
pnpm run build       # 为全部工作区生成 ESM 与类型声明
pnpm run publint     # 核验打包后的入口与类型
pnpm run pack:check  # 在全新临时项目安装全部 tarball 并运行 CLI
pnpm release:check   # 上述全部门禁
```

CI 在 Ubuntu、Windows 和 macOS 的 Node 22.19 上执行 `release:check`。只有三平台矩阵真实通过，才视为完成跨平台核验。

## 仓库结构

```text
presets/                 default、ptc 能力组合
packages/core/           Cordis 服务、Pi 桥接与 picds CLI
packages/plugins/        原生 Cordis 插件工作区
.agents/notes/           生效中的架构决策与历史记录
.github/workflows/       跨平台发布门禁
```

服务接口文档位于 [packages/core/docs/cordis/services](packages/core/docs/cordis/services/README.zh.md)。

## 当前成熟度

仓库已经具备可复现的构建与打包流水线，并完成 Windows 本地 tarball 安装验证。真实模型下的交互式 TUI 行为以及三平台 CI 矩阵仍应以实际运行结果为发布证据，不能由文档预先宣称。

许可证：[MIT](LICENSE)
