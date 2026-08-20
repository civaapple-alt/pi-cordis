# 原生 Cordis 插件开发指南

[English](plugin-development.md) | 中文

本指南详细介绍如何为 Pi-Cordis 编写原生 Cordis 插件（`@pi-cordis/plugin-*`）。

---

## 一、插件标准结构

在 `packages/plugins/<plugin-name>/` 下创建插件工作区：

```
packages/plugins/my-plugin/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    └── index.ts
```

### `package.json` 规范
```json
{
  "name": "@pi-cordis/plugin-my-plugin",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "peerDependencies": {
    "@deepseek-ai/cordis": "workspace:*"
  }
}
```

---

## 二、插件编写核心模式

### 1. 显式依赖声明 (`inject`)
必须显式声明插件所依赖的 Core Service，Cordis 会在所有依赖就绪后才激活插件：
```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "my-plugin";
export const inject = ["tools", "settings"];

export interface MyPluginConfig {
  enabled?: boolean;
}

export function apply(ctx: Context, config: MyPluginConfig = {}) {
  // 插件逻辑
}

export default { name, inject, apply };
```

### 2. 动态注册与可逆销毁 (`ctx.effect`)
所有对系统状态的修改必须是可逆的：
```typescript
export function apply(ctx: Context) {
  // 1. 注册工具
  const unregisterTool = ctx.tools.registerCustomTool({
    name: "my_tool",
    description: "我的自定义工具",
    parameters: { type: "object", properties: {} },
    execute: async () => ({ success: true })
  });

  // 2. 绑定销毁句柄
  ctx.effect(() => () => {
    unregisterTool();
  });

  // 3. 监听事件（ctx.on 会自动参与 Fiber 回收）
  ctx.on("pi/tool-call", ({ toolName }) => {
    console.log(`Tool invoked: ${toolName}`);
  });
}
```
