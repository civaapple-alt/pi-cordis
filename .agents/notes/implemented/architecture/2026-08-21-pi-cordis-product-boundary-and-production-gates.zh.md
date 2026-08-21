# Pi-Cordis 产品边界与上线门禁

Status: implemented

## 决策

Pi-Cordis 定位为 **Pi 数据面之上的轻量 Cordis 控制面**。

- Pi 继续拥有 TUI、Agent Loop、模型适配、会话语义和基础工具；
- Pi-Cordis 只拥有生命周期桥接、策略拦截、工具可见性、提示词注入和 Profile 组合；
- Cordis 通过公开的 `@deepseek-ai/cordis` npm 包提供 IoC、Fiber、Effect 和事件总线；
- DSH 是能力接缝、时空组合与副作用可逆等架构原则的来源，但不是 Pi-Cordis 的运行时依赖。

这一区分防止项目重新复制 Pi 或 DSH，也让上游升级保持为依赖升级，而不是源码同步工程。

## 能力真实性分级

### 默认启用

`default` 只组合已经存在真实执行路径和回归测试的八项增强：`safety-gate`、`git-guard`、`rules-injector`、`todo-tracker`、`output-truncator`、`ask-question`、`btw`、`terminal-notifier`。

### 场景启用

- `plan-mode` 只在 `plan` 中出现；
- `code-mode` 只在 `ptc` 中出现；
- `git-automation`、`session-handoff`、`tools-manager` 保持显式可选，不占用默认工具面。

### 私有原型

以下包设置为 `private`，并从 `@pi-cordis/profiles` 的依赖与内置插件表移除：

- `subagent`：此前只分配内存会话，没有运行智能体；
- `ssh-delegator`：此前返回模拟 stdout，没有 SSH 传输；
- `context-compactor`：此前只广播事件，没有调用 Pi 原生压缩。

它们不得在没有真实驱动、错误语义、生命周期测试和端到端证据时重新发布。

## 可逆性与执行管线

- 工具和命令注册使用栈语义；后注册项卸载后恢复仍然存活的前一项，乱序销毁不会误删相邻 Fiber 的注册；
- Profile 保存精确 Fiber Disposer，不再通过插件对象批量删除可能无关的实例；
- HMR 每次变更只执行一次串行 Profile 重载，Watcher、定时器和热载 Fiber 随 Context 清理；
- `pi/tool-call` 使用串行派发；普通工具与 PTC 内部工具都通过 `ToolRegistryService.executeTool()`；
- `pi/tool-result` 的可变结果会返回给 Pi，输出截断不再是旁路空操作。
- 命令桥使用稳定代理；Pi 暂无命令注销 API，因此卸载后的目录项会明确报告不可用，而不会调用已经销毁的处理器；
- 技能、提示词、Session 与 Agent 服务明确区分 SDK 侧目录/对象和 Pi 交互运行时，不再把尚无上游桥接口的注册写成 TUI 已生效；
- Provider、模型选择与 `pi/session-start` 信封在 Cordis 与 Pi 桥之间保持一致；Prompt/Result 变换串行执行，策略错误不再被静默吞掉。

## 失败语义

- 基于模式的命令拦截是防误操作护栏，不是执行不可信代码的安全沙箱；PTC Worker 只提供超时与故障隔离；
- 无交互 UI 时，提问和计划审批返回显式不可用，不代替用户作选择；
- Profile 替换先挂载候选项，失败则只销毁候选项并保留旧 Profile；
- 凭据写入使用进程内串行与原子替换，失败向调用方传播；它不冒充多进程事务数据库。

## 发布门禁

上线候选必须同时满足：

1. `pnpm run check`：严格类型检查；
2. `pnpm test`：服务、桥接、Profile、插件生命周期和安全回归；
3. `pnpm run build`：所有发布工作区生成 ESM 与 `.d.ts`；
4. `pnpm run publint`：从 pack 视角验证入口、exports 和类型；
5. `pnpm run pack:check`：打包 15 个发布单元，在全新临时项目安装后执行编译产物 `picds --version`；
6. GitHub Actions 在 Ubuntu、Windows、macOS 的 Node 22.19 矩阵执行 `pnpm release:check`。

依赖安装使用 pnpm 11 `allowBuilds` 白名单；不得通过 `dangerouslyAllowAllBuilds` 绕过未审阅的依赖脚本。当前仅允许发布构建链需要的 `esbuild`，其余被发现的非必要脚本显式拒绝。

本地通过只能证明当前平台；三平台状态必须以 CI 结果为准。

## 证伪信号

出现以下任一情况时，不得宣称达到上线水准：

- CLI 只有在源码仓库或 `tsx` 存在时才能启动；
- Profile 切换后存在幽灵工具、重复监听器或无法退出的 Watcher；
- PTC 能绕过安全门调用底层工具；
- 插件返回成功，但没有执行名称所承诺的外部动作；
- 文档声称的插件数量、默认组合或能力与发布 tarball 不一致；
- 任一支持平台的 `release:check` 未通过。

## 结果

Pi-Cordis 的差异化价值从“大而全的插件清单”收敛为小型、可验证、可回滚的 Pi 策略层。复杂能力可以继续作为外部 Cordis 插件演进，但默认面和公开包必须优先满足真实性与可逆性。
