# @pi-cordis/profiles

[English](README.md) | 中文

Pi-Cordis 插件生态的预设配置中枢、YAML 加载器与双轨热重载（HMR）管理器。统一管理内置 Profile 声明、基于目录的 Presets 扫描（`presets/<name>/preset.yml` 与 `cordis.yml`）以及通过 `/profile` 命令进行运行时动态切换。

## 精选内置预设档案

- **`default` (Default is Best)**：
  - `safety-gate`：高危命令与敏感文件防误触防护。
  - `git-guard`：Git 仓库脏状态检测与 Stash 快照。
  - `rules-injector`：项目级规范（`AGENTS.md` / `CLAUDE.md`）自动注入。
  - `todo-tracker`：实时待办事项管理与提示词注入。
  - `output-truncator`：超长输出截断防爆窗。
- **`safe`**：只读安全模式与写操作阻断。
- **`strict`**：严格命令审计与 Git 脏状态强校验。
- **`plan`**：交互式规划模式与文件修改拦截。
- **`ptc`**：编程化工具调用（PTC）沙箱模式。
- **`full`**：全能极客模式，同时激活全部 14 大原生插件。
- **`minimal`**：纯粹极简微内核，零额外插件。

## 双轨热重载（Dual-Track HMR）

1. **预设配置轨 (YAML Track)**：
   - 监听 `presets/**/preset.yml` 与 `cordis.yml`。
   - 文件变更时：干净释放当前活跃 Fork 并无缝装配新配置，无需重启进程。
2. **插件源码轨 (Plugin Code Track)**：
   - 监听 `packages/plugins/*/src/**/*.ts`。
   - 源码变更时：基于带时间戳的动态导入重新加载插件模块并完成 Cordis 上下文原子重绑。

## 交互式命令扩展

导出 `createProfileCommandExtension(ctx)`，在 Pi 终端与 TUI 中注册 `/profile` 斜杠命令：
- `/profile`：打开交互式下拉选择器，浏览并切换所有可用预设。
- `/profile <name>`：瞬间切换当前活动预设并输出加载的插件清单通知。
