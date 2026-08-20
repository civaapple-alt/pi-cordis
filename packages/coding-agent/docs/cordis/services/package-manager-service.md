# PackageManagerService (`ctx.packageManager`)

English | [中文](package-manager-service.zh.md)

`PackageManagerService` manages npm and git package installations, updates, and removals, streaming real-time progress events to the Cordis event bus.

## API Reference

### `ctx.packageManager.install(source: string, options?): Promise<any>`
Installs a package and emits `pi/package-installed`.

### `ctx.packageManager.remove(source: string, options?): Promise<any>`
Removes a package and emits `pi/package-removed`.

### `ctx.packageManager.update(source?: string): Promise<any>`
Updates installed packages and emits `pi/package-updated`.

### `ctx.packageManager.listConfiguredPackages(): PackageSource[]`
Lists all packages configured in global or project settings.

### `ctx.packageManager.setProgressCallback(callback): void`
Sets a progress listener and forwards progress messages to `pi/package-progress`.

## Events Emitted

- `pi/package-installed`: `{ source: string, local?: boolean }`
- `pi/package-removed`: `{ source: string, local?: boolean }`
- `pi/package-updated`: `{ source?: string }`
- `pi/package-progress`: `{ message: string }`
