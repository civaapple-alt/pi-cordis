# @pi-cordis/plugin-session-handoff

[English](README.md) | 中文

注册 `session_handoff`，把用户或模型提供的内容格式化为 Handoff Envelope，返回 Markdown 并广播 `pi/handoff`。

TUI 折叠态保持紧凑；展开态渲染完整 Markdown Envelope，使接手者在使用前能审阅全部目标、约束、完成项、下一步与验证命令。

该插件不会读取或核验当前会话，不会创建新会话、归档旧会话，也不会持久化 Envelope。消费者可监听 `pi/handoff` 并显式实现这些策略。
