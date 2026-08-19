# presets/ — Agent 能力预设与 Profile 配置目录

[English](README.md) | 中文

`presets/` 目录下存放系统中所有的 Agent 角色与能力预设。每个预设为一个独立子目录，包含两份声明式 YAML 配置文件：
1. **`preset.yml`**：预设的展示名称与描述元数据；
2. **`cordis.yml`**：该预设在激活时挂载到 Cordis 上下文中的原生插件列表及配置参数。

---

## 现有 Presets 概览

| 预设标识 | 预设名称 | 目录路径 | 挂载插件列表 | 适用场景 |
|---|---|---|---|---|
| **`default`** | 标准日常开发模式 | [`presets/default/`](default/) | `@pi-cordis/plugin-rules-injector`, `@pi-cordis/plugin-todo-tracker` | 标准日常开发，规则自动注入与待办任务管理。 |
| **`safe`** | 安全生产工程模式 | [`presets/safe/`](safe/) | `@pi-cordis/plugin-safety-gate`, `@pi-cordis/plugin-git-guard`, `@pi-cordis/plugin-rules-injector`, `@pi-cordis/plugin-todo-tracker` | 生产环境开发，拦截高危破坏性命令、防止敏感配置泄漏、自动 Git 检查点。 |
| **`strict`** | 严格审计只读模式 | [`presets/strict/`](strict/) | `@pi-cordis/plugin-safety-gate` (只读), `@pi-cordis/plugin-git-guard`, `@pi-cordis/plugin-rules-injector` | 代码安全审查与诊断，禁用全部文件写入与高危指令。 |
| **`full`** | 全能极客模式 | [`presets/full/`](full/) | 激活全部 4 大原生 Cordis 插件 | 全能开发模式，兼具最完备的安全、任务、Git 与规则能力。 |
| **`minimal`** | 极简微内核模式 | [`presets/minimal/`](minimal/) | 无额外插件 | 纯净极简运行，仅保留 10 大核心服务。 |

---

## 如何添加自定义 Preset？

添加一个新的预设只需新建一个子目录（如 `presets/reviewer/`、`.pi/presets/reviewer/` 或 `~/.pi/presets/reviewer/`）：

1. 创建 `preset.yml`：
   ```yaml
   name: 代码审查专家 (Reviewer)
   description: 针对代码质量与架构规范的专项审查预设
   ```

2. 创建 `cordis.yml`：
   ```yaml
   - name: '@pi-cordis/plugin-safety-gate'
     config:
       readOnly: true
   - name: '@pi-cordis/plugin-rules-injector'
   ```

保存后，启动 `pnpm pi` 或在 TUI 中输入 `/profile`，系统会自动发现并展示新预设！
