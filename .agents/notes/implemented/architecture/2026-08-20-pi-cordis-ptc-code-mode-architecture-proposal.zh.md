# Agent Note: Pi-Cordis 编程化工具调用（PTC / Code Mode）架构设计

Status: implemented
Created: 2026-08-20

[English](2026-08-20-pi-cordis-ptc-code-mode-architecture-proposal.md) | 中文

## 摘要 (Executive Summary)

本篇架构决策记录（ADR）深入分析了 **DeepSeek Harness (DSH) 中备受赞誉的 PTC 模式（Programmatic Tool Calling / 编程化工具调用，又称 Code Mode）** 的核心设计哲学与技术实现，并总结了在 **Pi-Cordis 微内核体系中落地 `@pi-cordis/plugin-code-mode` 与 `presets/ptc/` 预设的架构方案**。

PTC 模式通过将零散的 JSON Function Calling 转换为**强类型 TypeScript SDK + 单一 `run_code` 执行器**，能够将原本需要 5~10 轮串行网络往返的复杂长任务**坍缩为 1 轮本地程序化执行**，在将任务执行耗时降低 80%+ 的同时，实现 90%+ 的 Context Window 空间节省。

---

## 一、传统 Native 模式 vs PTC (Code Mode) 模式深度对比

### 1. 传统 Native Tool Calling 的固有瓶颈
当智能体需要完成“扫描 `src/` 下所有 `.ts` 文件并查找包含 `deprecated` 的内容”时：
```text
[第 1 轮] 模型发起 fs_list({ path: "src" }) ──> 等待网络往返 ──> 获取 50 个文件名
[第 2 轮] 模型发起 fs_read({ file: "a.ts" }) ──> 等待网络往返 ──> 获取内容并放入上下文
[第 3 轮] 模型发起 fs_read({ file: "b.ts" }) ──> 等待网络往返 ──> 获取内容并放入上下文
...
[第 50 轮] 全部读完后，模型给出最终结论
```
- **核心痛点**：经历 **50 轮串行网络往返（耗时几分钟）**，且海量中间文件内容直接将 Context Window 塞爆。

---

### 2. PTC (Code Mode) 模式的程序化降维打击
系统不再向模型暴露 50 个零散的 JSON Schema，而是向模型呈现一个 **强类型的 TypeScript SDK**，并仅提供一个 **`run_code`** 执行入口。模型直接编写一段 TypeScript 程序表达完整业务逻辑：

```typescript
// 模型在 1 轮对话中输出的完整 TypeScript 程序
import { fs } from '@pi/agent-sdk';

const files = await fs.list('src');
const tsFiles = files.filter(f => f.endsWith('.ts'));

// 并发读取并就地过滤，海量无用文本直接在内存中丢弃
const results = await Promise.all(
  tsFiles.map(async (file) => {
    const content = await fs.read(`src/${file}`);
    return content.includes('deprecated') ? file : null;
  })
);

console.log(`包含 deprecated 的文件:`, results.filter(Boolean));
```
- **核心优势**：在本地 Node.js `worker_threads` 隔离环境中毫秒级并发执行完毕，模型在 **1 轮（Single Round-Trip）** 内直接拿到最终提炼结论！

---

## 二、PTC 模式的 4 大核心架构收益

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PTC 模式的核心架构收益                          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. 轮次坍缩 (Round-Trip Collapse) : 5~10 轮交互 ──> 坍缩至 1 轮        │
│ 2. 上下文无损保护 (Context Preservation) : 中间数据不进上下文，零 Token 泛洪 │
│ 3. 原生控制流表达力 (Control Flow Power) : 支持 for / while / Promise.all 并发 │
│ 4. 类型驱动逻辑推理 (Type-Driven Reasoning) : .d.ts 类型声明对大模型极度友好 │
└────────────────────────────────────────────────────────────────────────┘
```

1. **轮次极速坍缩（Round-Trip Collapse）**：消除多次等待 LLM 响应的网络开销，任务总体执行耗时降低 80%+；
2. **上下文窗口极致保护（Context Preservation）**：海量中间输出（如读几百个文件）仅在本地 Worker 内存中流转，模型只获取精炼结论，从根源杜绝爆窗；
3. **原生控制流表达力（Control Flow Power）**：大模型可自由编写复杂的条件分支判断、错误捕获与并发请求；
4. **强类型驱动推理（Type-Driven Reasoning）**：现代大模型（如 DeepSeek V3/R1）在大规模代码库上经过深度预训练，对强类型 `.d.ts` 的理解力显著超越冗长的 JSON Schema。

---

## 三、Pi-Cordis 落地实现架构

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. 插件实现: packages/plugins/code-mode                     │
│    • 声明 inject = ['tools', 'prompts']                     │
│    • 遍历 ctx.tools.getAllToolDefinitions()                 │
│    • 基于 jsonSchemaToTypeScript 动态生成 .d.ts 类型定义     │
│    • 工具屏蔽过滤器 (遮蔽底层原子工具，仅暴露 run_code)       │
│    • run_code TUI 多态折叠卡片渲染器                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. 预设组合: presets/ptc/ (preset.yml + cordis.yml)         │
│    • 组合 code-mode, rules-injector, todo-tracker           │
│    • CLI 支持: pnpm pi --profile ptc                        │
│    • TUI 动态切换: /profile ptc                             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. 生产级执行引擎: Node.js worker_threads.Worker            │
│    • 独立工作线程隔离执行                                   │
│    • 注入 SDK 代理对象与 IPC 工具分发                       │
│    • 物理强杀超时保护 (worker.terminate())                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 四、预设配置 (`presets/ptc/`)

```yaml
# presets/ptc/preset.yml
name: Programmatic Tool Calling Mode (PTC / Code Mode)
description: All standard tool capabilities exposed via a TypeScript SDK, allowing the model to compose multi-step workflows in one script
order: 6
```

```yaml
# presets/ptc/cordis.yml
- name: '@pi-cordis/plugin-code-mode'
  config:
    timeoutMs: 30000
    allowImports: true
- name: '@pi-cordis/plugin-rules-injector'
- name: '@pi-cordis/plugin-todo-tracker'
- name: '@pi-cordis/plugin-git-guard'
```
