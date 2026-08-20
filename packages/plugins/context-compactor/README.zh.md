# @pi-cordis/plugin-context-compactor

[English](README.md) | 中文

原生 Cordis 长会话上下文压缩与决策沉淀插件。提供 `trigger_compact` 工具，结构化捕获 4 维核心信息（修改文件、关键决策、已解决问题、遗留阻塞），对外广播 `pi/compact` 事件以释放上下文空间并永久留存关键架构事实。

## 工具

### `trigger_compact`

接受参数：
- `reason` (string, 可选)：触发压缩的背景原因或里程碑描述。
- `modifiedFiles` (string[], 可选)：需重点保留的已修改文件路径列表。
- `keyDecisions` (string[], 可选)：需要铭记的架构设计与技术选型决策。
- `resolvedIssues` (string[], 可选)：已定位并解决的缺陷列表。
- `pendingBlockers` (string[], 可选)：尚未解决的阻塞项或开放问题。

返回值：
- `success` (boolean)：压缩触发状态。
- `message` (string)：状态说明。
- `tokenThreshold` (number)：配置的压缩阈值。
- `compaction` (对象)：4 维结构化摘要载荷。

## 事件广播
触发 `pi/compact` 事件并携带载荷：
```ts
{
  reason: string;
  timestamp: number;
  modifiedFiles: string[];
  keyDecisions: string[];
  resolvedIssues: string[];
  pendingBlockers: string[];
}
```

## 模型体验
- **Token 额度释放**：将漫长的调试过程精炼为结构化决策备忘；
- **长链条连续性**：在大型重构任务中无缝衔接前后文事实。
