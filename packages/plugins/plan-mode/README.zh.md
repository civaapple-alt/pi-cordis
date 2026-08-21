# @pi-cordis/plugin-plan-mode

[English](README.md) | 中文

提供 `plan_step`：内存中的结构化计划状态机，并把 Markdown 投影到 `.picds/plans/`。它支持计划元数据、步骤、状态更新、会话级视图、交互审查和可选 Walkthrough 生成。

计划未批准时会阻断文件修改工具；标准 `plan` Profile 还通过只读 Safety Gate 覆盖 Shell 修改。批准必须来自真实 Pi UI 选择，Headless 模型调用不能自我批准；批准后广播 `pi/profile-switch`，切换到 `default` 或 `ptc`。

计划与索引持久化失败会明确报错。`finish` 拒绝空计划或未完成步骤，只记录调用者提供的验证计划，不会声称测试已经运行。Walkthrough 内容仍由调用者提供，并非独立核验结果。

这是工作流控制，不是操作系统权限边界。用户可显式执行 `/profile default` 离开 Plan 模式。
