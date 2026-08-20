# @pi-cordis/plugin-ask-question

English | [中文](README.zh.md)

Native Cordis disambiguation and interactive questionnaire plugin. It provides the model-facing `ask_question` tool supporting single and batch questions, `(Recommended)` highlight options, side-by-side Markdown/Diff previews, and interactive TUI dialogs.

## Tool

### `ask_question`

Accepts:
- `questions` (array of objects, optional): Structured list of questions with `id`, `question`, `header`, `options`, and `multi_select`.
- `question` (string, optional): Single question string (legacy compatibility).
- `options` (array of objects, optional): Selectable choices:
  - `label` (string, required): Option text (append `(Recommended)` for the preferred choice).
  - `description` (string, optional): Brief description of what the option entails.
  - `preview` (string, optional): Markdown or Code Diff preview rendered in a bordered preview pane.
  - `note` (string, optional): Supplementary note on the option.
- `allowCustom` (boolean, optional): Whether custom text typing is allowed.

Returns:
- `answers` (array): Standard structured answers (`{ id, selected: string[], notes?, custom? }`).
- `question` (string): Primary question text.
- `selected` (string): Primary selected option label.
- `notes` (string): Notes attached to the selected option.
- `wasCustom` (boolean): Whether custom free-form input was typed.

## Model Experience
- **Proactive Disambiguation & Comparison**: When encountering ambiguous requirements or multiple valid architectures, confirms with the user with side-by-side Markdown/Diff preview comparisons.
- **Structured Deliverables**: Hands clean JSON back to the agent loop.
