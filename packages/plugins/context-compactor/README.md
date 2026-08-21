# @pi-cordis/plugin-context-compactor

English | [中文](README.zh.md)

Private, unpublished prototype retained for design history and contract tests. It is not connected to Pi's native compaction operation, so invoking `trigger_compact` returns `success: false` with `COMPACTION_DRIVER_UNAVAILABLE` and does not alter conversation state.

It is excluded from every built-in Profile and from the publication graph.
