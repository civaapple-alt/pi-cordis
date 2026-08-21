# Pi-Cordis 体验优先的内置插件契约

[English](2026-08-21-pi-cordis-experience-first-built-in-plugin-contracts.md) | 中文

Status: proposed

## 提案

Pi-Cordis 在认定内置插件、工具 Schema 或单元测试“完成”之前，必须先从用户或开发者可观察的真实旅程进行评估。每条旅程都要明确：用户能看到的完整产物、允许发生的状态迁移、取消行为、失败语义、生命周期所有者，以及上线所需证据。

该提案延续 Pi 的极简哲学，不增加第二套编排层：Pi 继续拥有 TUI 与 Agent Loop，Cordis 只拥有可逆策略和组合。插件必须通过这条窄接缝，让重要结果可见、精确且可恢复。

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

## 审计发现与预期变更

### 上线阻断项

- Plan 策略将覆盖 `git_checkpoint restore` 等内置修改能力，而不只匹配固定的上游工具名。
- Todo 状态将归属 Session，并脱离可销毁的 Profile 状态；更新先验证候选值再提交，保证失败原子化。
- Cordis Tool 使用带显式 `isError` 的统一结果契约；TUI 不再把错误或取消渲染成成功。
- `ask_question` 在取消时立即终止批次，并为选项产物提供可读的 Preview 路径。
- Safety Gate 区分 `/dev/null` 输出抑制与块设备写入。
- Profile 切换展示当前 Profile 与能力差异；旧 Fiber 销毁失败时不得报告成功。
- Code Mode 响应取消，并披露实际使用 Worker 隔离还是降级的 VM 后端。

### 后续体验项

- `/btw` 答案与 Session Handoff Markdown 提供完整、可滚动的评审面，不再只依赖临时通知或一句摘要。
- `git_smart_commit` 返回供评审的数据，不再生成可能被直接复制执行的不安全 Shell 指令。
- Rules 注入、Spill 持久化和 HMR 向开发者暴露生效状态与降级/错误条件，同时不污染默认路径。

## 验收标准

- Default 与 PTC 的回归测试覆盖 Session 隔离、取消、失败原子性、完整产物可见性、Profile 迁移和 Plan 修改拦截。
- 每个内置修改动作都声明或执行自身的副作用策略。
- 工具失败以 `isError: true` 进入 Pi，且 Renderer 不显示成功标记。
- Profile/HMR 迁移必须完整成功，或报告未完成的精确清理；不得吞掉生命周期失败后仍宣称成功。
- `pnpm release:check` 通过，并对 Slash 命令、交互提问、Plan 审阅与 Profile 切换执行真实 TUI 冒烟。

## 风险

- 通用副作用分类可能比当前插件面更重。只引入现有内置能力所需的最小元数据，并继续复用现有工具管线。
- Profile 切换时保留 Session 状态不能演变成第二套 Session Kernel；应复用 `ExtensionService` 转发的 Pi Session ID 与根作用域 Cordis 所有权。
- 全文展示可能压垮终端；应优先使用 Pi 可滚动 Editor 或可展开 Tool Result，并保留精简折叠摘要。

