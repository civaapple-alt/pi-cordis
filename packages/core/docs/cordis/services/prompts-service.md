# PromptsService (`ctx.prompts`)

English | [中文](prompts-service.zh.md)

`PromptsService` is the prompt template management and dynamic registration service in Pi-Cordis. It loads templates from project and global paths, supports variable interpolation (`$1`, `$@`), and allows plugins to dynamically register in-memory prompt templates with reversible `Disposer` teardowns upon plugin unload.

---

## Template Paths & Variable Syntax

- **Project Path**: `<cwd>/.picds/prompts/` or `<cwd>/.pi/prompts/`
- **Global Path**: `~/.picds/agent/prompts/`

### Template Format Example (`refactor.md`)
```markdown
---
description: Refactor a target file following specified patterns
---

Please refactor the following file $1 adhering to the $2 architectural pattern while ensuring all existing tests pass.
```

---

## API Reference

### 1. `ctx.prompts.load(options?): PromptTemplate[]`
Loads all on-disk prompt templates merged with dynamic in-memory templates.

### 2. `ctx.prompts.registerPrompt(template: PromptTemplate): () => void`
Registers a custom prompt template. Returns a disposer function.
```typescript
const unregister = ctx.prompts.registerPrompt({
    name: "explain-code",
    description: "Line-by-line deep analysis of complex algorithms",
    template: "Please analyze the following code:\n$1\nFocus on time complexity and edge conditions."
});
```

### 3. `ctx.prompts.getPrompt(name: string): PromptTemplate | undefined`
Retrieves a specific prompt template by name.

### 4. `ctx.prompts.getAllPrompts(): PromptTemplate[]`
Returns all available prompt templates.

---

## Events Emitted

- **`pi/prompt-registered`**: `(prompt: PromptTemplate)`

---

## Plugin Integration Example

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "quick-prompts";
export const inject = ["prompts"];

export function apply(ctx: Context) {
    const unregister = ctx.prompts.registerPrompt({
        name: "gen-test",
        description: "Generate 100% coverage Vitest tests for a target function",
        template: "Please write comprehensive unit tests for:\n$1"
    });

    ctx.effect(() => () => unregister());
}
```
