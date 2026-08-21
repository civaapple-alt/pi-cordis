# @pi-cordis/plugin-ask-question

[English](README.md) | 中文

注册 `ask_question`，把顺序执行的澄清问题桥接到 Pi 的真实终端 UI。

工具接受 `questions[]`，也兼容旧式 `question`/`options`。每题支持带说明与备注的标签选项；Pi 提供文本输入能力时，会增加可选的自定义回答入口。返回结果包含稳定 ID、所选标签、备注和自定义文本。

Pi UI 桥接每题提供一次单选。带 `preview` 的选项会优先在 Pi 可滚动 Editor 中以只读副本完整审阅，再经二次确认才接受该选择；极简 UI Provider 则在确认步骤中收到全文。用户可以明确返回选项列表；插件不宣称支持多选。

Headless 执行返回 `INTERACTIVE_UI_UNAVAILABLE`，空问题返回 `INVALID_QUESTION`，取消返回空选择与 `cancelled: true`，并立即停止剩余问题。渲染器会区分失败、取消与成功回答；插件不会用默认值冒充用户决定。
