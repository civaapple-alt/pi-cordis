# @pi-cordis/core

[English](README.md) | 中文

Pi-Cordis 控制面、Cordis 服务接缝、Pi 扩展桥接，以及 `picds` / `picordis` CLI。

CLI 先启动 Cordis 并挂载当前 Profile，再把真正的终端编程智能体循环交给 `@earendil-works/pi-coding-agent`。Core 不复制或替换 Pi 的 TUI、模型传输、会话和基础工具实现。

## 服务接缝

- `ctx.settings`：项目与用户设置访问；
- `ctx.auth`：凭据门面与更新事件；
- `ctx.ai`：Pi `ModelRuntime` 与可逆 Provider 注册；
- `ctx.tools`：内置/自定义工具、可见性过滤和串行执行拦截；
- `ctx.session`：持久化与内存 `SessionManager` 工厂；
- `ctx.skills`：Skill 发现与动态注册；
- `ctx.prompts`：提示词发现与动态注册；
- `ctx.extensions`：Pi 扩展发现及命令、工具、事件桥接；
- `ctx.packageManager`：Pi `DefaultPackageManager` 的薄封装；
- `ctx.agent`：SDK 侧 `AgentSession` 创建与事件桥接。交互式 CLI 仍由上游 Pi `main()` 驱动。

所有动态注册都必须返回归属 Cordis 的 Disposer。工具结果监听器可以替换 `event.result`，替换值会回传给 Pi。

## CLI 隔离

- 命令：`picds`、`picordis`；不注册 `pi`；
- 用户目录：`~/.picds/agent/`；
- Pi-Cordis 控制面项目文件使用 `.picds/`，仅在明确说明处兼容 `.pi/`；Pi 所有的资源继续使用上游路径。

## 包核验

npm 包只使用 `dist/` 下编译后的 ESM 与类型声明。可在仓库根目录执行：

```bash
pnpm run build
pnpm --filter @pi-cordis/core run publint
pnpm run pack:check
```

详细契约见 [docs/cordis/services](docs/cordis/services/README.zh.md)。
