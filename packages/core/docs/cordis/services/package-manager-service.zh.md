# PackageManagerService (`ctx.packageManager`)

[English](package-manager-service.md) | 中文

`PackageManagerService` 是 Pi-Cordis 的扩展包管理服务，负责从 `pi.dev` 插件市场、npm 以及 git 仓库安装、更新与卸载扩展包，自动管理依赖锁与清单，并将实时安装进度流向 Cordis 中央事件总线。

---

## 包源格式支持

Pi-Cordis 全面兼容原生 Pi 的包源格式：
- **`pi.dev` 社区市场包**：直接指定包名，如 `rpiv-todo`；
- **npm 官方/私有包**：`npm:@scope/package-name`；
- **Git 仓库**：`git:https://github.com/user/repo.git`；
- **本地路径**：`./local/path/to/extension`。

---

## API 接口参考

### 1. `ctx.packageManager.install(source: string, options?: { local?: boolean }): Promise<any>`
安装指定包源。支持通过 `local: true` 安装为当前项目专用包，否则默认安装至全局环境。触发 `pi/package-installed`。
```typescript
await ctx.packageManager.install("npm:@juicesharp/rpiv-todo");
```

### 2. `ctx.packageManager.remove(source: string, options?: { local?: boolean }): Promise<any>`
卸载指定包源。触发 `pi/package-removed`。

### 3. `ctx.packageManager.update(source?: string): Promise<any>`
更新指定包或全部已安装的扩展包。触发 `pi/package-updated`。

### 4. `ctx.packageManager.listConfiguredPackages(): PackageSource[]`
列出当前全局配置与项目配置中已声明的所有包源清单。

### 5. `ctx.packageManager.setProgressCallback(callback: (message: string) => void): void`
设置进度监听回调，内部会自动将进度消息广播至 `pi/package-progress` 事件。

---

## 广播事件 (Events)

- **`pi/package-installed`**：当包安装成功时触发 `{ source: string, local?: boolean }`；
- **`pi/package-removed`**：当包卸载完成时触发 `{ source: string, local?: boolean }`；
- **`pi/package-updated`**：当包更新完成时触发 `{ source?: string }`；
- **`pi/package-progress`**：安装或更新过程中的实时进度流 `{ message: string }`。

---

## 插件集成范例 (Plugin Example)

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "package-watcher";
export const inject = ["packageManager"];

export function apply(ctx: Context) {
    // 监听安装进度
    ctx.on("pi/package-progress", ({ message }) => {
        console.log(`[PKG-PROGRESS] ${message}`);
    });

    ctx.on("pi/package-installed", ({ source, local }) => {
        console.log(`🎉 插件包 [${source}] 已成功安装到 ${local ? "当前项目" : "全局用户空间"}`);
    });
}
```
