# SkillsService (`ctx.skills`)

English | [中文](skills-service.zh.md)

`SkillsService` wraps Pi's `loadSkills()` for SDK-side discovery and adds reversible in-memory registrations.

- Pi paths remain upstream-compatible: global `<agentDir>/skills/` and project `<cwd>/.pi/skills/`;
- additional paths are supplied through `skillPaths`;
- `load()`, `getSkill()`, and `getAllSkills()` merge disk skills with the active top of each dynamic registration stack;
- `registerSkill()` returns a disposer and emits `pi/skill-registered` / `pi/skill-unregistered`.

In-memory registrations are a Cordis catalog. Pi's Extension API has no in-memory skill-registration method, so these registrations are not automatically added to the interactive Pi resource loader. Use Pi skill files/packages when the interactive agent must invoke a skill.
