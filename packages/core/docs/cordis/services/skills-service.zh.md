# SkillsService (`ctx.skills`)

[English](skills-service.md) | 中文

`SkillsService` 负责从项目文件系统加载技能，并支持插件通过 `this.ctx.effect()` 动态注册内存技能（插件卸载时自动注销）。

## API 接口

### `ctx.skills.load(options?): { skills: Skill[] }`
从项目与全局目录加载所有技能，并与动态注册的内存技能合并。

### `ctx.skills.registerSkill(skill: Skill): () => void`
动态注册自定义技能。返回注销句柄，在 Fiber 卸载时自动注销。

### `ctx.skills.getSkill(name: string): Skill | undefined`
通过技能名称查找特定技能。

### `ctx.skills.getAllSkills(): Skill[]`
获取当前所有可用技能列表。

## 触发事件

- `pi/skill-registered`：`(skill: Skill)`
- `pi/skill-unregistered`：`(name: string)`
