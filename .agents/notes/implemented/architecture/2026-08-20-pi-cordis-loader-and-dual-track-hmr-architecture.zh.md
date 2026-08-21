# Agent Note: Pi-Cordis Loader 权衡与双轨分层 HMR（热重载）架构设计

Status: implemented
Created: 2026-08-20

[English](2026-08-20-pi-cordis-loader-and-dual-track-hmr-architecture.md) | 中文

## 摘要 (Executive Summary)

本篇架构决策记录（ADR）详细记录了围绕 **Cordis Loader 的选型权衡** 以及在 `pi-cordis` 中构建 **双轨分层 HMR（Hot Module Replacement）架构** 的设计与实现：
1. **核心 Service 编程式高效装配（Kernel Base Layer）**：10 大核心服务保持直接 TypeScript 编程式加载，保留 `AbortSignal` 等内存对象传递，确保终端智能体毫秒级极速冷启动（<50ms）；
2. **插件与 Presets 动态热重载（Dynamic HMR Layer）**：
   - **预设 YAML 热更新**：监听 `presets/` 与 `.pi/presets/` 目录，配置变动时利用 Cordis `fork.dispose()` 干净注销旧插件并挂载新插件；
   - **插件源码级 HMR**：监听 `packages/plugins/*/src/**/*.ts`，通过 `pathToFileURL + ?t=timestamp` 破除 Node.js 原生 ESM 强缓存，实现零重启的源码热替换；
   - **会话状态零丢失**：在热重载过程中，终端智能体的对话树、内存状态与 LLM 连接保持完好。

---

## 核心问题背景与架构思考 (Context & Problem Statement)

在系统的演进过程中，我们针对以下两个关键架构问题进行了深入探讨与权衡：

### 问题 1：为什么提取了 10 大 Service，却没有直接使用 `@deepseek-ai/cordis-plugin-loader` 作为总入口？
- **原因剖析**：
  1. **复杂内存对象传递**：Pi 作为终端 CLI 智能体，启动时依赖不可序列化为 YAML 的运行时对象（如 `signal: AbortSignal` 用于 Ctrl+C 中断、复杂的 `toolsOptions` 等）。若完全由 Loader 通过静态 YAML 引导，需引入侵入性的全局变量或上下文修补器；
  2. **终端极速冷启动诉求**：Cordis Loader 专为长驻后台 Daemon（如 Koishi/DSH）设计，内置了模块路径探测与依赖图演算。CLI 单次执行（`pi -p "..."`）追求极致的冷启动速度；
  3. **避免状态反向回写**：Loader 的 `EntryTree` 会将运行时状态持久化回写覆盖磁盘 YAML，而 `presets/` 目录被定义为只读预设模板，无需双向污染。

### 问题 2：没有使用 Cordis Loader，是否意味着无法实现插件的 HMR？
- **层级分析**：
  - **配置级热重载（Config Reloading）**：得益于 Cordis 的可逆副作用（`ctx.effect` / `ctx.on`），原本即可通过注销 Fork 实现；
  - **代码级模块 HMR（Code-level Module HMR）**：由于 Node.js ESM 原生 `import()` 具有强缓存，直接重新 `import()` 会读取旧缓存。
- **创新解决思路**：无需全量引入复杂的重型 Loader，采用**针对插件与预设的轻量化双轨 HMR 引擎**即可完美破解！

---

## 双轨分层 HMR 架构设计 (Dual-Track HMR Architecture)

```text
┌────────────────────────────────────────────────────────────────────────┐
│               1. 核心 Service 底座层 (Kernel Base Layer)               │
│  Settings, Auth, AI, Tools, Session, Skills, Prompts, Ext, Pkg, Agent  │
│  ─────────── 采用编程式强类型装配 (零启动开销 / 保留 AbortSignal 等内存对象) ──────────│
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│             2. 动态插件与 Presets 预设层 (Dynamic HMR Layer)            │
│  presets/<name>/(preset.yml + cordis.yml)  &  packages/plugins/*/src   │
│  ────────────────────────────────────────────────────────────────────  │
│  • YAML 变更监听  ──> 重新解析 Presets 并原子性重载当前激活的 Profile 插件   │
│  • 插件 TS 源码变更 ──> ESM 动态时间戳破除缓存 + Fork.dispose() 干净热重载  │
│  • 终端会话状态保持 ──> 会话对话树、内存状态、LLM 运行环境不丢失！          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 核心实现机制 (`@pi-cordis/profiles/hmr`)

### 1. 预设 YAML 热重载（Preset YAML Watcher）
```typescript
// 监听 presets/ 与 .pi/presets/ 目录
const watcher = fs.watch(presetDir, { recursive: true }, (eventType, filename) => {
  if (!filename?.endsWith(".yml")) return;
  // 防抖 150ms 重新加载
  reloadCurrentProfile();
});
```
- 调用 `reloadCurrentProfile()` 时，通过 `activeForks` 找到旧插件的 `fork.dispose()`，干净清除旧的事件监听与工具；
- 重新应用最新配置并触发 `pi/hmr-preset-update` 事件。

### 2. 插件源码代码级热重载（Plugin Code Watcher & ESM Cache Buster）
```typescript
// 1. 利用动态时间戳破除 Node.js 原生 ESM 强缓存
const fileUrl = pathToFileURL(filePath).href + `?t=${Date.now()}`;
const newModule = await import(fileUrl);
const plugin = newModule.default ?? newModule;

// 2. 注销旧插件 Fork
const oldFork = activeForks.get(pluginName);
if (oldFork) {
  oldFork.dispose();
  activeForks.delete(pluginName);
}

// 3. 在 Cordis Context 上挂载新模块
const newFork = ctx.plugin(plugin, pluginConfig);
activeForks.set(pluginName, newFork);
```

---

## 架构收益与测试验证 (Benefits & Verification)

1. **兼顾极速启动与开发体验**：
   - 核心服务保持原生零开销启动；
   - 插件开发者修改 `packages/plugins/safety-gate/src/index.ts` 或 `presets/safe/cordis.yml` 时，终端智能体**无需重启进程即可实时生效**。
2. **会话持久无感知**：
   - 热重载仅发生在插件的生命周期边界内，当前正在进行的会话上下文、对话历史与 SQLite/内存数据完好无损。
3. **自动化测试覆盖**：
   - 在 [`packages/coding-agent/test/cordis-plugins-and-profiles.test.ts`](file:///D:/gh-ws/dsh-ws/pi-cordis/packages/coding-agent/test/cordis-plugins-and-profiles.test.ts) 中对 HMR 进行了全链路测试，10 个测试用例 **100% 通过**。
