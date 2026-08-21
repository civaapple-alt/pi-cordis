# @pi-cordis/profiles

[English](README.md) | 中文

Pi-Cordis 的 Profile 解析器、YAML 加载器、运行时切换器与开发期 HMR 管理器。

内置 Profile 被刻意保持精简：

- `default`：8 个已核验的日常开发插件；
- `plan`：只读规划与审查控制；
- `ptc`：使用可超时终止 Worker 的程序化工具调用；它不是权限沙箱。

`applyProfile()` 精确持有其挂载的 Cordis Fiber。切换时先销毁这些 Fiber，再挂载新 Profile，因此以 Cordis Effect 注册的工具、命令、监听器、定时器和过滤器均可逆。未知 Profile 与插件名称会明确失败。

Profile 发现优先读取项目 `.picds` 配置，仅把 `.pi` 作为兼容回退。开发期 HMR 串行执行重载，并随所属 Fiber 清理 Watcher 与 Timer。

`/profile` 命令用于列出或切换可用 Profile；精确组成见仓库 `presets/` 目录。
