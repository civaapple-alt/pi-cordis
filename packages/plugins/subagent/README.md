# @pi-cordis/plugin-subagent

English | [中文](README.zh.md)

Private, unpublished prototype retained for design history and contract tests. No agent driver is connected, so invoking `subagent` returns `success: false` with `SUBAGENT_DRIVER_UNAVAILABLE` (or `DELEGATED_DEPTH_EXCEEDED` before dispatch).

It is excluded from every built-in Profile and from the publication graph. Do not depend on it as an implemented delegation capability.
