# @pi-cordis/plugin-subagent

[English](README.md) | 中文

该目录是为设计历史与契约测试保留的私有、不可发布原型。它没有连接智能体执行驱动，调用 `subagent` 会返回 `success: false` 与 `SUBAGENT_DRIVER_UNAVAILABLE`（或在派发前返回 `DELEGATED_DEPTH_EXCEEDED`）。

它不属于任何内置 Profile，也不在发布依赖图中。请勿把它作为已经实现的委派能力使用。
