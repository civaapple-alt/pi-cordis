# presets/ — Agent 能力预设与 Profile 配置目录

[English](README.md) | 中文

`presets/` 目录下存放 **Pi-Cordis** 中所有的场景化 Agent 运行预设。践行 **“默认即最佳 (Default is Best)” 的极简设计哲学**，系统彻底废除了基于内部插件微小差异的人工排列组合，收敛为 **3 大具有根本行为形态差异的场景级预设**。

每个预设为一个独立子目录，包含两份声明式 YAML 配置文件：
1. **`preset.yml`**：预设的展示名称、说明文案与 UI 排序元数据；
2. **`cordis.yml`**：该预设在激活时挂载到 Cordis 微内核上下文中的原生插件列表及校验配置。

---

## 3 大核心场景预设概览

| 预设标识 | 预设展示名称 | 目录路径 | 核心挂载插件与能力 | 核心适用场景 |
|---|---|---|---|---|
| **`default`** | 标准日常开发模式 (Default is Best) | [`presets/default/`](default/) | `safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`, `ask-question`, `context-compactor`, `subagent`, `git-automation`, `session-handoff`, `ssh-delegator`, `tools-manager` | **默认即最佳**。适用于 95% 以上日常研发，开箱全量就绪安全守门、任务追踪、规则注入、多智能体协同与人机对齐问答。 |
| **`plan`** | 规划与审计模式 (Plan / Review) | [`presets/plan/`](plan/) | `plan-mode`, `safety-gate` (`readOnly: true`), `rules-injector`, `todo-tracker`, `output-truncator`, `ask-question`, `context-compactor` | 大型重构、架构探索与方案设计。严格开启只读安全保护，强力拦截一切写操作，待方案审批后再行实施。 |
| **`ptc`** | 编程调用模式 (PTC / Code Mode) | [`presets/ptc/`](ptc/) | `code-mode` (`worker_threads`), `safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`, `context-compactor` | 海量文件扫描与批量数据处理。通过动态 TypeScript SDK 将原本 5~10 轮交互坍缩为 1 轮本地程序化执行。 |

---

## 预设切换与使用方式

- **CLI 命令行启动**：`pnpm pi --profile plan` 或 `pnpm pi --profile ptc`
- **TUI 交互式切换**：在终端输入框中输入 `/profile plan` 或 `/profile ptc`
- **默认无感启动**：直接运行 `pnpm pi`（自动加载 `default` 模式，零配置享受最完整能力与最高安全防线）。

---

## 如何添加自定义 Preset？

若需添加专属业务预设，只需新建子目录（如 `presets/reviewer/`、`.pi/presets/reviewer/` 或 `~/.pi/presets/reviewer/`）：

1. **`preset.yml`**：
   ```yaml
   name: 代码审查专家 (Reviewer)
   description: 针对代码质量与架构规范的专项审查预设
   order: 4
   ```

2. **`cordis.yml`**：
   ```yaml
   - name: '@pi-cordis/plugin-safety-gate'
     config:
       readOnly: true
   - name: '@pi-cordis/plugin-rules-injector'
   ```
