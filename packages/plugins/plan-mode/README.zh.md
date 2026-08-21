# @pi-cordis/plugin-plan-mode

[English](README.md) | 中文

Plan 是每个 Session 的协作状态，不是 Profile。`@pi-cordis/core` 在可切换 Profile 作用域之外只挂载一次该插件，因此 `/profile default` 与 `/profile ptc` 不会销毁 Plan 状态，也不会改变 Plan 工具 Schema。

插件只提供两个控制入口：

- `/plan` 进入 Plan mode，`/plan <请求>` 进入后把请求作为下一条用户消息提交，`/plan off` 由用户明确退出；
- `exit_plan_mode({ plan })` 把完整 Markdown 计划交给交互式评审，只有批准后才退出 Plan mode。

## 用户旅程契约

| 用户操作 | 期望结果 |
| --- | --- |
| `/plan` 或 `/plan on` | 进入 Plan，但不启动 Agent Turn。 |
| `/plan 继续迁移计划` | 先进入 Plan，再在 Plan 策略下原样提交后续文本。 |
| Agent 忙碌时输入 `/plan <请求>` | 立即激活修改护栏，并把请求作为 steer 消息排队。 |
| `/plan off` | 退出 Plan，不把 `off` 当作 Prompt 提交。 |
| 消息提交失败 | 恢复进入前的 Plan 状态并暴露失败，不报告半成功。 |
| `exit_plan_mode` 提交计划 | 展示完整产物、显式呈现修改，并只批准用户确认的精确版本。 |

Plan 未激活时 `exit_plan_mode` 仍保持注册，以稳定模型可见 Schema；此时调用会明确失败。计划编写不再复制执行期任务追踪：评审内容放在 `plan` 参数中，批准后的实施进度才使用 `todo_write`。

在 Pi 交互式 TUI 中，工具调用卡片会渲染完整 Markdown 计划，而不再只显示首个标题。批准前先打开包含全文的可滚动多行预览，再进入独立的明确选择框；取消会保持 Plan 激活。若用户在预览中修改正文，该修改会被视为评审反馈，并要求以修订版重新提交，避免变更后的产物被隐式批准。不提供多行编辑器的 UI Provider 会在选择框提示中收到完整计划。

Plan 激活期间，插件注入精简规划规则，拦截声明为 `workspace` 或 `external` 副作用的工具、已知文件修改工具，以及未列入只读白名单的 Shell 命令。复合 Shell 命令会逐段校验，因此 `cd ... && git status && git log` 这类导航加检查可以工作，安全前缀也不能掩盖未知后缀；PTC 内部调用同样经过该门禁。它是防误操作护栏，不是权限沙箱；自定义变更工具必须声明副作用元数据。

状态按 `ExtensionService` 提供的 Pi Session ID 隔离，并维持到当前 Picds 进程结束。插件不再写入 `.picds/plans/`，也不再生成由调用者自行声明的 Walkthrough。
