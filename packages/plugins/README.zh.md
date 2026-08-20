# plugins/ — Pi 原生 Cordis 插件生态

[English](README.md) | 中文

Pi 的原生 Cordis 插件与预设系统。所有插件均遵循 **"一切皆插件"（Everything is a Plugin）** 与 **"注册即副作用"（Registration as Effect）** 架构，提供高度正交隔离的能力、工具注册、事件拦截与提示词注入，且 100% 支持通过 Cordis 释放器（Disposer）无残留干净回滚。

## 插件目录清单

| 插件目录 | 职责与定位 | 核心工具 / 拦截能力 | `inject` 依赖 |
|---|---|---|---|
| [`profiles/`](profiles/README.zh.md) | 预设配置解析器、YAML 目录扫描器及双轨热重载（HMR）管理器。 | 预设切换、`/profile` 命令扩展 | `[]` |
| [`subagent/`](subagent/README.zh.md) | 在独立的 `ctx.extend()` 作用域中派生子智能体执行子任务。 | `subagent` | `["tools"]` |
| [`plan-mode/`](plan-mode/README.zh.md) | 结构化规划模式、步骤追踪与写操作拦截。 | `plan_step` | `["tools"]` |
| [`code-mode/`](code-mode/README.zh.md) | 编程化工具调用（PTC），在 V8 沙箱中执行 JS/TS 并调用 `pi.*` SDK。 | `run_code` | `["tools"]` |
| [`ask-question/`](ask-question/README.zh.md) | 交互式澄清问题工具，支持多选与自定义输入。 | `ask_question` | `["tools"]` |
| [`output-truncator/`](output-truncator/README.zh.md) | 超长工具输出截断防爆窗（>50KB / >2000 行）。 | 事件拦截器 (`pi/tool-result`) | `[]` |
| [`context-compactor/`](context-compactor/README.zh.md) | 手动或阈值触发的长会话分段压缩。 | `trigger_compact` | `["tools"]` |
| [`tools-manager/`](tools-manager/README.zh.md) | 运行时动态查看、启用与禁用特定工具。 | `manage_tools` | `["tools"]` |
| [`session-handoff/`](session-handoff/README.zh.md) | 打包会话里程碑与目标，实现平滑会话交接。 | `session_handoff` | `["tools"]` |
| [`git-automation/`](git-automation/README.zh.md) | 依据 Conventional Commits 规范生成提交信息与关联 Issue。 | `git_smart_commit` | `["tools"]` |
| [`ssh-delegator/`](ssh-delegator/README.zh.md) | 将 Shell 命令与文件操作代理至远程 SSH 主机或 Docker 容器。 | `ssh_exec` | `["tools"]` |
| [`safety-gate/`](safety-gate/README.zh.md) | 安全网关，阻断高危 Shell 命令与敏感文件修改。 | 事件拦截器 (`pi/tool-call`) | `[]` |
| [`git-guard/`](git-guard/README.zh.md) | 会话启动脏状态检查与风险操作前的 Git Stash 检查点备份。 | 事件拦截器 | `["settings"]` |
| [`todo-tracker/`](todo-tracker/README.zh.md) | 会话内任务清单管理与提示词自动注入。 | `todo_write`, `todo_read` | `["tools"]` |
| [`rules-injector/`](rules-injector/README.zh.md) | 自动扫描并注入 `AGENTS.md`、`CLAUDE.md`、`.cursorrules` 等规则。 | 提示词转换钩子 | `["settings"]` |

## 预设与配置档案

所有插件组合收敛为精选预设：
- **`default` (Default is Best)**：开箱即用最优组合（`safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`）。
- **`safe`**：只读安全模式与受保护文件边界。
- **`strict`**：严格命令审计与 Git 脏状态强校验。
- **`plan`**：交互式规划模式与文件修改拦截。
- **`ptc`**：编程化工具调用模式（PTC Sandbox）。
- **`full`**：全能极客模式，同时激活全部 14 大原生插件。
- **`minimal`**：纯粹极简微内核，零额外插件。
