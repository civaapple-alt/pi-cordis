# @pi-cordis/plugin-safety-gate

[English](README.md) | 中文

原生 Cordis 安全网关与命令/文件防误触插件。在工具执行前同步拦截 `pi/tool-call` 事件，严格执行只读模式、敏感文件保护边界并阻断高危破坏性 Shell 命令。

## 配置选项

- `readOnly` (boolean, 默认 `false`)：禁止任何 `write` 或 `edit` 写操作工具调用。
- `protectedPaths` (string[], 可选)：受保护禁止写操作的文件或路径（默认：`[".env", ".git/", "id_rsa", "id_ed25519", "node_modules/", ".ssh/"]`）。
- `dangerousCommands` (string[], 可选)：高危破坏性命令模式（默认：`["rm -rf /", "rm -rf /*", "mkfs", "dd if=", ":(){ :|:& };:", "chmod -R 777 /"]`）。

## 事件拦截
在 `pi/tool-call` 阶段进行同步校验，发现违规时立即抛出清晰的错误阻断操作，避免对工作区及操作系统产生不可逆损害。

## 模型体验
- **前置防护栏**：当模型误尝试修改 `.env` 密钥文件或执行全盘删除时，在执行前立即拦截并告知安全策略。
- **开箱标配**：作为核心基础防护，默认启用在 `default`、`safe` 和 `strict` 预设中。
