# PromptsService (`ctx.prompts`)

[English](prompts-service.md) | 中文

`PromptsService` 是 SDK 侧提示词目录：加载兼容 Pi 的模板文件，并为 Cordis 消费方提供可逆的内存注册栈。

Pi Extension API 没有内存提示词注册接口，因此本服务的动态注册不会自动进入交互式 Pi 的提示词加载器。若 TUI 必须消费模板，应使用提示词文件或 Pi Package。

---

## 模板路径与变量语法

- **项目模板路径**：Pi 上游的 `<cwd>/.pi/prompts/`；如需 `.picds` 自定义目录，可通过 `promptPaths` 显式传入
- **全局模板路径**：`~/.picds/agent/prompts/`

### 模板文件格式范例 (`refactor.md`)
```markdown
---
description: 针对指定文件进行模块化解耦重构
---

请重构以下文件 $1，遵循 $2 架构规范，并保持现有单元测试全部通过。
```

---

## API 接口参考

### 1. `ctx.prompts.load(options?): Promise<PromptTemplate[]>`
加载所有磁盘提示词模板并与动态注册的内存模板合并返回。

### 2. `ctx.prompts.registerPrompt(template: PromptTemplate): () => void`
动态注册一个 SDK 侧提示词模板并返回 Disposer。后注册的同名项会暂时遮蔽前一项，销毁后恢复仍存活的前一项。
```typescript
const unregister = ctx.prompts.registerPrompt({
    name: "explain-code",
    description: "逐行深度剖析复杂代码段的设计意图",
    template: "请详细分析以下代码段：\n$1\n重点分析时间复杂度与潜在边界条件。"
});
```

### 3. `ctx.prompts.getPrompt(name: string): Promise<PromptTemplate | undefined>`
根据模板名称检索特定提示词模板。

### 4. `ctx.prompts.getAllPrompts(): Promise<PromptTemplate[]>`
获取当前所有可用提示词模板列表。

---

## 广播事件 (Events)

- **`pi/prompt-registered`**：当新提示词模板被注册时触发 `(prompt: PromptTemplate)`。
- **`pi/prompt-unregistered`**：模板注册销毁时触发 `(name: string)`。

---

## 插件集成范例 (Plugin Example)

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "quick-prompts";
export const inject = ["prompts"];

export function apply(ctx: Context) {
    const unregister = ctx.prompts.registerPrompt({
        name: "gen-test",
        description: "为指定函数自动生成 100% 覆盖率的单元测试",
        template: "请为以下函数编写 Vitest 单元测试：\n$1"
    });

    ctx.effect(() => () => unregister());
}
```
