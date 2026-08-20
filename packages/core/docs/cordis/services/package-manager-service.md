# PackageManagerService (`ctx.packageManager`)

English | [中文](package-manager-service.zh.md)

`PackageManagerService` is the package lifecycle service in Pi-Cordis. It installs, updates, and removes extensions from the `pi.dev` marketplace, npm, and git repositories, managing package manifests and streaming live progress to the Cordis EventBus.

---

## Supported Package Sources

Pi-Cordis is 100% compatible with native Pi package sources:
- **`pi.dev` Community Packages**: Direct package names, e.g. `rpiv-todo`;
- **npm Packages**: `npm:@scope/package-name`;
- **Git Repositories**: `git:https://github.com/user/repo.git`;
- **Local Directories**: `./local/path/to/extension`.

---

## API Reference

### 1. `ctx.packageManager.install(source: string, options?: { local?: boolean }): Promise<any>`
Installs a package from a specified source. Pass `local: true` to install as a project-scoped package. Emits `pi/package-installed`.
```typescript
await ctx.packageManager.install("npm:@juicesharp/rpiv-todo");
```

### 2. `ctx.packageManager.remove(source: string, options?: { local?: boolean }): Promise<any>`
Removes an installed package. Emits `pi/package-removed`.

### 3. `ctx.packageManager.update(source?: string): Promise<any>`
Updates a specific package or all installed packages. Emits `pi/package-updated`.

### 4. `ctx.packageManager.listConfiguredPackages(): PackageSource[]`
Returns all declared package sources across global and project settings.

### 5. `ctx.packageManager.setProgressCallback(callback: (message: string) => void): void`
Registers a progress callback, automatically broadcasting messages to `pi/package-progress`.

---

## Events Emitted

- **`pi/package-installed`**: `{ source: string, local?: boolean }`
- **`pi/package-removed`**: `{ source: string, local?: boolean }`
- **`pi/package-updated`**: `{ source?: string }`
- **`pi/package-progress`**: `{ message: string }`

---

## Plugin Integration Example

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "package-watcher";
export const inject = ["packageManager"];

export function apply(ctx: Context) {
    ctx.on("pi/package-progress", ({ message }) => {
        console.log(`[PKG-PROGRESS] ${message}`);
    });

    ctx.on("pi/package-installed", ({ source, local }) => {
        console.log(`🎉 Package [${source}] successfully installed to ${local ? "project" : "global"} scope`);
    });
}
```
