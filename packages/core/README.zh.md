# @pi-cordis/core

[English](README.md) | 中文

Pi-Cordis 核心控制面与 Cordis 微内核服务网格。它直接消费 npm 官方 `@earendil-works/pi-coding-agent` 依赖，将其封装为 10 大响应式 Cordis 服务，并提供零冲突的 `picds` 命令行入口与 `~/.picds` 独立用户隔离目录。

## 架构拓扑 (4-Layer Architecture)

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Level 4: 场景预设与原生插件生态 (presets/*, packages/plugins/*)        │
├────────────────────────────────────────────────────────────────────────┤
│ Level 3: Cordis 微内核控制面与服务网格 (@pi-cordis/core)               │
│   ├── 10 大核心响应式服务 (Settings, Auth, AI, Tools, Session...)      │
│   ├── 统一中央事件总线 (Central EventBus -> pi/* 响应式事件流)         │
│   └── 两阶段微内核 CLI 启动器 (picds, picordis)                        │
├────────────────────────────────────────────────────────────────────────┤
│ Level 2: 上游 Coding 场景特化层 (@earendil-works/pi-coding-agent)      │
├────────────────────────────────────────────────────────────────────────┤
│ Level 1: 上游通用 Agent 底座内核 (@earendil-works/pi-agent-core)       │
└────────────────────────────────────────────────────────────────────────┘
```

## 10 大核心 Cordis 服务

1. **`ctx.settings` (`SettingsService`)**：分层配置管理与 `pi/settings-updated` 响应式事件；
2. **`ctx.auth` (`AuthService`)**：独立凭据管理与 `pi/auth-updated` 事件；
3. **`ctx.ai` (`AIService`)**：模型运行时、动态 Provider 注册与可逆销毁；
4. **`ctx.tools` (`ToolRegistryService`)**：编程工具注册、Code Mode 过滤器与生命周期拦截；
5. **`ctx.session` (`SessionService`)**：持久化/内存会话树派生（`/fork`, `/resume`, `inMemory`）；
6. **`ctx.skills` (`SkillsService`)**：动态 Markdown 技能注入与生命周期管理；
7. **`ctx.prompts` (`PromptsService`)**：提示词模板加载与动态注册；
8. **`ctx.extensions` (`ExtensionService`)**：TypeScript 扩展扫描与运行时桥接；
9. **`ctx.packageManager` (`PackageManagerService`)**：包管理安装/卸载与进度通知；
10. **`ctx.agent` (`AgentService`)**：Agent 运行循环调度与多轮事件转发。

## 命令行与用户隔离

- **可执行命令**：`picds`（首选极简命令）与 `picordis`（全称），彻底废除 `pi` 命令以防止与本地全局安装的原生 Pi 发生 PATH 抢占冲突；
- **配置目录**：全局使用 `~/.picds/agent/`，项目级优先读取 `<cwd>/.picds/` 并自动向下兼容 `<cwd>/.pi/`。
