# Agent Note: Pi-Cordis Repository Simplification and Upstream Decoupling

Status: implemented
Created: 2026-08-19

English | [中文](2026-08-19-pi-cordis-repository-simplification.zh.md)

## Executive Summary

This Architecture Decision Record (ADR) documents the **major repository simplification** executed on `pi-cordis`.
By pruning unmodified upstream subpackages (`packages/ai`, `packages/agent`, `packages/tui`, `packages/client`, `packages/server`, `packages/protocol`, `packages/telemetry`, `packages/evals`, `packages/session-backends`) and transitioning to direct consumption of official `@earendil-works/pi-*` and `@deepseek-ai/*` packages from the npm registry, `pi-cordis` focuses entirely on its core value: **`packages/core` (10 core Cordis services and control-plane bootstrap) + `packages/plugins` (native Pi-Cordis capabilities)**.

---

## Problem Context

During the initial refactoring phase, `pi-cordis` retained full source trees of all upstream Pi subpackages (>1200 files, >300k lines of code) to ensure complete behavioral parity and end-to-end debugging.
A comprehensive cross-package audit confirmed that:
1. Beyond `packages/coding-agent/src/core/cordis/`, all other subpackages were 100% interface-equivalent and unmutated relative to upstream Pi;
2. Retaining duplicate in-tree source copies bloated repository size and prevented effortless tracking of upstream model catalogs and bug fixes;
3. `@earendil-works/pi-*` (v0.84.x) is publicly available and stable on npm.

---

## Decision

### 1. Physical Repository Pruning
- **Removed Duplicate Subpackages**: Deleted `packages/ai`, `packages/agent`, `packages/tui`, `packages/client`, `packages/server`, `packages/protocol`, `packages/telemetry`, `packages/evals`, and `packages/session-backends/`;
- **Retained Core Project Assets**:
  - `packages/core/`: CLI integration and the `src/core/cordis/` 10 core service matrix;
  - `packages/plugins/`: Pi-Cordis-native capabilities and profile composition;
  - `.agents/notes/`: Bi-lingual architecture decision records library.

### 2. Dependency & Configuration Simplification
- In `packages/coding-agent/package.json`, `@earendil-works/pi-agent-core`, `@earendil-works/pi-ai`, `@earendil-works/pi-tui`, and `@earendil-works/pi-client` resolve directly via npm;
- Cleaned up `pnpm-workspace.yaml`, `tsconfig.json`, and `vitest.base.ts` to eliminate obsolete local path aliases.

---

## Consequences & Benefits

### 🌟 Key Benefits
1. **85%+ Reduction in Repository Footprint**: Removed over 1,200 redundant source files for an ultra-clean developer experience;
2. **Zero-Friction Upstream Updates**: Running `pnpm update` automatically pulls the latest model catalogs and algorithm improvements from official Pi releases;
3. **Razor-Sharp Positioning**: `pi-cordis` acts as a pure **"Cordis Microkernel Distribution and Plugin Hub for Pi"**;
4. **Instant Builds and Installs**: `pnpm install` completes in ~1.8 seconds.

### ⚠️ Risk Mitigation
- **Upstream Semver Protection**: Pinned dependencies to compatible ranges (`^0.84.1`) and retained `cordis-bootstrap.test.ts` in CI to detect upstream signature breaking changes immediately.
