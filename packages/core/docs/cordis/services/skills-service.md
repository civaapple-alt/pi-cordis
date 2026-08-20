# SkillsService (`ctx.skills`)

English | [中文](skills-service.zh.md)

`SkillsService` is the skill discovery, loading, and dynamic registration service in Pi-Cordis. It automatically scans Markdown skill definitions (e.g. `.agents/skills/*/SKILL.md`) and allows plugins to dynamically register in-memory skills with reversible `Disposer` teardowns upon plugin unload.

---

## Directory Layout & Skill Format

Pi-Cordis discovers skills across the following locations:
- Project level: `<cwd>/.agents/skills/<skill-name>/SKILL.md`
- Project fallback: `<cwd>/.picds/skills/` or `<cwd>/.pi/skills/`
- Global level: `~/.picds/agent/skills/`

### `SKILL.md` Format Example
```markdown
---
name: code-review
description: Review pull requests for code quality, security vulnerabilities, and test coverage
---

# Code Review Skill
When the user asks for a code review, follow these instructions...
```

---

## API Reference

### 1. `ctx.skills.load(options?): { skills: Skill[], diagnostics: any[] }`
Scans and loads all on-disk skills merged with dynamic in-memory skills.

### 2. `ctx.skills.registerSkill(skill: Skill): () => void`
Registers a custom dynamic skill. Returns a disposer function.
```typescript
const unregister = ctx.skills.registerSkill({
    name: "git-release",
    description: "Automated git release tagging and changelog generation",
    instructions: "# Git Release Instructions\n..."
});
```

### 3. `ctx.skills.getSkill(name: string): Skill | undefined`
Retrieves a specific skill by name.

### 4. `ctx.skills.getAllSkills(): Skill[]`
Returns the flattened list of all available skills.

---

## Events Emitted

- **`pi/skill-registered`**: `(skill: Skill)`
- **`pi/skill-unregistered`**: `(name: string)`

---

## Plugin Integration Example

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "dynamic-security-skills";
export const inject = ["skills"];

export function apply(ctx: Context) {
    const unregister = ctx.skills.registerSkill({
        name: "security-audit",
        description: "Scans for hardcoded secrets and SQL injection vectors",
        instructions: "# Security Audit Guide\n..."
    });

    ctx.effect(() => () => unregister());
}
```
