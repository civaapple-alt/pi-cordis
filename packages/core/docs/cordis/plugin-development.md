# Native Cordis Plugin Development Guide

English | [中文](plugin-development.zh.md)

This guide explains how to build native Cordis plugins (`@pi-cordis/plugin-*`) for Pi-Cordis.

---

## 1. Plugin Workspace Structure

Create a new package under `packages/plugins/<plugin-name>/`:

```
packages/plugins/my-plugin/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    └── index.ts
```

### `package.json` Specification
```json
{
  "name": "@pi-cordis/plugin-my-plugin",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "peerDependencies": {
    "@deepseek-ai/cordis": "^4.0.1"
  }
}
```

---

## 2. Core Implementation Patterns

### 1. Explicit Dependencies (`inject`)
Declare all required Core Services explicitly. Cordis only activates the plugin once all dependencies are satisfied:
```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "my-plugin";
export const inject = ["tools", "settings"];

export interface MyPluginConfig {
  enabled?: boolean;
}

export function apply(ctx: Context, config: MyPluginConfig = {}) {
  // Plugin implementation
}

export default { name, inject, apply };
```

### 2. Dynamic Registrations & Reversibility (`ctx.effect`)
Every mutation to the runtime environment must be reversible:
```typescript
export function apply(ctx: Context) {
  // 1. Register a tool
  const unregisterTool = ctx.tools.registerCustomTool({
    name: "my_tool",
    description: "My custom tool",
    parameters: { type: "object", properties: {} },
    execute: async () => ({ success: true })
  });

  // 2. Register a terminal slash command (auto-bridged to TUI with completions)
  const unregisterCmd = ctx.extensions?.registerCommand?.("my_cmd", {
    description: "My custom terminal slash command",
    handler: async (args, cmdCtx) => {
      if (cmdCtx.hasUI) {
        cmdCtx.ui.notify(`Command executed with: ${args}`, "info");
      }
    }
  });

  // 3. Listen to events (ctx.on auto-disposes on fiber unload)
  ctx.on("pi/tool-call", ({ toolName }) => {
    console.log(`Tool invoked: ${toolName}`);
  });

  // 4. Return combined disposer
  return () => {
    unregisterTool();
    unregisterCmd?.();
  };
}
```
