# @pi-cordis/plugin-ask-question

English | [中文](README.zh.md)

Registers `ask_question` and bridges sequential clarifying questions to Pi's real terminal UI.

The tool accepts either `questions[]` or the legacy `question`/`options` shape. Each question supports labeled options with descriptions and notes; when Pi exposes text input, an optional custom-answer choice is added. Answers return stable IDs, selected labels, notes, and custom text.

The current Pi UI bridge presents one selection per question. `preview` metadata is retained in the input type for compatibility but is not rendered as a separate preview pane, and multi-select is not advertised.

Headless execution returns `INTERACTIVE_UI_UNAVAILABLE`, empty questions return `INVALID_QUESTION`, and cancellation returns an empty selection with `cancelled: true`. The plugin never substitutes a default for a missing user decision.
