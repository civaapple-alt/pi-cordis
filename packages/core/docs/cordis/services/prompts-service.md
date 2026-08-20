# PromptsService (`ctx.prompts`)

English | [中文](prompts-service.zh.md)

`PromptsService` manages prompt templates, loading them from the filesystem and supporting dynamic in-memory template registrations with `this.ctx.effect()` teardown.

## API Reference

### `ctx.prompts.load(options?): PromptTemplate[]`
Loads prompt templates from disk, combined with dynamic in-memory templates.

### `ctx.prompts.registerPrompt(template: PromptTemplate): () => void`
Registers a dynamic custom prompt template. Returns a disposer function that unregisters the template upon disposal.

### `ctx.prompts.getPrompt(name: string): PromptTemplate | undefined`
Retrieves a specific prompt template by name.

### `ctx.prompts.getAllPrompts(): PromptTemplate[]`
Returns all active prompt templates.

## Events Emitted

- `pi/prompt-registered`: `(prompt: PromptTemplate)`
