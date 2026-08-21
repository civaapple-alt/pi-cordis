# Agent Note: Replace Vendored Cordis Sources with Official npm Packages

Status: implemented
Created: 2026-08-21

English | [中文](2026-08-21-pi-cordis-official-cordis-npm-dependencies.zh.md)

## Decision

Pi-Cordis consumes the public DeepSeek framework packages directly from npm:

- `@deepseek-ai/cordis@^4.0.1`
- `@deepseek-ai/cosmokit@^1.8.2`
- `@deepseek-ai/schemastery@^3.18.1`

The repository no longer contains a `vendor/` workspace. Plugin packages declare `@deepseek-ai/cordis@^4.0.1` as a peer dependency, while the root and `@pi-cordis/core` provide the runtime dependency.

Vitest does not alias DeepSeek package names to workspace source paths. Development, tests, and production therefore exercise the same published package artifacts.

## Rationale

The vendored packages were unmodified copies of public upstream releases. Keeping those copies increased repository size, duplicated upstream maintenance, and allowed tests to pass against a different resolution path than package consumers.

Using semver-bounded public dependencies preserves Cordis ownership, keeps the Pi-Cordis repository focused on its control plane and native plugins, and makes upstream upgrades explicit in `pnpm-lock.yaml`.

## Consequences

- Cordis upgrades no longer require copying source files or reapplying a local vendor patch.
- Installing dependencies now requires access to the npm registry or a compatible mirror/cache.
- A lockfile refresh is required whenever an upstream range resolves to a newer compatible release.
- Pi-Cordis continues to avoid all `@deepseek-ai/dsh-*` domain-specific business plugins.

## Verification

`pnpm install` resolved all three DeepSeek packages from the registry and removed every `link:vendor/*` entry. `pnpm run check` passed, and `pnpm test` passed all 40 tests across 3 test files.
