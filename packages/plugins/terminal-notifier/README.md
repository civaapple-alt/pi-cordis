# @pi-cordis/plugin-terminal-notifier

English | [中文](README.zh.md)

`@pi-cordis/plugin-terminal-notifier` emits native OS desktop notifications via OSC 777 in modern terminal emulators.

---

## Core Capabilities

- Listens to `pi/tool-call` (when `ask_question` awaits user input) and `pi/session-turn-end` (turn completion);
- Emits standard OSC 777 escape sequences to Warp, Ghostty, and iTerm2 for native OS desktop notifications.
