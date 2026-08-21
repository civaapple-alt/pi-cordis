# @pi-cordis/plugin-git-guard

[English](README.md) | 中文

注册 `git_checkpoint`，通过 `git stash create` 为已跟踪的工作区变更创建快照，并在当前进程内保存其提交引用。

- `create`：存在已跟踪变更时创建引用；
- `list`：列出当前插件实例创建的引用；
- `restore`：展示所选 SHA 与冲突警告，要求用户在交互 UI 中明确确认，再通过结构化 Git 参数应用快照。

检查点引用不会跨进程保存，不包含未跟踪文件，应用时也可能与当前变更冲突。插件不会重置或删除当前工作区。

Restore 声明为 `workspace` 副作用，因此活跃 Plan 会在弹窗或 Git 操作前阻断它。Headless Restore 与取消确认都会失败且不改变工作区；从工作区策略视角看，`create` 与 `list` 保持非变更操作。

`autoCheckpoint` 为显式启用项，默认 `false`，因此默认 Profile 不会隐式写入 Git 对象。启用后会在每轮智能体执行前尝试创建检查点；后台钩子忽略 Git 错误，显式工具操作则向调用者返回失败。
