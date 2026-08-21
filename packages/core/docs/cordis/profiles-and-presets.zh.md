# Profile、Preset 与 YAML 组合

[English](profiles-and-presets.md) | 中文

Profile 是小型、场景化的 Pi-Cordis 内置插件集合。它改变策略和模型可见工具面，不替换 Pi 的 Agent Loop 或 TUI。

## 标准 Profile

| Profile | 组合 |
| --- | --- |
| `default` | `safety-gate`、`git-guard`、`rules-injector`、`todo-tracker`、`output-truncator`、`ask-question`、`btw`、`terminal-notifier` |
| `plan` | `plan-mode`、只读 `safety-gate`、`rules-injector`、`todo-tracker`、`output-truncator`、`ask-question` |
| `ptc` | `code-mode`、`safety-gate`、`git-guard`、`rules-injector`、`todo-tracker`、`output-truncator`、`ask-question` |

`minimal` 仅供内部和测试使用，不挂载能力插件。

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
- name: '@pi-cordis/plugin-plan-mode'
- name: '@pi-cordis/plugin-safety-gate'
  config:
    readOnly: true
- name: '@pi-cordis/plugin-rules-injector'
```

Profile YAML 当前只组合 Pi-Cordis 内置插件。未知名称会在销毁当前 Profile 之前使切换失败；普通 Pi 扩展应通过 Pi Package Manager 安装。

## 切换与销毁

```bash
picds --profile plan
picds --profile ptc
```

TUI 内可使用 `/profile default`、`/profile plan`、`/profile ptc`。每次切换都会销毁上一 Profile 的精确 Fiber，挂载新集合，并通过桥接调用 `pi.setActiveTools()`。

开发期 HMR 监听 Profile YAML 和可选插件源码。一次 YAML 变更只触发一次串行重载；Watcher、Debounce Timer 与热载 Fiber 都随 Cordis Context 销毁。
