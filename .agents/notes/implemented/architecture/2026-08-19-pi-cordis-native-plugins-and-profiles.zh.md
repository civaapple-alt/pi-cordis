# Agent Note: Pi-Cordis 原生 Cordis 插件体系与 Profile 预设机制

Status: implemented
Created: 2026-08-19

[English](2026-08-19-pi-cordis-native-plugins-and-profiles.md) | 中文

## 摘要 (Executive Summary)

本篇架构决策记录（ADR）详细记录了在 `pi-cordis` 中构建**原生 Cordis 插件集合（Native Cordis Plugins）**与**Profile 预设组合装配体系**的设计与实现：
1. **独立插件包工作区（`packages/plugins/*`）**：采用模块化 Monorepo 规范，每个插件独立为一个自治的子包；
2. **四大原生 Cordis 插件**：
   - `@pi-cordis/plugin-safety-gate`：拦截高危破坏性 Shell 命令与敏感文件修改；
   - `@pi-cordis/plugin-git-guard`：提供 Git 工作区脏状态提示与关键轮次自动 Checkpoint 保护；
   - `@pi-cordis/plugin-todo-tracker`：提供 `todo_write`/`todo_read` 待办工具与活跃任务动态注入；
   - `@pi-cordis/plugin-rules-injector`：自动扫描项目规则文件（`AGENTS.md`, `.claude/rules/*.md`, `.cursorrules`）并注入系统提示词；
3. **Profile 预设装配中心（`@pi-cordis/profiles`）**：提供 `default`, `safe`, `strict`, `full`, `minimal` 等开箱即用的能力预设。

---

## 架构设计与目录布局

```text
packages/plugins/
├── safety-gate/              # @pi-cordis/plugin-safety-gate
│   ├── package.json
│   └── src/index.ts          # 高危命令与路径拦截器
├── git-guard/                # @pi-cordis/plugin-git-guard
│   ├── package.json
│   └── src/index.ts          # Git 检查点与状态守护
├── todo-tracker/             # @pi-cordis/plugin-todo-tracker
│   ├── package.json
│   └── src/index.ts          # 任务清单工具与提示词注入
├── rules-injector/           # @pi-cordis/plugin-rules-injector
│   ├── package.json
│   └── src/index.ts          # 项目规则自动发现与注入
└── profiles/                 # @pi-cordis/profiles
    ├── package.json
    └── src/index.ts          # Profile 预设矩阵与动态装配器
```

---

## 核心预设矩阵 (Built-in Profiles)

| 预设名称 | 适用场景 | 激活插件组合 |
| :--- | :--- | :--- |
| **`default`** | 标准日常开发 | `rules-injector` + `todo-tracker` |
| **`safe`** | 安全生产模式 | `safety-gate` + `git-guard` + `rules-injector` + `todo-tracker` |
| **`strict`** | 严格只读/受限环境 | `safety-gate` (只读与强拦截) + `git-guard` + `rules-injector` |
| **`full`** | 全能极客模式 | 激活全部 4 大原生插件 |
| **`minimal`** | 纯净极简模式 | 零附加插件，仅保留 10 大核心服务 |

---

## 使用与装配方式

### 1. 编程式装配
```typescript
import { createPiContext } from "@earendil-works/pi-coding-agent";

// 按预设快速装配
const ctx = await createPiContext({ profile: "safe" });

// 自定义插件参数覆盖
const customCtx = await createPiContext({
  profile: "default",
  plugins: {
    "safety-gate": { protectedPaths: [".env", "config/secrets.json"] },
  },
});
```

### 2. 声明式依赖注入与副作用安全
所有插件均遵循 Cordis v4.0.1 的依赖声明契约：
```typescript
export const name = "todo-tracker";
export const inject = ["tools"]; // 显式声明依赖 tools 服务

export function apply(ctx: Context, config: TodoTrackerConfig) {
  ctx.tools.register({ ... });
}
```

---

## 架构收益 (Benefits)

1. **高内聚低耦合**：每个插件作为独立的 workspace package，职责单一且支持单独发版与复用；
2. **灵活组合**：通过 Profile 机制，开发者可以在“纯净极简”与“全能守护”之间一键切换；
3. **原生享受 Cordis 优势**：基于 `ctx.effect`、`ctx.on` 与 `inject` 机制，插件具备完整的类型安全与可逆注销能力。
