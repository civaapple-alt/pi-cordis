# @pi-cordis/plugin-git-guard

[English](README.md) | 中文

原生 Cordis Git 仓库防护与检查点快照插件。在会话启动时检查工作区脏状态，并在高风险操作前自动调用 `git stash create` 生成轻量级快照检查点。

## 配置选项

- `autoCheckpoint` (boolean, 默认 `true`)：在会话轮次前自动创建 Git 暂存快照。
- `warnDirtyOnStart` (boolean, 默认 `false`)：会话启动时若存在未提交修改则进行提示。

## 职责定位
依赖 `ctx.settings` 并监听 `pi/session-start` 与 `pi/session-before` 生命周期事件。

## 模型体验
- **可逆试验保障**：在后台记录轻量级 Git Stash 引用，当模型尝试复杂改动失败时可快速回滚。
- **零 Token 污染**：在底层静默执行 Git 检查，不占用对话上下文 Token。
