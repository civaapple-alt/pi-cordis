# @pi-cordis/plugin-safety-gate

[English](README.md) | 中文

原生 Cordis 多层级安全网关与命令/文件防误触插件。在工具执行前同步拦截 `pi/tool-call` 事件，严格执行只读模式、敏感密钥文件保护边界并基于正则规则引擎阻断高危破坏性 Shell 命令。

## 配置选项

- `readOnly` (boolean, 默认 `false`)：禁止任何 `write`、`edit`、`patch`、`apply_patch` 写操作工具调用。
- `protectedPaths` (string[], 可选)：受保护禁止写操作的文件或路径（默认：`[".env", ".env.", ".git/", "id_rsa", "id_ed25519", ".pem", ".key", "node_modules/", ".ssh/"]`）。
- `dangerousCommands` (string[], 可选)：用户自定义追加的高危破坏性命令模式。
- `allowedCommands` (string[], 可选)：白名单放行命令列表。

## 多层级安全防护引擎

1. **高危命令正则分析**：
   - 根目录/用户目录误删：`rm -rf /`、`rm -rf /*`、`rm -rf ~`、`rm -rf $HOME`、`rm -rf ..`；
   - 磁盘格式化与设备覆盖：`mkfs`、`dd if=`、`> /dev/sda`；
   - Fork 炸弹：`:(){ :|:& };:`；
   - 越权权限开放：`chmod -R 777 /`；
   - 远程脚本直接执行：`curl ... | bash`；
   - 敏感凭证打印：`cat .env`、`cat ~/.ssh/*`。
2. **敏感密钥与文件保护**：阻止对 `.env`、`.git/`、`.ssh/`、`*.pem`、`id_rsa` 的写入与覆盖。
3. **只读模式强拦截**：在 Plan 或审查等只读阶段自动阻断破坏性修改。

## 模型体验
- **前置防护栏**：在潜在危险命令执行前立即拦截并返回友好的策略说明。
- **开箱标配**：作为核心基础防护，默认启用在 `default`、`safe` 和 `strict` 预设中。
