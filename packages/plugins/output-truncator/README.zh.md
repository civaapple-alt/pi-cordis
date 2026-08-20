# @pi-cordis/plugin-output-truncator

[English](README.md) | 中文

原生 Cordis 输出截断与防爆保护插件。监听 `pi/tool-result` 事件流，自动截断超过安全阈值（默认 >50KB 或 >2000 行）的工具输出，避免终端渲染假死与上下文窗口爆仓。

## 配置选项

- `maxBytes` (number, 默认 `51200` / 50KB)：输出最大字节数上限。
- `maxLines` (number, 默认 `2000`)：输出最大行数上限。

## 行为表现
当工具（例如 `read`、`bash` 或 `grep`）输出超过任意阈值时：
1. 超出 `maxLines` 的行被截断，并追加 `[... Truncated: N lines omitted by @pi-cordis/plugin-output-truncator ...]` 提示。
2. 超过 `maxBytes` 的内容被截断并追加超限说明。
3. 结构化对象保持对象结构不变，自动对其内部的字符串字段执行防爆过滤。

## 模型体验
- **上下文防爆**：防止误读压缩打包文件（minified bundle）或巨型日志文件瞬间撑爆上下文。
- **开箱即用**：作为默认内置核心能力集成于 `default`（Default is Best）预设中。
