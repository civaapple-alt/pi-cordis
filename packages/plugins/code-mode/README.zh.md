# @pi-cordis/plugin-code-mode

[English](README.md) | 中文

Pi-Cordis 编程化工具调用（PTC / Code Mode）插件。它可将多轮串行 JSON Function Calling 转换为面向生成式 TypeScript SDK 的单一 `run_code` 执行入口；默认在独立 Node.js Worker 中执行，并可在超时时终止该 Worker。

## 工具

### `run_code`

接受参数：
- `code` (string, 必填)：执行的 JavaScript/TypeScript 代码。可在代码中使用 `console.log` 以及绑定到 `pi.*` 命名空间的全部工具（例如 `await pi.read(...)`、`await pi.fs.read(...)` 或 `await pi.bash.run(...)`）。

返回值：
- `success` (boolean)：执行状态。
- `output` (string)：捕获的控制台日志与格式化输出。
- `error` (string, 可选)：执行失败时的错误信息或异常堆栈。
- `executionTimeMs` (number)：执行耗时（毫秒）。

## 核心架构特性

### 1. 动态强类型 `.d.ts` 生成器 (`dts-generator.ts`)
- 自动将当前所有注册工具的 JSON Schema 实时编译为结构化的 `declare namespace pi { ... }` 强类型定义；
- 通过 `pi/prompt-transform` 钩子注入系统提示词，使代码大模型依据精准的 TypeScript 接口进行推导与调用；
- 提供语义化模块命名空间：
  - `pi.fs`：`read`, `write`, `edit`, `patch`, `list`, `find`, `grep`
  - `pi.bash`：`exec`, `run`
  - 扁平方法：`pi.<toolName>` 支持全部已挂载工具。

### 2. 工具表现层遮蔽（Tool Presentation Masking）
- 自动从大模型可见的顶层工具列表中过滤掉底层零散工具（`read`、`write`、`edit`、`bash`、`grep`、`find`、`ls`）；
- 仅向模型暴露 `run_code` 与白名单中的顶层交互工具，减少重复的工具 Schema 表面积；
- Worker 内通过 `pi.*` SDK 保留对当前活跃工具的程序化调用能力。
- `exit_plan_mode` 以稳定 Schema 保持顶层可见；嵌套 `pi.*` 调用保留 Pi 执行上下文，因此活跃 Plan 会话可同时拦截 `run_code` 内部与顶层的变更操作。

### 3. 独立工作线程执行引擎 (`worker-runner.ts`)
- 每次执行启动一个全新的 Node.js `worker_threads.Worker`（独立的 V8 Isolate 与操作系统线程）；
- **超时保护**：脚本执行超过 `timeoutMs` 时，主线程调用 `worker.terminate()`；
- **环境降级**：Worker 创建失败时回退到 `node:vm` 执行上下文；
- **安全边界**：Worker 与 `node:vm` 都不是权限沙箱。生成代码拥有 Picds 用户的本机权限，应按 Shell 工具执行代码看待；经 `pi.*` 发起的调用仍经过 Cordis 工具与 Safety Gate 管线。

### 4. TUI 专属可视化卡片 (`renderer.ts`)
- `renderCall`：显示代码行数统计标签与前 4 行语法高亮预览（`⚡ run_code (N lines)`）；
- `renderResult`：
  - **折叠状态**：输出紧凑单行执行摘要与耗时（`✓ Executed in 12ms → summary`）；
  - **展开状态**：输出完整的控制台日志、结构化输出与错误排版。

## 配置示例

```yaml
- name: '@pi-cordis/plugin-code-mode'
  config:
    timeoutMs: 30000              # 执行超时时间（毫秒，默认 30000）
    useWorkerThreads: true        # 启用 worker_threads 独立线程隔离（默认 true）
    maskUnderlyingTools: true     # 对模型侧隐藏底层工具 Schema（默认 true）
    injectFullDts: true           # 将完整 .d.ts 声明注入系统提示词（默认 true）
    allowedTopLevelTools:         # 允许保留在顶层工具列表中的工具白名单
      - run_code
      - ask_question
      - exit_plan_mode
      - session_handoff
```

## 模型体验

### 工具 Schema 与表现层
- **Token 影响**：用极简的 `run_code` 单一工具定义替代几十个冗长的工具 Schema，配合提示词中的强类型定义；
- **KV Cache 影响**：前缀稳定；SDK 类型定义在会话生命周期内保持稳定，不引起缓存抖动。

### 执行与上下文防爆
- 中间大数据（例如扫描遍历 50 个文件或数组过滤）完全在 Worker 内存中就地处理；
- 仅将捕获的控制台输出和最终结果返回对话上下文；实际节省取决于具体工作负载。

## 已知限制与暂缓事项
- Worker 内不保留跨次执行的全局变量持久状态（每次执行均为独立纯净 Isolate）；
- 跨主机或分布式 Worker 分发暂缓至未来演进。
