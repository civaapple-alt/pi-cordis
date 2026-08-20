# ExtensionService (`ctx.extensions`)

[English](extension-service.md) | 中文

`ExtensionService` 是 Pi-Cordis 的扩展加载与双向命令/UI桥接服务。它负责从本地路径或已安装的 npm/git 包中加载 TypeScript 扩展，并将 Cordis 插件注册的斜杠命令（Slash Commands）与 Pi 原生的 `ExtensionAPI` 双向桥接至 7 大 TUI 交互槽位，广播 `pi/extension-loaded`、`pi/command-registered` 等事件。

---

## 核心职责与架构

```text
┌─────────────────────────────────────────────────────────────┐
│                 ExtensionService 统一桥接中心                │
├─────────────────────────────────────────────────────────────┤
│  Cordis 插件层 (@pi-cordis/profiles, @pi-cordis/plugin-btw)  │
│         │                                                   │
│         ▼ ctx.extensions.registerCommand("btw", ...)        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │     ExtensionService 注册表 (commands Map + Disposer)  │  │
│  └───────────────────────────────────────────────────────┘  │
│         │                                                   │
│         ▼ createBridgeExtensionFactory()                    │
│  上游 TUI 主循环 (pi.registerCommand -> ctx.ui.notify/select) │
└─────────────────────────────────────────────────────────────┘
```

---

## 7 大 TUI 交互槽位桥接

`ExtensionService` 允许扩展通过统一接口驱动终端 UI 交互：
1. **Select 交互选择**：在全屏终端中弹出带键盘导航的单选/多选下拉菜单；
2. **Confirm 确认弹窗**：高危操作执行前向用户发起 `[Y/n]` 阻塞式确认；
3. **Header / Footer 状态条**：在终端顶部或底部动态渲染自定义状态信息；
4. **Toast 轻量提示**：在终端右下角弹出渐变式通知（`ctx.ui.notify`）；
5. **自定义工具渲染器 (Custom Tool Renderer)**：为工具执行过程定制 ANSI/字符图表渲染；
6. **消息折叠渲染器 (Message Renderer)**：折叠长文本输出或渲染多媒体卡片；
7. **状态栏指标 (Status Bar Indicators)**：在底部状态栏追加实时指标（如 Token 统计、Git 分支）。

---

## API 接口参考

### 1. `ctx.extensions.registerCommand(name: string, definition: ExtensionCommandDefinition): () => void`
供任意 Cordis 插件通过 Cordis Fiber 声明式注册终端斜杠命令。返回可逆的 `Disposer` 函数，在插件卸载时自动注销命令。
```typescript
export interface ExtensionCommandDefinition {
    description: string;
    getArgumentCompletions?: (prefix: string) => Array<{ value: string; label?: string }> | null;
    handler: (args: string, cmdCtx: any) => Promise<void> | void;
}
```

### 2. `ctx.extensions.getRegisteredCommands(): ReadonlyMap<string, ExtensionCommandDefinition>`
获取当前所有 Cordis 插件注册的斜杠命令集合。

### 3. `ctx.extensions.createBridgeExtensionFactory(): { name: string; factory: Function; hidden: boolean }`
创建隐式内联扩展工厂，供 CLI 启动时传递给上游 `main({ extensionFactories })`，自动将微内核所有命令注册到 TUI。

### 4. `ctx.extensions.load(options?): Promise<any>`
从配置的本地路径与已安装包中扫描并加载所有外部扩展。加载完成后触发 `pi/extension-loaded`。

### 5. `ctx.extensions.getLoadedExtensions(): any[]`
返回当前所有已成功加载的扩展描述符列表。

### 6. `ctx.extensions.getLoadedTools(): any[]`
返回当前已加载扩展所注册贡献的所有工具定义。

---

## 广播事件 (Events)

- **`pi/extension-loaded`**：当外部扩展加载完成时触发 `(result: any)`。
- **`pi/command-registered`**：当插件注册斜杠命令时触发 `(event: { name: string; definition: any })`。
- **`pi/command-unregistered`**：当插件注销斜杠命令时触发 `(name: string)`。

---

## Cordis 插件注册命令范例

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "my-command-plugin";
export const inject = ["extensions"];

export function apply(ctx: Context) {
    ctx.extensions.registerCommand("hello", {
        description: "打印打招呼消息",
        handler: async (args, cmdCtx) => {
            if (cmdCtx.hasUI) {
                cmdCtx.ui.notify(`Hello, ${args || "world"}!`, "info");
            }
        },
    });
}
```
