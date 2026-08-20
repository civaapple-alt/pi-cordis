# @pi-cordis/plugin-terminal-notifier

[English](README.md) | 中文

`@pi-cordis/plugin-terminal-notifier` 是 Pi-Cordis 的终端系统通知插件。

---

## 核心机制

- 监听 `pi/tool-call`（当调用 `ask_question` 等待用户输入时）与 `pi/session-turn-end`（单轮推理结束时）；
- 通过标准 TTY 向 Warp、Ghostty、iTerm2 等现代终端发射 `OSC 777` 转义序列，触发操作系统的原生桌面弹窗通知。
