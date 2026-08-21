# ExtensionService (`ctx.extensions`)

[English](extension-service.md) | 中文

`ExtensionService` 是 Cordis 策略与 Pi 交互式 Extension API 之间的窄桥。

它提供：

- 可逆 Cordis 命令栈，并通过稳定的 Pi 命令代理分发；
- Cordis Tool 到 Pi Tool Definition 的适配，以及 `setActiveTools()` 同步；
- 串行执行前 `pi/tool-call` 与执行后 `pi/tool-result` 管线；
- Agent Turn 前的串行 Prompt 变换；
- Session、Agent、Turn、Tool 与模型选择事件转发；
- 从 Pi 实时 `ExtensionContext` 解析 Session ID，并写入 Session、Prompt 与 Tool-call 事件信封；
- 动态 Provider 注册/注销转发；
- Pi 运行期激活后，为 Cordis 命令提供受保护的 `sendUserMessage()` 转发；
- 把 Pi `ExtensionContext` 传给工具，使插件使用真实 `ui.select`、`ui.input`、`ui.notify`。
- 把 Cordis 工具失败（`isError`、`success: false` 或非空 `error`）统一转换为 Pi Error Result，避免失败操作在表现层看起来像成功。

Pi 当前没有命令注销 API。因此命令销毁后，代理仍可能出现在 Pi 命令目录中，但只会提示“当前 Profile 不可用”，绝不会调用已销毁 Handler。Tool Definition 与 Provider 在 Pi 的 Extension 加载阶段注册；首次 `setActiveTools()` 同步延迟到 `session_start`，此时 Pi 已完成仅运行期可用的 Action Method 绑定。后续 Profile 与工具变更仍会立即同步。

`sendUserMessage(content, options)` 遵循同一运行期边界：只在 `session_start` 与 `session_shutdown` 之间转发给 Pi，区间之外明确失败。这样 `/plan <请求>` 等命令可以触发真实用户 Turn，又不会绕开 Cordis Service 接缝或在 Extension 加载阶段误调 Pi Action Method。

`load()` 是 Pi Extension 发现的 SDK 侧封装。交互 CLI 的普通 Extension 发现仍由上游 Pi 所有；Pi-Cordis 只注入隐藏的 Cordis Bridge Factory。

Prompt 变换、工具注册、工具可见性同步与结果变换失败都会向上传播，不会静默丢弃控制面失败。结果监听器可替换 `event.result`，最终值会返回 Pi。只有 Renderer 错误降级为空组件，避免纯 UI 装饰错误终止 Agent Loop。
