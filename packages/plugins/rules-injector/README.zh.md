# @pi-cordis/plugin-rules-injector

[English](README.md) | 中文

原生 Cordis 项目规则与指令自动注入插件。自动扫描并聚合根目录及子目录下的 `AGENTS.md`、`CLAUDE.md`、`.clauderules`、`.cursorrules`、`.claude/rules/` 与 `.agents/rules/`，利用 SHA-256 哈希缓存保持提示词前缀绝对稳定，最大化大模型 KV-Cache 复用率。

## 配置选项

- `ruleFiles` (string[], 可选)：扫描的根目录规则文件清单（默认：`["AGENTS.md", "CLAUDE.md", ".clauderules", ".cursorrules"]`）。
- `scanClaudeRules` (boolean, 默认 `true`)：是否扫描 `.claude/rules/*.md`。
- `scanAgentRules` (boolean, 默认 `true`)：是否扫描 `.agents/rules/*.md`。

## KV-Cache 友好型哈希缓存

1. **层级化规则聚合**：递归汇总根目录与子目录中的所有项目规范与准则。
2. **SHA-256 增量哈希**：对合并后的规则内容计算哈希；在文件未发生变更的多轮对话中直接复用内存缓存块，确保提示词前缀完全一致，最大化模型推理端的 KV-Cache 命中率。

## 模型体验
- **严格遵循规范**：在每轮会话开始前将当前项目的架构规范与工程约束准确注入上下文；
- **零额外开销**：通过内存缓存极大降低磁盘 I/O 开销与推理时延。
