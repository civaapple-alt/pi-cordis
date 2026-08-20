# Agent Note: Pi-Cordis 编程化工具调用（PTC / Code Mode）架构设计与演进提案

Status: proposed
Created: 2026-08-20

[English](2026-08-20-pi-cordis-ptc-code-mode-architecture-proposal.md) | 中文

## 摘要 (Executive Summary)

本篇架构提案（ADR Proposal）深入分析了 **DeepSeek Harness (DSH) 中备受赞誉的 PTC 模式（Programmatic Tool Calling / 编程化工具调用，又称 Code Mode）** 的核心设计哲学与技术实现，并提出了在 **Pi-Cordis 微内核体系中落地 `@pi-cordis/plugin-code-mode` 与 `presets/ptc/` 预设的架构方案**。

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
- **核心优势**：在本地 Node.js Worker 隔离环境中毫秒级并发执行完毕，模型在 **1 轮（Single Round-Trip）** 内直接拿到最终提炼结论！

---

## 二、PTC 模式的 4 大核心架构收益

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PTC 模式的核心架构收益                          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. 轮次坍缩 (Round-Trip Collapse) : 5~10 轮串行往返 ──> 坍缩为 1 轮    │
│ 2. 上下文防爆 (Context Preservation) : 中间数据内存过滤，不回传 LLM   │
│ 3. 编程原语赋能 (Control Flow Power) : 支持 for / while / Promise.all   │
│ 4. 类型驱动推理 (Type-Driven Reasoning) : d.ts 比 JSON Schema 更懂代码 │
└────────────────────────────────────────────────────────────────────────┘
```

1. **轮次坍缩（延迟降低 80%+）**：消除了多轮 LLM 串行等待开销；
2. **上下文防爆（Token 节省 90%+）**：中间大数据留存在 Worker 内存中，只有 `console.log` 的提炼结果返回给大模型；
3. **编程原语赋能**：模型可直接使用 `if-else` 分支、`try-catch` 容错重试与 `Promise.all` 高并发；
4. **类型驱动推理**：代码大模型在海量开源代码库上预训练，对 `.d.ts` 强类型定义的理解能力远超冷冰冰的 JSON Schema。

---

## 三、DSH 的微内核实现参考

在 DSH（DeepSeek Harness）中，PTC 模式的装配展示了 Cordis 表现层解耦的极致优雅：

```yaml
# apps/cli/config/agent-presets/code/agent.cordis.yml
# 1. 挂载所有标准底层工具 (文件系统, Shell, Web 等)
- id: tool-fs
  name: '@deepseek-ai/dsh-tool-fs'
- id: tool-bash
  name: '@deepseek-ai/dsh-tool-bash'
- id: tool-web
  name: '@deepseek-ai/dsh-tool-web'

# 2. 仅通过一行插件配置，将所有工具的表现形式切换为 Code Mode！
- id: tool-presentation
  name: '@deepseek-ai/dsh-agent-tool-presentation'
  config:
    mode: code
```

- **底层驱动零修改**：`dsh-fs`、`dsh-bash` 等底层驱动无需做任何修改；
- **表现层动态合成**：`dsh-agent-tool-presentation` 自动扫描可见工具并动态生成 SDK 类型定义，仅向模型暴露 `run_code`。

---

## 四、Pi-Cordis 落地架构方案设计

在 Pi-Cordis 中，我们可以基于现有的 **10 大核心 Services** 与 **`presets/` 独立目录体系**，通过以下 3 步实现原生 PTC 模式：

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. 新增插件: packages/plugins/code-mode                     │
│    • 声明 inject = ['tools']                                │
│    • 扫描 ctx.tools.getAllToolDefinitions()                 │
│    • 动态生成 virtual: @pi/agent-sdk 的 .d.ts 声明与运行时   │
│    • 注册 run_code / execute_script 工具供 LLM 调用         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. 新增预设: presets/ptc/ (preset.yml + cordis.yml)         │
│    • 包含 rules-injector, todo-tracker, code-mode 插件      │
│    • 支持在 CLI 中一键指定: pnpm pi --profile ptc           │
│    • 支持在 TUI 中交互切换: /profile ptc                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. 轻量沙箱执行引擎: Worker / isolated-vm                   │
│    • 接收模型编写的 TypeScript 脚本                         │
│    • 注入 SDK 代理对象并执行                                │
│    • 捕获 stdout 与结果，在 pi-tui 中以代码折叠卡片渲染      │
└─────────────────────────────────────────────────────────────┘
```

---

## 五、预设目录结构设计 (`presets/ptc/`)

```yaml
# presets/ptc/preset.yml
name: 编程化工具调用模式 (PTC / Code Mode)
description: 具备标准模式的全部工具能力，并通过 TypeScript SDK 呈现，让模型用一段程序组合多步操作
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

---

## 六、演进计划与预期收益

1. **第一阶段（MVP）**：实现基于 Node.js `node:vm` 或 Worker 线程的轻量 TypeScript 执行器，将内置 7 大工具（`read`, `write`, `edit`, `bash` 等）映射为 `pi.fs.*` 与 `pi.bash.*`；
2. **第二阶段（TUI 渲染增强）**：在 `pi-tui` 中为 `run_code` 提供专属的富文本渲染器，实时展示脚本执行进度与控制台输出；
3. **第三阶段（完整 Preset 推出）**：发布 `presets/ptc/` 预设，并支持通过 `/profile ptc` 在终端中随时体验！
