# @pi-cordis/plugin-terminal-notifier

[English](README.md) | 中文

`@pi-cordis/plugin-terminal-notifier` 在 stdout 为 TTY 时写入 OSC 777 通知序列。

---

## 核心机制

- 监听 `ask_question` 的 `pi/tool-call` 与 `pi/turn-end`；
- 写入 OSC 777 序列，实际展示取决于终端支持与通知设置；
- stdout 不是 TTY 时不执行，也不调用平台专用通知 API。
