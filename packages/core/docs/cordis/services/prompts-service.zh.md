# PromptsService (`ctx.prompts`)

[English](prompts-service.md) | 中文

`PromptsService` 负责提示词模板管理，从文件系统加载模板并支持插件通过 `this.ctx.effect()` 动态注册内存提示词模板（插件卸载时自动注销）。

## API 接口

### `ctx.prompts.load(options?): PromptTemplate[]`
从磁盘加载所有提示词模板，并与动态注册的内存模板合并。

### `ctx.prompts.registerPrompt(template: PromptTemplate): () => void`
动态注册自定义提示词模板。返回注销句柄，在 Fiber 卸载时自动注销。

### `ctx.prompts.getPrompt(name: string): PromptTemplate | undefined`
通过模板名称查找特定提示词模板。

### `ctx.prompts.getAllPrompts(): PromptTemplate[]`
获取当前所有可用提示词模板列表。

## 触发事件

- `pi/prompt-registered`：`(prompt: PromptTemplate)`
