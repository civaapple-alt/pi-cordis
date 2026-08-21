# @pi-cordis/plugin-session-handoff

English | [中文](README.zh.md)

Registers `session_handoff`, a pure formatter for a user- or model-supplied handoff envelope. It returns Markdown and emits `pi/handoff`.

The plugin does not inspect the current session, verify supplied accomplishments, create a new session, archive the old session, or persist the envelope. Consumers may listen to `pi/handoff` and implement those policies explicitly.
