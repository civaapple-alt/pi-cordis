# presets/ — Pi-Cordis 标准 Profile

[English](README.md) | 中文

Pi-Cordis 只保留两种能力呈现存在实质差异的 Profile。每个目录以 `preset.yml` 保存展示元数据，以 `cordis.yml` 保存有序的 Cordis 插件列表。

| Profile | 组成 | 用途 |
|---|---|---|
| `default` | `safety-gate`、`git-guard`、`rules-injector`、`todo-tracker`、`output-truncator`、`ask-question`、`btw`、`terminal-notifier` | 带少量已核验控制能力的日常开发。 |
| `ptc` | `code-mode`、`safety-gate`、`git-guard`、`rules-injector`、`todo-tracker`、`output-truncator`、`ask-question` | 通过 `run_code` 进行程序化批处理。 |

使用 `pnpm picds` 或 `pnpm picds --profile ptc` 启动。Plan 是独立的 Session 状态：通过 `pnpm picds --plan`、`/plan` 与 `/plan off` 控制，并在 `/profile default` 与 `/profile ptc` 切换期间保持不变。

项目配置优先读取 `<cwd>/.picds/`，仅在其不存在时回退到 `<cwd>/.pi/`；用户配置位于 `~/.picds/agent/`。未知 Profile 和未知插件名称都会明确失败。

PTC 的 Worker 用于超时与故障隔离，不是权限沙箱：生成代码拥有 Picds 进程用户的本机权限。通过 `pi.*` 工具 SDK 发起的调用仍经过 Safety Gate，但它只是一层纵深防误操作护栏。

私有原型包 `subagent`、`ssh-delegator`、`context-compactor` 不属于任何 Profile。
