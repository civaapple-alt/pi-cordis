# @pi-cordis/plugin-code-mode

English | [中文](README.zh.md)

Programmatic Tool Calling (PTC / Code Mode) plugin for Pi-Cordis. It registers the `run_code` tool to execute batch tool workflows in a sandboxed JavaScript/TypeScript VM, collapsing multiple LLM round-trips into a single execution step.

## Tool

### `run_code`

Accepts:
- `code` (string, required): JavaScript/TypeScript code. The environment provides `console.log` and all active Pi tools bound to the `pi.*` global namespace (e.g. `await pi.read({ path: "file.ts" })`).

Returns:
- `success` (boolean): Execution status.
- `output` (string): Intercepted console logs and outputs.
- `error` (string, optional): Thrown exception message.
- `executionTimeMs` (number): Wall-clock execution time in milliseconds.

## Sandbox Architecture
Executes inside a Node.js `vm.createContext` sandbox with standard JavaScript globals (`Promise`, `Array`, `JSON`, `Math`, `Date`) and proxied asynchronous calls to `ctx.tools`.

## Model Experience
- **Round-Trip Reduction**: Collapses 5-10 conversational round-trips into 1 execution turn.
- **Token Efficiency**: Intermediate exploratory output stays inside the VM without blowing up the conversation token budget.
