# PackageManagerService (`ctx.packageManager`)

[English](package-manager-service.md) | 中文

`PackageManagerService` 负责 npm 与 git 扩展包的安装、更新与卸载，并将实时执行进度流向 Cordis 事件总线。

## API 接口

### `ctx.packageManager.install(source: string, options?): Promise<any>`
安装指定包并广播 `pi/package-installed`。

### `ctx.packageManager.remove(source: string, options?): Promise<any>`
卸载指定包并广播 `pi/package-removed`。

### `ctx.packageManager.update(source?: string): Promise<any>`
更新已安装的包并广播 `pi/package-updated`。

### `ctx.packageManager.listConfiguredPackages(): PackageSource[]`
列出全局与项目设置中已配置的所有包源。

### `ctx.packageManager.setProgressCallback(callback): void`
设置进度监听器并将进度消息自动广播至 `pi/package-progress`。

## 触发事件

- `pi/package-installed`：`{ source: string, local?: boolean }`
- `pi/package-removed`：`{ source: string, local?: boolean }`
- `pi/package-updated`：`{ source?: string }`
- `pi/package-progress`：`{ message: string }`
