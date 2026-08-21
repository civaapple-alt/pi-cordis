# @pi-cordis/plugin-ask-question

[English](README.md) | 中文

注册 `ask_question`，把顺序执行的澄清问题桥接到 Pi 的真实终端 UI。

工具接受 `questions[]`，也兼容旧式 `question`/`options`。每题支持带说明与备注的标签选项；Pi 提供文本输入能力时，会增加可选的自定义回答入口。返回结果包含稳定 ID、所选标签、备注和自定义文本。

当前 Pi UI 桥接每题只提供一次单选。输入类型为兼容性保留 `preview` 元数据，但不会渲染独立预览窗，也不宣称支持多选。

Headless 执行返回 `INTERACTIVE_UI_UNAVAILABLE`，空问题返回 `INVALID_QUESTION`，取消返回空选择与 `cancelled: true`。插件不会用默认值冒充用户决定。
