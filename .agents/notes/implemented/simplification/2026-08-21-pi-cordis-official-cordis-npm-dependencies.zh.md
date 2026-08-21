# Agent Note: Pi-Cordis 移除 Cordis 内置源码并直连官方 npm 包

Status: implemented
Created: 2026-08-21

[English](2026-08-21-pi-cordis-official-cordis-npm-dependencies.md) | 中文

## Decision

Pi-Cordis 直接消费 DeepSeek 发布的公开框架包：

- `@deepseek-ai/cordis@^4.0.1`
- `@deepseek-ai/cosmokit@^1.8.2`
- `@deepseek-ai/schemastery@^3.18.1`

仓库不再包含 `vendor/` 工作区。各插件包将 `@deepseek-ai/cordis@^4.0.1` 声明为 peer dependency，由根包和 `@pi-cordis/core` 提供运行时依赖。

Vitest 不再把 DeepSeek 包名重定向到工作区源码路径，开发、测试和生产运行时统一验证同一组 npm 发布产物。

## Rationale

原先内置的包是公开上游版本的未修改副本。这些副本增加了仓库体积和同步维护成本，也可能使测试使用的解析路径与最终包消费者不同。

改用受 semver 范围约束的公开依赖，可以保持 Cordis 的上游所有权，使 Pi-Cordis 仓库聚焦于控制面和原生插件，并让每次上游升级都明确记录在 `pnpm-lock.yaml` 中。

## Consequences

- Cordis 升级不再需要复制源码或重新应用本地 vendor 补丁；
- 首次安装依赖需要能够访问 npm registry、兼容镜像或本地缓存；
- 上游版本在兼容范围内更新时必须刷新并审查锁文件；
- Pi-Cordis 仍然不依赖任何 `@deepseek-ai/dsh-*` 专属业务插件。

## Verification

`pnpm install` 已从 registry 解析三个 DeepSeek 包，并移除全部 `link:vendor/*` 条目；`pnpm run check` 通过，`pnpm test` 的 3 个测试文件、40 项测试全部通过。
