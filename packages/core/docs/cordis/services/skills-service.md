# SkillsService (`ctx.skills`)

English | [中文](skills-service.zh.md)

`SkillsService` loads skills from the project filesystem and allows plugins to dynamically register in-memory skills with `this.ctx.effect()` lifecycle teardown.

## API Reference

### `ctx.skills.load(options?): { skills: Skill[] }`
Loads all skills from project and global directories, merged with in-memory custom skills.

### `ctx.skills.registerSkill(skill: Skill): () => void`
Registers a dynamic custom skill. Returns a disposer function that unregisters the skill upon disposal.

### `ctx.skills.getSkill(name: string): Skill | undefined`
Retrieves a specific skill by its name.

### `ctx.skills.getAllSkills(): Skill[]`
Returns all active skills.

## Events Emitted

- `pi/skill-registered`: `(skill: Skill)`
- `pi/skill-unregistered`: `(name: string)`
