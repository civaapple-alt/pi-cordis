# Profile、Preset 与 YAML 组合

[English](profiles-and-presets.md) | 中文

Profile 是改变能力呈现方式的小型 Pi-Cordis 内置插件集合。它不替换 Pi 的 Agent Loop 或 TUI，也不表示临时协作状态。

## 标准 Profile

| Profile | 组合 |
| --- | --- |
| `default` | `safety-gate`、`git-guard`、`rules-injector`、`todo-tracker`、`output-truncator`、`ask-question`、`btw`、`terminal-notifier` |
| `ptc` | `code-mode`、`safety-gate`、`git-guard`、`rules-injector`、`todo-tracker`、`output-truncator`、`ask-question` |

只需 Core 的嵌入场景和测试可传入 `createPiContext({ profile: false })`；这不会产生隐藏的用户 Profile。

Plan 由 `@pi-cordis/core` 在 Profile 作用域之外只挂载一次。`/plan` 激活每 Session 规划策略，`/plan off` 由用户退出，`exit_plan_mode` 执行交互式评审。Plan 的激活与退出不装卸 Fiber，也不改变工具目录。

## 查找顺序

Profile 按以下顺序合并，同名定义以后者为准：

1. 内置定义；
2. `<cwd>/presets/` 源码树回退；
3. `<agentDir>/presets/`；
4. `<cwd>/.picds/presets/`；仅当它不存在时才读取 `<cwd>/.pi/presets/`。

单文件 `cordis.yml` 同样遵循 `.picds` 存在时不读取旧 `.pi` 的规则。

## 目录格式

```text
.picds/presets/review/
  preset.yml
  cordis.yml
```

```yaml
# preset.yml
name: review
description: 只读评审
```

```yaml
# cordis.yml
- name: '@pi-cordis/plugin-safety-gate'
  config:
    readOnly: true
- name: '@pi-cordis/plugin-rules-injector'
```

Profile YAML 当前只组合 Pi-Cordis 内置插件。未知名称会在销毁当前 Profile 之前使切换失败；普通 Pi 扩展应通过 Pi Package Manager 安装。

## 切换与销毁

```bash
picds --profile ptc
picds --plan
```

TUI 内可使用 `/profile default` 或 `/profile ptc`。每次切换都会销毁上一 Profile 的精确 Fiber，挂载新集合，并通过桥接调用 `pi.setActiveTools()`。Plan 通过 `/plan` 独立控制；计划获批不会改变当前 Profile。

开发期 HMR 监听 Profile YAML 和可选插件源码。一次 YAML 变更只触发一次串行重载；Watcher、Debounce Timer 与热载 Fiber 都随 Cordis Context 销毁。
