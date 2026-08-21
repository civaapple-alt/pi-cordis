# @pi-cordis/plugin-plan-mode

[English](README.md) | 中文

Plan 是每个 Session 的协作状态，不是 Profile。`@pi-cordis/core` 在可切换 Profile 作用域之外只挂载一次该插件，因此 `/profile default` 与 `/profile ptc` 不会销毁 Plan 状态，也不会改变 Plan 工具 Schema。

插件只提供两个控制入口：

- `/plan` 进入 Plan mode；`/plan off` 由用户明确退出；
- `exit_plan_mode({ plan })` 把完整 Markdown 计划交给交互式评审，只有批准后才退出 Plan mode。

Plan 未激活时 `exit_plan_mode` 仍保持注册，以稳定模型可见 Schema；此时调用会明确失败。计划编写不再复制执行期任务追踪：评审内容放在 `plan` 参数中，批准后的实施进度才使用 `todo_write`。

Plan 激活期间，插件注入精简规划规则，拦截文件修改工具以及未列入只读白名单的 Shell 命令；PTC 内部调用也经过同一门禁。它是防误操作护栏，不是权限沙箱，自定义工具仍可能需要自己的策略。

状态按 `ExtensionService` 提供的 Pi Session ID 隔离，并维持到当前 Picds 进程结束。插件不再写入 `.picds/plans/`，也不再生成由调用者自行声明的 Walkthrough。
