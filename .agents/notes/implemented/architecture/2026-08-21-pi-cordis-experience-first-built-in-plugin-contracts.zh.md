# Pi-Cordis 体验优先的内置插件契约

[English](2026-08-21-pi-cordis-experience-first-built-in-plugin-contracts.md) | 中文

Status: implemented

## 决策

Pi-Cordis 在认定内置插件、工具 Schema 或单元测试“完成”之前，先从用户或开发者可观察的真实旅程进行评估。每条旅程都明确：用户能看到的完整产物、允许发生的状态迁移、取消行为、失败语义、生命周期所有者，以及上线所需证据。

该决策延续 Pi 的极简哲学，不增加第二套编排层：Pi 继续拥有 TUI 与 Agent Loop，Cordis 只拥有可逆策略和组合。插件通过这条窄接缝，让重要结果可见、精确且可恢复。

## 体验契约

每个交互命令或工具都必须回答：

1. 在这个场景中，用户实际想完成什么？
2. 用户必须能够检查哪一份完整产物或状态变化？
3. 取消、缺少 UI、超时或依赖失败时会发生什么？
4. 失败是否原子化，还是会留下部分修改？
5. 状态属于哪个 Session 与 Fiber，切换 Profile 后什么应当保留？
6. 操作可能产生哪些副作用，哪一道策略门禁能够看到它们？
7. 哪个回归测试证明了真实用户旅程，而不仅是一个辅助函数？

成功样式只用于真实成功。取消、UI 不可用、动作被拒绝以及 `{ success: false }` 必须保持机器可识别，并在界面上与成功明确区分。计划、回答、Handoff、Diff 与建议命令等产物，在批准或复用前必须提供完整评审入口。

## 已落地行为

### 上线阻断项

- Plan 策略覆盖语义化的 `workspace`、`external` 副作用，包括 `git_checkpoint restore`，不再只匹配上游工具名；Restore 自身也要求交互确认。
- Todo 状态归属 Session 并脱离可销毁的 Profile 状态；更新先验证候选副本再提交，保证失败原子化。
- Cordis Tool 把 `isError`、`success: false` 与非空 `error` 统一转换为 Pi 失败；Renderer 明确区分错误、取消与成功。
- `ask_question` 在取消时立即终止批次，并为选项产物提供全文 Preview、确认与返回路径。
- Safety Gate 区分 `/dev/null` 输出抑制与真实块设备写入。
- Profile 切换展示当前 Profile 与能力差异；Profile/HMR 清理失败会明确报告而不再吞掉。
- Code Mode 在取消时终止 Worker；Worker 启动失败明确返回，只有显式配置时才使用 VM 并标记降级。

### 评审面与开发者可观察性

- Pi 支持时，`/btw` 答案使用完整可滚动评审面；Session Handoff 展开态包含完整 Markdown 产物。
- `git_smart_commit` 返回供受保护工具路径使用的结构化 Executable/Arguments，用户可见 Instruction 保持为不可执行说明。
- `/rules` 展示实际注入文件、字节数、哈希与完整规则块；Spill 只有在持久化成功后才展示可恢复路径。
- `manage_tools` 明确拒绝缺失目标与未知 Action；没有交互 UI 时不发送等待用户回答通知。

## 验证

- Core 与插件回归套件覆盖 Session 隔离、取消、失败原子性、完整产物可见性、Profile 迁移、HMR 清理失败、Plan 变更拦截、Headless/取消 Git Restore 与 Worker 后端披露。
- 工具桥测试证明 Cordis 失败以 `isError: true` 进入 Pi。
- TypeScript Strict 检查与仓库 Release Gate 核验可发布依赖图和包产物。
- Pi 兼容 UI 集成测试覆盖完整 Plan/Editor 审阅与选项 Preview；真实 Pi Bridge 的聚焦 TUI 冒烟覆盖启动、`/plan`、`/rules` 及 Profile 选择/切换差异。

## 影响与取舍

- 副作用分类刻意保持三个值并复用现有工具管线；它是策略元数据，不是第二套权限系统。
- Session 连续性复用 `ExtensionService` 转发的 Pi Session ID 与根作用域 Cordis Store；Pi 仍是唯一 Session Kernel。
- 完整产物优先使用 Pi 可滚动 Editor 或展开 Tool Result，折叠摘要仍保持精简。
- VM 保留为显式兼容选项，但其无法终止同步 JavaScript 的限制会明确呈现，绝不伪装成与 Worker 等价的隔离。
