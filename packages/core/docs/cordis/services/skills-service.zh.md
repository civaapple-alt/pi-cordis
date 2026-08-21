# SkillsService (`ctx.skills`)

[English](skills-service.md) | 中文

`SkillsService` 封装 Pi `loadSkills()`，用于 SDK 侧发现，并增加可逆的内存注册。

- 路径保持 Pi 上游兼容：全局 `<agentDir>/skills/`、项目 `<cwd>/.pi/skills/`；
- 额外路径通过 `skillPaths` 传入；
- `load()`、`getSkill()`、`getAllSkills()` 合并磁盘 Skill 与每个动态注册栈的当前顶层；
- `registerSkill()` 返回 Disposer，并广播 `pi/skill-registered` / `pi/skill-unregistered`。

内存注册只是 Cordis Catalog。Pi Extension API 没有内存 Skill 注册方法，因此它们不会自动进入交互式 Pi ResourceLoader；若交互 Agent 必须调用 Skill，请使用 Pi Skill 文件或 Package。
