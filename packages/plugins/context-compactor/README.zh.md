# @pi-cordis/plugin-context-compactor

[English](README.md) | 中文

原生 Cordis 长会话分段压缩与摘要生成插件。提供 `trigger_compact` 工具并对外广播 `pi/compact` 事件，在保留关键决策的同时回收上下文容量。

## 工具

### `trigger_compact`

接受参数：
- `reason` (string, 可选)：触发压缩的背景原因或里程碑描述。

返回值：
- `success` (boolean)：触发状态。
- `message` (string)：压缩完成说明。
- `tokenThreshold` (number)：当前配置的压缩阈值。

## 事件广播
触发时对外广播 `pi/compact` 事件：
```ts
{
  reason: string;
  timestamp: number;
}
```

## 模型体验
- **Token 预算回收**：将长篇历史对话与中间结果提炼为核心决策摘要，降低推理开销。
- **长效开发支持**：为复杂重构与长流程任务提供持续的上下文空间支撑。
