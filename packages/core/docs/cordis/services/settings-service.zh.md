# SettingsService (`ctx.settings`)

[English](settings-service.md) | 中文

`SettingsService` 是 Pi-Cordis 的核心配置管理服务，深度集成 `@earendil-works/pi-coding-agent` 的 `SettingsManager`，提供全局与项目级配置的分层合并、响应式更新、Schema 校验，并在配置变更时向 Cordis 中央事件总线广播 `pi/settings-updated` 事件。

---

## 配置文件路径与作用域 (Scopes)

Pi-Cordis 采用物理隔离的用户目录策略，配置存储位置如下：

| 作用域 | 存储路径 | 说明 |
|---|---|---|
| **全局配置 (Global)** | `~/.picds/agent/settings.json` | 适用于当前用户的所有项目与会话 |
| **项目配置 (Project)** | `<cwd>/.picds/settings.json` | 仅适用于当前项目目录（优先读取） |
| **项目兼容配置 (Fallback)**| `<cwd>/.pi/settings.json` | 若 `.picds/` 不存在，自动向下兼容原生 Pi 配置 |

---

## API 接口参考

### 1. `ctx.settings.get(): Settings`
获取全局配置对象。

### 2. `ctx.settings.getEffective(): Settings`
获取当前项目生效的完整合并配置（项目级配置 > 全局配置）。

### 3. `ctx.settings.getSetting<K extends keyof Settings>(key: K): Settings[K]`
读取指定配置项的值，优先返回当前生效的值。
```typescript
const theme = ctx.settings.getSetting("theme"); // "dark" | "light"
const quiet = ctx.settings.getSetting("quietStartup"); // boolean
```

### 4. `ctx.settings.setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void`
设置并持久化指定配置项，自动广播 `pi/settings-updated` 事件。

### 5. `ctx.settings.update(partialSettings: Partial<Settings>): void`
批量应用部分配置更新，持久化至全局存储并广播 `pi/settings-updated`。
```typescript
ctx.settings.update({
    theme: "dark",
    quietStartup: true,
    defaultThinkingLevel: "medium"
});
```

### 6. `ctx.settings.getCwd(): string`
获取当前工作目录绝对路径。

### 7. `ctx.settings.getAgentDir(): string`
获取全局 Agent 配置目录绝对路径（默认 `~/.picds/agent`）。

### 8. `ctx.settings.drainErrors(): any[]`
获取并清空配置加载或解析过程中记录的所有警告与错误。

---

## 常用配置项全景表

| 配置项 (Key) | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `defaultProvider` | `string` | - | 默认模型供应商（如 `"deepseek"`, `"anthropic"`, `"openai"`） |
| `defaultModel` | `string` | - | 默认模型标识符（如 `"deepseek-chat"`, `"claude-3-7-sonnet"`） |
| `defaultThinkingLevel`| `string` | - | 思考级别：`"off"`, `"minimal"`, `"low"`, `"medium"`, `"high"`, `"max"` |
| `theme` | `string` | `"dark"` | TUI 界面主题（`"dark"`, `"light"` 或自定义主题名） |
| `quietStartup` | `boolean`| `false`| 是否隐藏 TUI 启动时的 ASCII 艺术标题与欢迎头 |
| `shellPath` | `string` | 自动探测 | 执行 `bash` 工具的 Shell 解释器路径 |
| `thinkingBudgets` | `object` | - | 自定义思考 Token 预算映射表 |

---

## 广播事件 (Events)

- **`pi/settings-updated`**：当配置被修改时触发。
  - **Payload**: `{ settings: Settings, changedKeys: string[] }`
  - **监听示例**：
    ```typescript
    ctx.on("pi/settings-updated", ({ settings, changedKeys }) => {
        if (changedKeys.includes("theme")) {
            console.log(`主题已变更为: ${settings.theme}`);
        }
    });
    ```

---

## 插件集成范例 (Plugin Example)

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "theme-guard";
export const inject = ["settings"];

export function apply(ctx: Context) {
    // 读取当前配置
    const currentTheme = ctx.settings.getSetting("theme");

    // 监听配置变更
    ctx.on("pi/settings-updated", ({ settings, changedKeys }) => {
        if (changedKeys.includes("theme")) {
            // 执行主题联动逻辑
        }
    });
}
```
