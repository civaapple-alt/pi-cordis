# @pi-cordis/plugin-ask-question

English | [中文](README.zh.md)

Native Cordis human-interaction and clarifying question plugin. It provides the model-facing `ask_question` tool to solicit structured decisions or missing requirements from the user in single or batch modes, featuring `(Recommended)` choices and TUI visual cards.

## Tool

### `ask_question`

Accepts:
- `questions` (array of question objects, optional): Batch question list with `id`, `question`, `header`, `options`, and `multi_select`.
- `question` (string, optional): Single question text (legacy compatibility).
- `options` (array of `{ label: string, description?: string }`, optional): Selectable choices. Put recommended choices first and append `(Recommended)`.
- `allowCustom` (boolean, optional): Whether free-form user typing is allowed.

Returns:
- `answers` (array of `{ id: string, selected: string[], custom?: string }`): Canonical structured answers.
- `question` (string): Primary question.
- `selected` (string): Selected option label.
- `wasCustom` (boolean): Whether custom input was provided.

## Model Experience
- **Interactive Decision Gate**: Prompts user directly rather than making unwarranted assumptions on ambiguous tasks.
- **Structured JSON Result**: Returns deterministic option selections directly to the agent loop.
- **TUI Visuals**: Formats rich question cards with options and selection badges.
