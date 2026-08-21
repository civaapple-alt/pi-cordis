# @pi-cordis/plugin-rules-injector

[English](README.md) | 中文

把补充性的项目规则格式加入 Cordis 提示词变换管线。默认读取根目录 `.clauderules`、`.cursorrules`，以及 `.claude/rules/`、`.agents/rules/` 下的 Markdown 文件。

Pi 已经发现 `AGENTS.override.md`、`AGENTS.md` 与 `CLAUDE.md`，因此本插件默认不重复注入。只有在明确关闭上游 Pi 上下文文件加载时，才应设置 `includePiContextFiles: true` 或提供显式 `ruleFiles`。

目录遍历顺序确定，文件不可读时明确失败，`maxTotalBytes` 默认 128 KiB。SHA-256 内容哈希用于在内容未变时复用已格式化文本块；它不会省去检测变更所需的文件读取，也不保证 Provider 侧 KV Cache 行为。
