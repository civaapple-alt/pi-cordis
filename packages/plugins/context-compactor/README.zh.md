# @pi-cordis/plugin-context-compactor

[English](README.md) | 中文

该目录是为设计历史与契约测试保留的私有、不可发布原型。它没有接入 Pi 原生压缩操作，调用 `trigger_compact` 会返回 `success: false` 与 `COMPACTION_DRIVER_UNAVAILABLE`，不会修改会话状态。

它不属于任何内置 Profile，也不在发布依赖图中。
