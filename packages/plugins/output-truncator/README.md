# @pi-cordis/plugin-output-truncator

English | [中文](README.zh.md)

Native Cordis output truncation, Head/Tail preservation, and Spill storage plugin. It listens to the `pi/tool-result` event stream, preserving the first 30 lines (Head) and last 20 lines (Tail) while automatically persisting the full oversized output to `.pi/spill/<id>.txt` with pagination instructions.

## Configuration

- `maxBytes` (number, default: `51200` / 50KB): Maximum byte length threshold.
- `maxLines` (number, default: `2000`): Maximum line count threshold.
- `headLines` (number, default: `30`): Head lines preserved before truncation.
- `tailLines` (number, default: `20`): Tail lines preserved after truncation.
- `enableSpill` (boolean, default: `true`): Persists full raw output to `.pi/spill/` disk files.

## Spill & Dual-End Preservation Architecture

When a tool result exceeds either limit:
1. **Head / Tail Preservation**: The first 30 lines and last 20 lines are retained, providing both initial context and terminal exit status.
2. **Spill Persistence**: The entire un-truncated output is written to `.pi/spill/spill_<timestamp>_<id>.txt`.
3. **Structured Guidance**: Appends a clear pagination notice to the model:
   ```text
   [... Truncated: 2950 lines (150240 bytes) omitted by @pi-cordis/plugin-output-truncator ...]
   [... Full output persisted to ".pi/spill/spill_1787131920_a1b2c3.txt". Use read(path=".pi/spill/spill_1787131920_a1b2c3.txt", offset=..., limit=...) to inspect sections ...]
   ```

## Model Experience
- **Zero Information Loss**: The model can navigate oversized tool outputs (e.g. huge git diffs, build logs) using standard file read pagination.
- **Context Protection**: Prevents massive outputs from blowing up the conversational context window or causing terminal lag.
