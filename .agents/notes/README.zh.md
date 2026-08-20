# Pi-Cordis 架构与设计决策记录 (Agent Notes)

[English](README.md) | 中文

本目录记录了 **Pi-Cordis** 项目的关键架构决策记录（ADR）、技术选型与权衡分析。

---

## 目录索引

| 提出日期 | 决策标题 | 核心主题 |
|---|---|---|
| `2026-08-19` | [Pi-Cordis: 基于 Cordis v4.0.1 的微内核架构设计](implemented/architecture/2026-08-19-pi-cordis-microkernel-architecture.zh.md) | “Everything is a plugin” 插件化设计哲学、Vendored Cordis 框架基础、严格依赖隔离、100% 保持 Pi 的功能与 TUI 体验 |
| `2026-08-19` | [Pi-Cordis: 服务矩阵划分与扩展生态集成](implemented/architecture/2026-08-19-pi-cordis-services-and-plugin-ecosystem.zh.md) | 10 大核心 Cordis 服务（`ctx.settings`, `ctx.auth`, `ctx.ai`, `ctx.tools`, `ctx.session`, `ctx.skills`, `ctx.prompts`, `ctx.extensions`, `ctx.packageManager`, `ctx.agent`）、`pi.dev/packages` 插件市场兼容与 `ExtensionAPI` 事件桥接 |
| `2026-08-19` | [Pi-Cordis: TUI、UI 插件体系与控制面重构权衡及发散探索](implemented/architecture/2026-08-19-pi-cordis-tui-and-control-plane-tradeoffs.zh.md) | 控制面重构的 4 大真实代价与绞杀者模式、TUI 全屏静默装配与资源呈现看板、TUI 环境下 UI 插件与 WebServer 的根本困境、DSH 协议化退守战略、7 大 TUI 插槽系统演进与多 Agent 终端呈现边界 |
| `2026-08-19` | [Pi-Cordis: 仓库精简与上游依赖解耦](implemented/simplification/2026-08-19-pi-cordis-repository-simplification.zh.md) | 移除 1200+ 冗余源码文件、直接消费官方 `@earendil-works/pi-*` 依赖、仓库体积骤降 85%、自动跟进上游升级与极速构建 |
| `2026-08-19` | [Pi AgentHarness: 工业级事务规格与 Cordis 微内核架构融合](implemented/architecture/2026-08-19-pi-agent-harness-specification-and-cordis-integration.zh.md) | 三存储模型（entries/registers/ledger）、副作用三明治（Effect Sandwich）、Lanes 多车道并发与 Cordis 控制面融合 |
| `2026-08-19` | [Pi-Cordis: 原生 Cordis 插件体系与 Profile 预设机制](implemented/architecture/2026-08-19-pi-cordis-native-plugins-and-profiles.zh.md) | 独立子包工作区（`packages/plugins/*`）、4 大核心插件（safety-gate/git-guard/todo-tracker/rules-injector）与 5 大 Profile 预设矩阵（default/safe/strict/full/minimal） |
| `2026-08-19` | [Pi-Cordis: 原生插件生态全景规划与优先级演进矩阵](proposed/2026-08-19-pi-cordis-plugin-ecosystem-roadmap-and-priority.zh.md) | 70+ 个扩展全景分类、P0 -> P1 -> P2 -> P3 优先级演进矩阵（Subagent、Plan模式、问答交互、输出截断与会话压缩） |
| `2026-08-20` | [Pi-Cordis: Loader 权衡与双轨分层 HMR（热重载）架构设计](implemented/architecture/2026-08-20-pi-cordis-loader-and-dual-track-hmr-architecture.zh.md) | 核心 Service 编程式高效装配、预设 YAML 与插件源码双轨 HMR、Node.js ESM 动态时间戳缓存破除与会话状态保持 |
| `2026-08-20` | [Pi-Cordis: 能力 Seams、显式依赖注入（inject）与 TUI 交互桥接架构设计](implemented/architecture/2026-08-20-pi-cordis-capability-seams-inject-and-tui-bridge.zh.md) | DSH 三层 Seam 角色对齐、Cordis v4 inject 权限沙箱与无序拓扑解析、ExtensionService 桥接与 pi-tui 7 大终端交互槽位 |
| `2026-08-20` | [Pi-Cordis: “注册即副作用，副作用必可逆”与 Disposer 模式架构哲学](implemented/architecture/2026-08-20-pi-cordis-reversible-side-effects-and-disposer-pattern.zh.md) | 副作用必可逆的核心公理、脱离 HMR 的 4 大生产场景（Profile切换/Subagent隔离/Plan模式/事务回滚）与 Disposer 清理闭环 |
| `2026-08-20` | [Pi-Cordis: 编程化工具调用（PTC / Code Mode）架构设计与演进提案](proposed/2026-08-20-pi-cordis-ptc-code-mode-architecture-proposal.zh.md) | DSH Code Mode 深度解析、轮次坍缩与上下文防爆、TypeScript SDK 动态合成与 `presets/ptc/` 落地规划 |
| `2026-08-20` | [Pi-Cordis: 极简设计哲学与 “Default is Best” 预设体系重构提案](proposed/2026-08-20-pi-cordis-minimalist-presets-and-default-is-best-philosophy.zh.md) | 废除 5 大内部插件技术排列组合、回归 Pi 极简主义、Default 默认即最佳与 3 大场景级工作形态（Default/Plan/PTC） |










