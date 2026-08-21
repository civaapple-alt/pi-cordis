# @pi-cordis/plugin-ask-question

English | [中文](README.zh.md)

Registers `ask_question` and bridges sequential clarifying questions to Pi's real terminal UI.

The tool accepts either `questions[]` or the legacy `question`/`options` shape. Each question supports labeled options with descriptions and notes; when Pi exposes text input, an optional custom-answer choice is added. Answers return stable IDs, selected labels, notes, and custom text.

The Pi UI bridge presents one selection per question. An option carrying `preview` opens Pi's scrollable editor as a read-only review copy when available, then requires a second confirmation before the choice is accepted; minimal UI providers receive the complete preview in that confirmation step. The user can return to the option list. Multi-select is not advertised.

Headless execution returns `INTERACTIVE_UI_UNAVAILABLE`, empty questions return `INVALID_QUESTION`, and cancellation returns an empty selection with `cancelled: true`. Cancellation stops the remaining question batch immediately. The renderer distinguishes failures and cancellations from completed answers, and the plugin never substitutes a default for a missing user decision.
