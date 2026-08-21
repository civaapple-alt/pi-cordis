# @pi-cordis/plugin-output-truncator

[English](README.md) | 中文

原生 Cordis 输出截断、双端保留与 Spill 溢出转存插件。监听 `pi/tool-result` 事件流，保留输出的前 30 行（Head）与后 20 行（Tail），自动将超长完整输出持久化到 `.picds/spill/<id>.txt` 中，并附带分页读取指令。

## 配置选项

- `maxBytes` (number, 默认 `51200` / 50KB)：输出最大字节数上限。
- `maxLines` (number, 默认 `2000`)：输出最大行数上限。
- `headLines` (number, 默认 `30`)：截断时保留的前部头部行数。
- `tailLines` (number, 默认 `20`)：截断时保留的尾部结尾行数。
- `enableSpill` (boolean, 默认 `true`)：是否自动将全量输出落盘转存至 `.picds/spill/`。
- `spillDir`（string，可选）：覆盖 Spill 目录。

## Spill 溢出转存与双端保留机制

当工具输出超出阈值时：
1. **双端保留 (Head/Tail)**：保留配置的头尾片段；若超长单行会突破 `maxBytes`，则优先执行 UTF-8 安全的字节预算；
2. **Spill 文件持久化**：将完整原始输出写入 `.picds/spill/spill_<timestamp>_<id>.txt`；
3. **结构化分页指引**：在截断位置追加明确提示：
   ```text
   [... Truncated: 2950 lines (150240 bytes) omitted by @pi-cordis/plugin-output-truncator ...]
   [... Full output persisted to ".picds/spill/spill_1787131920_a1b2c3.txt". Use read(path=".picds/spill/spill_1787131920_a1b2c3.txt", offset=..., limit=...) to inspect sections ...]
   ```

## 模型体验
- **可恢复溢出**：Spill 写入成功时可分页读取完整输出；若持久化失败，仍会保护上下文，且不会声称存在 Spill 路径；
- **上下文防爆**：彻底避免大型日志或打包文件撑爆上下文窗口或导致终端卡死。
