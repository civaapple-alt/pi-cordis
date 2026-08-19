# Pi-Cordis 架构与设计决策记录 (Agent Notes)

[English](README.md) | 中文

本目录记录了 **Pi-Cordis** 项目的关键架构决策记录（ADR）、技术选型与权衡分析。

---

## 目录索引

| 提出日期 | 决策标题 | 核心主题 |
|---|---|---|
| `2026-08-19` | [Pi-Cordis: 基于 Cordis v4.0.1 的微内核架构设计](implemented/architecture/2026-08-19-pi-cordis-microkernel-architecture.zh.md) | “Everything is a plugin” 插件化设计哲学、Vendored Cordis 框架基础、严格依赖隔离、100% 保持 Pi 的功能与 TUI 体验 |
| `2026-08-19` | [Pi-Cordis: 服务矩阵划分与扩展生态集成](implemented/architecture/2026-08-19-pi-cordis-services-and-plugin-ecosystem.zh.md) | 10 大核心 Cordis 服务（`ctx.settings`, `ctx.auth`, `ctx.ai`, `ctx.tools`, `ctx.session`, `ctx.skills`, `ctx.prompts`, `ctx.extensions`, `ctx.packageManager`, `ctx.agent`）、`pi.dev/packages` 插件市场兼容与 `ExtensionAPI` 事件桥接 |
