# @pi-cordis/plugin-btw

[English](README.md) | 中文

`@pi-cordis/plugin-btw` 是 Pi-Cordis 的临时旁路问答插件。

---

## 核心机制

- 注册终端 `/btw <question>` 快捷斜杠指令；
- 当用户提问时，直接通过 `ctx.ai` 调度底层活跃大模型执行单轮推理；
- 在活跃 `AgentSession` 之外调用 `completeSimple()`，因此问题和回答不会追加到主会话历史；
- 会产生一次独立模型请求及其 Token 消耗；服务端缓存行为取决于具体 Provider；
- Pi 提供编辑器时，在可滚动编辑器中完整展示回答并以只读审阅处理；否则使用包含全文的选择器，仅在极简 UI Provider 下回退到通知。审阅时的修改会被丢弃，因为 `/btw` 是临时回答而非编辑命令。
