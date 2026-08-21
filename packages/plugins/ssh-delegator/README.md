# @pi-cordis/plugin-ssh-delegator

English | [中文](README.zh.md)

Private, unpublished prototype retained for design history and contract tests. No SSH transport is connected, so invoking `ssh_exec` returns `success: false`, exit code `-1`, and `SSH_TRANSPORT_UNAVAILABLE`.

It is excluded from every built-in Profile and from the publication graph. It never claims that a remote command ran.
