# ExtensionService (`ctx.extensions`)

[English](extension-service.md) | 中文

`ExtensionService` 是 Pi-Cordis 的扩展加载与双向桥接服务。它负责从本地路径或已安装的 npm/git 包中加载 TypeScript 扩展，并将 Pi 原生的 `ExtensionAPI` 双向桥接至 Cordis 事件总线与 7 大 TUI 交互槽位，广播 `pi/extension-loaded` 事件。

---

## 7 大 TUI 交互槽位桥接

`ExtensionService` 允许扩展通过统一接口驱动终端 UI 交互：
1. **Select 交互选择**：在全屏终端中弹出带键盘导航的单选/多选下拉菜单；
2. **Confirm 确认弹窗**：高危操作执行前向用户发起 `[Y/n]` 阻塞式确认；
3. **Header / Footer 状态条**：在终端顶部或底部动态渲染自定义状态信息；
4. **Toast 轻量提示**：在终端右下角弹出渐变式通知；
5. **自定义工具渲染器 (Custom Tool Renderer)**：为工具执行过程定制 ANSI/字符图表渲染；
6. **消息折叠渲染器 (Message Renderer)**：折叠长文本输出或渲染多媒体卡片；
7. **状态栏指标 (Status Bar Indicators)**：在底部状态栏追加实时指标（如 Token 统计、Git 分支）。

---

## API 接口参考

### 1. `ctx.extensions.load(options?): Promise<any>`
从配置的本地路径与已安装包中扫描并加载所有扩展。加载完成后触发 `pi/extension-loaded`。

### 2. `ctx.extensions.getLoadedExtensions(): any[]`
返回当前所有已成功加载的扩展描述符列表。

### 3. `ctx.extensions.getLoadedTools(): any[]`
返回当前已加载扩展所注册贡献的所有工具定义。

---

## 广播事件 (Events)

- **`pi/extension-loaded`**：当扩展加载完成时触发 `(result: any)`。

---

## 扩展编写范例 (Extension Example)

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function myExtension(pi: ExtensionAPI) {
    // 注册自定义斜杠命令
    pi.registerCommand("hello", {
        description: "打印打招呼消息",
        handler: async (args, ctx) => {
            if (ctx.hasUI) {
                ctx.ui.notify(`Hello, ${args || "world"}!`, "info");
            }
        }
    });

    // 注册会话生命周期监听
    pi.on("session_start", async (_event, ctx) => {
        console.log("会话已启动");
    });
}
```
