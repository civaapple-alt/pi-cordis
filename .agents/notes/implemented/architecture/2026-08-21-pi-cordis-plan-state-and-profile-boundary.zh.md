# Pi-Cordis Plan 状态与 Profile 边界

[English](2026-08-21-pi-cordis-plan-state-and-profile-boundary.md) | 中文

Status: implemented

## 决策

Plan 是每 Session 协作状态，不是 Pi-Cordis Profile。`@pi-cordis/core` 在可切换 Profile 作用域之外只挂载一次 `plan-mode`。标准 Profile 只保留 `default` 与 `ptc`：它们选择普通或编程化工具呈现，但不改变 Plan 状态。

该边界与 DSH 中值得吸收的部分一致：DSH 发布的预设是 `standard`、`code`、`minimal`、`cordis`；Plan 是非 Minimal Agent 内的作用域状态插件，不是另一个预设。Pi 本身也把 Plan 视为可选 Extension，而不是 Agent Kernel 内置模式。

| DSH 预设 | 执行呈现 | Plan 控制 |
| --- | --- | --- |
| `standard` | 完整编码工具 | 包含 |
| `code` | 通过 Code Mode 呈现标准能力 | 包含 |
| `minimal` | 仅持久 Shell 与编辑器 | 不包含 |
| `cordis` | 标准能力加 Cordis 检查/创作 | 包含 |

Pi-Cordis 不复制这四种产品人格：`minimal` 会削弱已经核验的默认面，DSH 的 `cordis` 创作人格也超出 Pi-Cordis 轻量控制面的产品边界。因此这里只保留真正改变工具呈现的执行差异：`default` 与 `ptc`。

## 模型与用户控制

- `/plan` 为当前 Pi Session 激活 Plan；
- `/plan <请求>` 先激活 Plan，再把原始请求作为真实 Pi 用户消息提交；若 Agent Turn 正在运行，则通过 Pi 的 `steer` 队列投递；
- `/plan off` 由用户明确退出；
- `exit_plan_mode({ plan })` 在所有状态下保持注册，在 Plan 外调用会失败，要求 Markdown `#` 标题，并且只有交互式批准后才退出；
- 交互式 TUI 会在工具行渲染计划全文，并在独立批准选择框之前打开可滚动的全文预览；预览中的修改必须重新提交，不会静默改变获批产物；
- 批准不会切换 Profile；
- `picds --plan` 选择初始 Plan 状态，不再虚构 `plan` Profile。

因此 Plan 切换期间工具目录保持稳定。`todo_write` 只负责批准后的实施追踪；Plan 不再复制 Todo 状态、不写 `.picds/plans/`，也不生成未经独立核验的 Walkthrough 文件。

命令行为从可观察的用户旅程出发，而不是从参数白名单出发：空输入与精确的 `on`/`off` 是控制词，其余非空字符串都是请求正文，并保留原始大小写与内容。插件先激活 Plan 再投递消息，保证新 Turn 已受到 Plan 策略约束；若 Pi 拒绝消息提交，则恢复该 Session 进入前的状态，不留下只完成一半的切换。

## 执行门禁与范围

Plan 激活时，Prompt 策略禁止实施，文件修改工具被拦截，复合 Shell 命令的每一段都必须命中只读白名单。进程内目录导航允许通过，因此 `cd ... && git status && git log` 等真实检查序列仍可使用，而安全首段不能掩盖未知后缀。PTC 的嵌套 SDK 调用仍通过 `ToolRegistryService.executeTool()`，因此内部写入和 Shell 修改也会到达 Plan 门禁。

该拦截是防误操作护栏，不是操作系统权限沙箱；未知或自定义工具仍需独立策略。状态使用 `ExtensionService` 从 Pi 实时上下文转发的 Session ID 分区，并只维持到当前 Picds 进程结束；项目不把它描述为跨进程重启的持久日志状态。

## 被移除的设计

原 `plan` Profile 会装卸 `plan-mode`，以 `plan_step` 复制第二套任务系统，写入 `.picds/plans/`，并在批准后广播 `pi/profile-switch`。该设计迫使状态跨 Fiber 销毁迁移，又把评审决定与工具呈现耦合。移除这层耦合后，也消除了此前反复修复 Profile 退出与跨 Profile 状态保留问题的根源。

## 验证

回归测试证明：

- 标准 Profile 只有 `default` 与 `ptc`；
- 仅需 Core 的测试与嵌入使用 `profile: false`，而不是隐式 `minimal` Profile；
- 旧 `plan` 名称会失败并给出 `/plan` 迁移提示；
- `exit_plan_mode` 在 Profile 切换期间保持注册；
- Plan Prompt 状态跨 `default -> ptc -> default` 保持；
- 批准只退出 Plan，不切换 Profile；
- 审批 UI 在决定前完整展示计划；不支持 Pi 多行编辑器的 Provider 也会收到包含全文的回退提示；
- `/plan <请求>` 保留请求正文、先激活再投递、忙碌时使用 `steer`、不提交 `off`，且投递失败时回滚状态；
- 复合 Shell 检查只有在每一段均命中白名单时通过；命令替换与未知后缀按失败关闭；
- 普通调用与 PTC 内部修改都经过 Plan 门禁；
- Session ID 从 Pi `ExtensionContext` 进入 Cordis 生命周期事件信封。
