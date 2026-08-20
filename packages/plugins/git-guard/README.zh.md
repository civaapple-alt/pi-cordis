# @pi-cordis/plugin-git-guard

[English](README.md) | 中文

原生 Cordis Git 仓库防护与原子级检查点快照插件。监控工作区脏状态，在会话轮次前自动调用 `git stash create` 生成轻量级快照引用，并注册 `git_checkpoint` 工具支持一键恢复。

## 工具

### `git_checkpoint`

接受参数：
- `action` (`"create"` | `"restore"` | `"list"`, 必填)：执行的检查点动作。
- `checkpointId` (string, 可选)：执行恢复操作时的目标检查点编号。
- `description` (string, 可选)：创建检查点时的备注说明。

返回值：
- `success` (boolean)：操作结果。
- `checkpoint` (对象, 可选)：新建检查点详情（id, sha, timestamp）。
- `checkpoints` (数组, 可选)：查询时的当前活跃检查点列表。

## 配置选项

- `autoCheckpoint` (boolean, 默认 `true`)：在会话修改轮次前自动创建 Git 暂存快照。
- `warnDirtyOnStart` (boolean, 默认 `false`)：会话启动时若存在未提交修改则进行提示。

## 模型体验
- **原子级回滚保障**：在大规模重构或试验性修改前创建快照，支持无损一键恢复，不污染 Git 分支历史；
- **零 Token 污染**：在后台静默执行 Git 检查，不占用对话上下文 Token。
