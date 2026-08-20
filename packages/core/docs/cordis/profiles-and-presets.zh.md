# 场景预设与 YAML 组合指南

[English](profiles-and-presets.md) | 中文

Pi-Cordis 践行“默认即最佳（Default is Best）”的极简哲学，提供 3 大开箱即用的核心场景预设（Presets），并支持通过声明式 `cordis.yml` 自定义插件装配与热重载（HMR）。

---

## 一、3 大核心场景预设

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        3 大核心场景预设 (Presets)                       │
├────────────────────────────────────────────────────────────────────────┤
│ 🌟 1. default (标准开发模式) : 开箱即用全能安全，规则注入 + 任务追踪   │
│ 🛡️ 2. plan (规划与审计模式) : 严格只读保护，步骤状态机 + 拦截写操作   │
│ ⚡ 3. ptc (编程调用模式)     : 强类型 TypeScript SDK + 1 轮极速批处理  │
└────────────────────────────────────────────────────────────────────────┘
```

| 预设名称 | 配置文件 | 适用场景与激活插件 |
|---|---|---|
| **`default`** | `presets/default/cordis.yml` | **默认即最佳**。日常 95% 编码任务，激活 `safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`, `ask-question`, `subagent`, `context-compactor` 等全套插件 |
| **`plan`** | `presets/plan/cordis.yml` | 架构探索、重构规划与只读审计。激活 `plan-mode`、`safety-gate: { readOnly: true }` 强制阻断一切写操作 |
| **`ptc`** | `presets/ptc/cordis.yml` | 批量文本替换与海量文件扫描。激活 `code-mode` 动态暴露 `.d.ts` SDK 并遮蔽底层单步工具 |

---

## 二、声明式 `cordis.yml` 语法

在项目根目录或 `presets/<name>/` 中定义 `cordis.yml`：

```yaml
plugins:
  "@pi-cordis/plugin-safety-gate":
    readOnly: false
    blockedCommands:
      - "rm -rf /"
      - "mkfs"

  "@pi-cordis/plugin-todo-tracker":
    maxActiveTasks: 5

  "@pi-cordis/plugin-rules-injector":
    scanClaudeRules: true
    scanAgentRules: true
```

---

## 三、命令行与运行时预设切换

```bash
# 启动时指定预设
pnpm picds --profile plan
pnpm picds --profile ptc

# 终端中即时免重启切换
/profile plan
/profile ptc
/profile default
```
