# @pi-cordis/plugin-rules-injector

[English](README.md) | 中文

原生 Cordis 项目规则扫描与提示词自动注入插件。自动扫描项目工作区中的规范约定文件（`AGENTS.md`、`CLAUDE.md`、`.clauderules`、`.cursorrules`、`.agents/rules/` 等），并自动注入到系统提示词中。

## 配置选项

- `ruleFiles` (string[], 可选)：扫描的目标规则文件名列表（默认：`["AGENTS.md", "CLAUDE.md", ".clauderules", ".cursorrules"]`）。
- `scanClaudeRules` (boolean, 默认 `true`)：是否递归扫描 `.agents/rules/` 与 `.claude/rules/` 规则目录。

## 行为表现
在每轮对话的 `pi/prompt-transform` 事件中读取当前工作区中的规范文件，并将内容附加在 `## 📋 Project Instructions & Guidelines:` 区域。

## 模型体验
- **即时对齐工程规范**：无需用户手动复制黏贴，自动使模型掌握当前仓库的架构原则、编码准则与测试要求。
- **KV Cache 友好**：规则内容在同一次开发中保持稳定，利于维持大模型的前缀缓存复用。
