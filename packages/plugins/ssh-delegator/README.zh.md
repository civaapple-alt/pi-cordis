# @pi-cordis/plugin-ssh-delegator

[English](README.md) | 中文

该目录是为设计历史与契约测试保留的私有、不可发布原型。它没有连接 SSH 传输，调用 `ssh_exec` 会返回 `success: false`、退出码 `-1` 与 `SSH_TRANSPORT_UNAVAILABLE`。

它不属于任何内置 Profile，也不在发布依赖图中，且不会声称远端命令已经执行。
