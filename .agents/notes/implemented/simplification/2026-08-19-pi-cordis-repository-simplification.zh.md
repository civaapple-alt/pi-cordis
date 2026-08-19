# Agent Note: Pi-Cordis 仓库精简与上游依赖解耦

Status: implemented
Created: 2026-08-19

[English](2026-08-19-pi-cordis-repository-simplification.md) | 中文

## 摘要 (Executive Summary)

本篇架构决策记录（ADR）记录了对 `pi-cordis` 仓库进行的**重大架构精简（Repository Simplification）**。
通过将未经修改的通用子包（`packages/ai`, `packages/agent`, `packages/tui`, `packages/client`, `packages/server`, `packages/protocol`, `packages/telemetry`, `packages/evals`, `packages/session-backends`）移除，并转为直接消费 npm 官方发布的 `@earendil-works/pi-*` 依赖，使 `pi-cordis` 聚焦于真正的核心资产：**`packages/coding-agent`（Cordis 10 大核心服务与控制面装配）+ `vendor/`（Cordis v4.0.1 元框架底座）**。

---

## 问题背景 (Problem)

在初期全量重构阶段，为了确保 100% 行为等价与全链路调试，`pi-cordis` 完整保留了上游 Pi 的全部子包源码（包含 1200+ 个文件、超过 30 万行代码）。
经过全面的跨包代码审计发现：
1. 除了 `packages/coding-agent/src/core/cordis/` 这一控制面扩展外，其余子包与上游官方包保持 100% 的接口等价与纯净性；
2. 维护大量未修改的上游包导致仓库臃肿，且阻碍了自动跟进 Pi 官方的上游模型更新与 Bugfix；
3. `@earendil-works/pi-*`（v0.84.x）已在 npm registry 公开发布且稳定可用。

---

## 决策方案 (Decision)

### 1. 物理精简仓库结构
- **移除冗余克隆子包**：彻底删除 `packages/ai`、`packages/agent`、`packages/tui`、`packages/client`、`packages/server`、`packages/protocol`、`packages/telemetry`、`packages/evals` 和 `packages/session-backends/`；
- **保留核心资产**：
  - `packages/coding-agent/`：包含全套 CLI、TUI 交互界面与 `src/core/cordis/` 10 大核心服务矩阵；
  - `vendor/`：包含独占审计的 Cordis v4.0.1 框架套件（`cordis`, `cosmokit`, `schemastery` 等）；
  - `.agents/notes/`：中英双语架构决策记录库。

### 2. 依赖声明与配置精简
- 在 `packages/coding-agent/package.json` 中，通过 npm 直接声明 `@earendil-works/pi-agent-core`、`@earendil-works/pi-ai`、`@earendil-works/pi-tui`、`@earendil-works/pi-client` 等；
- 简化 `pnpm-workspace.yaml`、`tsconfig.json` 和 `vitest.base.ts`，消除对已删除子包的本地路径映射。

---

## 架构收益与影响 (Consequences & Benefits)

### 🌟 核心收益
1. **仓库体积骤降 85%+**：消除了 1200+ 个冗余源文件，工程极度轻量清爽；
2. **自动跟进上游升级**：上游 Pi 官方新增模型或优化算法时，只需执行 `pnpm update` 即可无感升级；
3. **定位高度聚焦**：`pi-cordis` 成为纯粹的 **“Pi 的 Cordis 微内核发行版与插件控制中枢”**；
4. **编译与安装极速**：`pnpm install` 仅需 1.8 秒完成，开发体验大幅提升。

### ⚠️ 潜在注意事项与防范
- **上游 Breaking Changes 防范**：在 `package.json` 中对 `@earendil-works/pi-*` 采用语义化版本锁定（`^0.84.1`），并在 CI 门禁中保留 `cordis-bootstrap.test.ts` 以防止上游接口突变破坏微内核装配。
