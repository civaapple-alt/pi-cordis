# @pi-cordis/plugin-rules-injector

English | [中文](README.zh.md)

Native Cordis project rules and instructions injection plugin. It automatically discovers and merges rules from `AGENTS.md`, `CLAUDE.md`, `.clauderules`, `.cursorrules`, `.claude/rules/`, and `.agents/rules/`, using SHA-256 hash caching to ensure stability of the prompt prefix and maximize LLM KV-cache reuse.

## Configuration

- `ruleFiles` (string[], optional): Root rule filenames to scan (defaults: `["AGENTS.md", "CLAUDE.md", ".clauderules", ".cursorrules"]`).
- `scanClaudeRules` (boolean, default: `true`): Whether to scan `.claude/rules/*.md`.
- `scanAgentRules` (boolean, default: `true`): Whether to scan `.agents/rules/*.md`.

## KV-Cache Friendly Hashing
1. **Hierarchical Rule Discovery**: Aggregates all project guidelines across root files and subdirectories.
2. **SHA-256 Content Hashing**: Computes a stable hash of all combined rules; if files remain unchanged between turns, the exact cached string is injected, avoiding string re-allocations and keeping LLM KV-cache prompt prefixes identical.

## Model Experience
- **Strict Rule Compliance**: Injects workspace architectural and coding rules at the start of every session turn.
- **Zero Overhead**: In-memory caching minimizes disk I/O and latency.
