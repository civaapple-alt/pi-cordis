# @pi-cordis/profiles

[English](README.md) | 中文

Pi-Cordis 的 Profile 解析器、YAML 加载器、运行时切换器与开发期 HMR 管理器。

内置 Profile 被刻意保持精简，只表达能力呈现差异，不承载协作状态：

- `default`：8 个已核验的日常开发插件；
- `ptc`：使用可超时终止 Worker 的程序化工具调用；它不是权限沙箱。

Plan 是由 `@pi-cordis/core` 在 Profile Fiber 外稳定挂载的每 Session 控制状态。使用 `/plan` 或 `picds --plan` 进入；通过 `exit_plan_mode` 获批后退出，但不会改变当前 Profile。

`applyProfile()` 精确持有其挂载的 Cordis Fiber。切换时先校验并挂载替代项，再销毁旧 Profile 的精确 Fiber；若替代项失败则回滚且保持当前 Profile。以 Cordis Effect 注册的工具、命令、监听器、定时器和过滤器因此保持可逆。未知 Profile 与插件名称会明确失败。

Profile 发现优先读取项目 `.picds` 配置，仅把 `.pi` 作为兼容回退。开发期 HMR 串行执行重载，并随所属 Fiber 清理 Watcher 与 Timer。

`/profile` 命令用于列出或切换能力 Profile；精确组成见仓库 `presets/` 目录。
