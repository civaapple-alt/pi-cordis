# PromptsService (`ctx.prompts`)

English | [中文](prompts-service.zh.md)

`PromptsService` is an SDK-side prompt catalog. It loads Pi-compatible template files and adds reversible in-memory registration stacks for Cordis consumers.

Pi's Extension API does not expose an in-memory prompt-registration method. Dynamic registrations in this service are therefore not automatically added to the interactive Pi prompt loader; use prompt files or Pi packages when the TUI must consume a template.

---

## Template Paths & Variable Syntax

- **Project Path**: Pi's upstream `<cwd>/.pi/prompts/`; custom `.picds` paths can be passed explicitly through `promptPaths`
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

### 1. `ctx.prompts.load(options?): Promise<PromptTemplate[]>`
Loads all on-disk prompt templates merged with dynamic in-memory templates.

### 2. `ctx.prompts.registerPrompt(template: PromptTemplate): () => void`
Registers a custom SDK-side prompt template. Returns a disposer function. A later registration with the same name shadows the earlier entry until disposed.
```typescript
const unregister = ctx.prompts.registerPrompt({
    name: "explain-code",
    description: "Line-by-line deep analysis of complex algorithms",
    template: "Please analyze the following code:\n$1\nFocus on time complexity and edge conditions."
});
```

### 3. `ctx.prompts.getPrompt(name: string): Promise<PromptTemplate | undefined>`
Retrieves a specific prompt template by name.

### 4. `ctx.prompts.getAllPrompts(): Promise<PromptTemplate[]>`
Returns all available prompt templates.

---

## Events Emitted

- **`pi/prompt-registered`**: `(prompt: PromptTemplate)`
- **`pi/prompt-unregistered`**: `(name: string)`

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
