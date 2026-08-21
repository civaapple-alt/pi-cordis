# Pi-Cordis 插件

原生插件通过 Cordis 服务扩展 Pi 数据面。所有动态注册都必须归属 Fiber，并可通过 Disposer 逆转。

## 可发布包

| 插件 | 注入服务 | 实际状态 |
| --- | --- | --- |
| `ask-question` | `tools` | Pi TUI 交互式提问工具，支持非交互回退。 |
| `btw` | `extensions`, `ai` | 单轮、无主会话污染的旁路问答命令。 |
| `code-mode` | `tools` | Worker PTC；内部工具调用仍经过 Cordis 拦截。 |
| `git-automation` | `tools` | 根据显式输入格式化 Conventional Commit，不执行提交。 |
| `git-guard` | `settings`, `tools` | 基于 `git stash create` 的轻量检查点。 |
| `output-truncator` | `settings` | 递归文本截断与 `.picds/spill` 转存。 |
| `plan-mode` | `tools`, `extensions` | 稳定的每 Session Plan 状态、`/plan`、`exit_plan_mode` 与修改护栏。 |
| `profiles` | `extensions`, `settings`, `tools` | 内置 Profile 组合与开发期 HMR。 |
| `rules-injector` | `settings` | 项目规则发现与提示词注入。 |
| `safety-gate` | 无 | 串行危险命令和受保护路径拦截。 |
| `session-handoff` | `tools` | 结构化交接信封生成与事件广播。 |
| `terminal-notifier` | 无 | 提问等待与 Pi 轮次完成时发送 OSC 777。 |
| `todo-tracker` | `tools` | 四态 Todo 图与依赖环检测。 |
| `tools-manager` | `tools` | 运行时模型侧工具可见性过滤。 |

## 私有原型

`subagent`、`ssh-delegator`、`context-compactor` 是私有工作区。此前实现并未真正执行名称所暗示的工作，因此已从 `@pi-cordis/profiles` 和发布依赖图移除。

## Profile

- `default`：八项经过核验的日常开发增强；
- `ptc`：使用同一安全管线的编程化工具调用；
- `minimal`：仅供内部和测试使用，不挂载能力插件。

Plan 在这些 Profile Fiber 之外稳定挂载，通过 `/plan` 控制；它不是 Profile。

精确组合与发布门禁见[根 README](../../README.zh.md)。
