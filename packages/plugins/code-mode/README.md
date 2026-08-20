# @pi-cordis/plugin-code-mode

English | [中文](README.zh.md)

Programmatic Tool Calling (PTC / Code Mode) plugin for Pi-Cordis. It replaces multiple serial JSON Function Calling turns with a single `run_code` execution step over a strong-typed TypeScript SDK, running inside an isolated Node.js `worker_threads.Worker` with physical `worker.terminate()` infinite-loop protection.

## Tool

### `run_code`

Accepts:
- `code` (string, required): The JavaScript/TypeScript code to execute. Can use `console.log` and `pi.*` tools (e.g. `await pi.read(...)`, `await pi.fs.read(...)`, or `await pi.bash.run(...)`).

Returns:
- `success` (boolean): Execution status.
- `output` (string): Intercepted console logs and formatted output.
- `error` (string, optional): Error message or stack trace if execution failed.
- `executionTimeMs` (number): Wall-clock execution time in milliseconds.

## Key Architectural Features

### 1. Dynamic TypeScript SDK Generation (`dts-generator.ts`)
- Automatically compiles JSON Schemas of all active tools into a structured `declare namespace pi { ... }` declaration.
- Injected into the system prompt via the `pi/prompt-transform` hook, allowing coding LLMs to reason with precise `.d.ts` types instead of raw JSON Schemas.
- Provides semantic namespaces:
  - `pi.fs`: `read`, `write`, `edit`, `patch`, `list`, `find`, `grep`
  - `pi.bash`: `exec`, `run`
  - Flat methods: `pi.<toolName>` for all registered tools.

### 2. Tool Presentation Masking
- Automatically filters out raw underlying tools (`read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`) from the model's top-level tool list.
- Only exposes `run_code` (and explicitly allowed top-level interaction tools like `ask_question`, `session_handoff`), reducing tool schema token overhead by 80%+.
- Retains full programmatic access to all tools inside the worker sandbox.

### 3. Isolated Worker Thread Execution Engine (`worker-runner.ts`)
- Spawns a dedicated Node.js `worker_threads.Worker` (isolated V8 Isolate and OS thread) for each execution.
- **Async Infinite Loop Protection**: If the script contains an infinite loop (e.g. `while(true) await Promise.resolve()`), the main thread invokes `worker.terminate()` upon timeout, destroying the V8 Isolate and immediately freeing all CPU/memory resources.
- **Fallback**: Gracefully falls back to `node:vm` if worker spawning is restricted.

### 4. TUI Visual Cards (`renderer.ts`)
- `renderCall`: Displays a formatted header with line count and a 4-line syntax preview.
- `renderResult`:
  - **Collapsed**: Compact single-line summary with duration (`✓ Executed in 12ms → summary`).
  - **Expanded**: Full console logs, structured output, and error diagnostics.

## Configuration

```yaml
- name: '@pi-cordis/plugin-code-mode'
  config:
    timeoutMs: 30000              # Execution timeout in milliseconds (default: 30000)
    useWorkerThreads: true        # Use worker_threads for Isolate isolation (default: true)
    maskUnderlyingTools: true     # Mask underlying tools from model schema (default: true)
    injectFullDts: true           # Inject full .d.ts into system prompt (default: true)
    allowedTopLevelTools:         # Whitelist of unmasked top-level tools
      - run_code
      - ask_question
      - session_handoff
```

## Model Experience

### Tool Schema & Presentation
- **Token Effect**: Replaces dozens of verbose tool schemas with 1 compact `run_code` schema and a reusable `.d.ts` system prompt block.
- **KV Cache Effect**: Prefix-stable; SDK type definitions remain constant throughout the session.

### Execution & Context Preservation
- Intermediate data (e.g. reading 50 files or filtering arrays) is processed entirely in worker memory.
- Only explicitly printed `console.log` summaries and final results return to the conversation context, saving 90%+ of context window capacity.

## Known Limitations and Deferred Work
- Cross-session persistent global variables within the worker are intentionally not preserved (each execution starts from a fresh isolate).
- Multi-host distributed worker dispatching is deferred.
