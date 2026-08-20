# @pi-cordis/plugin-btw

[English](README.md) | 中文

`@pi-cordis/plugin-btw` 是 Pi-Cordis 的**零上下文污染旁路问答插件**。

---

## 核心机制

- 注册终端 `/btw <question>` 快捷斜杠指令；
- 当用户提问时，直接通过 `ctx.ai` 调度底层活跃大模型执行单轮推理；
- **100% 物理隔离**：不向会话树（SQLite / `session.jsonl`）写入任何消息记录，不消耗主会话上下文 Token，不破坏大模型 KV-Cache；
- 通过 TUI 浮层展示回答。
