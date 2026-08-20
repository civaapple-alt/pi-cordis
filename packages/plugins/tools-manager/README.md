# @pi-cordis/plugin-tools-manager

English | [中文](README.zh.md)

Native Cordis dynamic tool management and inspection plugin. It registers the `manage_tools` tool to inspect active tools and toggle specific tools on and off during runtime.

## Tool

### `manage_tools`

Accepts:
- `action` (`"list"` | `"disable"` | `"enable"`, required): Tool management action.
- `toolName` (string, optional): Target tool name for enable/disable operations.

Returns:
- `total` (number): Total registered tools.
- `active` (string[]): List of currently active tool names.
- `disabled` (string[]): List of disabled tool names.
- `message` (string, optional): Status feedback message.

## Model Experience
- **Focus Control**: Disables irrelevant or distracting tools for specific tasks.
- **Context Optimization**: Reduces tool schema overhead by keeping only task-critical tools active.
