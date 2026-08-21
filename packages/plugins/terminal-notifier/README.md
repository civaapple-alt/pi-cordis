# @pi-cordis/plugin-terminal-notifier

English | [中文](README.zh.md)

`@pi-cordis/plugin-terminal-notifier` writes OSC 777 notification sequences when stdout is a TTY.

---

## Core Capabilities

- Listens to `pi/tool-call` for `ask_question` and to `pi/turn-end`;
- Emits OSC 777 sequences. Display behavior depends on terminal support and notification settings;
- Does nothing when stdout is not a TTY and does not use a platform-specific notification API.
