# @pi-cordis/plugin-ask-question

English | [中文](README.zh.md)

Native Cordis human-interaction clarifying question plugin. It provides the model-facing `ask_question` tool to solicit structured decisions or missing requirements from the user.

## Tool

### `ask_question`

Accepts:
- `question` (string, required): The question to ask the user.
- `options` (array of `{ label: string, description?: string }`, required): Selectable options.
- `allowCustom` (boolean, optional): Whether free-form user typing is allowed.

Returns:
- `question` (string): Echoed question.
- `options` (string[]): Option labels.
- `selected` (string): User-selected option or custom input.
- `wasCustom` (boolean): Whether custom input was provided.

## Model Experience
- **Interactive Decision Gate**: Prompts user directly rather than making unwarranted assumptions on ambiguous tasks.
- **Structured JSON Result**: Returns deterministic option selections directly to the agent loop.
