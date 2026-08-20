# @pi-cordis/plugin-code-mode

[English](README.md) | 中文

Pi-Cordis 编程化工具调用（PTC / Code Mode）插件。注册 `run_code` 工具，在隔离的 JavaScript/TypeScript 虚拟机沙箱中批量执行工具链逻辑，将多次大模型往返调用压缩至单次往返中。

## 工具

### `run_code`

接受参数：
- `code` (string, 必填)：执行的 JavaScript/TypeScript 代码。沙箱内提供 `console.log` 以及绑定到 `pi.*` 命名空间的全部当前可用工具（例如 `await pi.read({ path: "file.ts" })`）。

返回值：
- `success` (boolean)：执行状态。
- `output` (string)：捕获的标准控制台输出。
- `error` (string, 可选)：异常报错信息。
- `executionTimeMs` (number)：执行耗时（毫秒）。

## 沙箱架构
基于 Node.js `vm.createContext` 构建执行沙箱，注入常用 JavaScript 标准全局对象（`Promise`, `Array`, `JSON`, `Math`, `Date`）并代理所有对 `ctx.tools` 的异步调用。

## 模型体验
- **往返轮次压缩**：将 5-10 次模型往返对话与交互大幅缩减为 1 次代码执行。
- **Token 效率提升**：中间循环与搜索数据的输出留在沙箱内存中，避免上下文过度膨胀。
