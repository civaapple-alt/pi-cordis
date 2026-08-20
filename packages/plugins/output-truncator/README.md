# @pi-cordis/plugin-output-truncator

English | [中文](README.zh.md)

Native Cordis output truncation and context-protection plugin. It listens to the `pi/tool-result` event stream and automatically truncates oversized tool outputs (>50KB or >2000 lines) to protect terminal rendering and prevent context window overflow.

## Configuration

- `maxBytes` (number, default: `51200` / 50KB): Maximum byte length threshold.
- `maxLines` (number, default: `2000`): Maximum line count threshold.

## Behavior
When a tool (such as `read`, `bash`, or `grep`) produces output exceeding either threshold:
1. Lines beyond `maxLines` are omitted and appended with `[... Truncated: N lines omitted by @pi-cordis/plugin-output-truncator ...]`.
2. Byte sequences beyond `maxBytes` are sliced with `[... Truncated: exceeded N bytes limit ...]`.
3. Preserves structured objects while sanitizing text payload fields.

## Model Experience
- **Context Protection**: Prevents accidental large file dumps (e.g. minified bundles or log files) from consuming the entire context window.
- **Safety**: Safe default included in the `default` (Default is Best) profile.
