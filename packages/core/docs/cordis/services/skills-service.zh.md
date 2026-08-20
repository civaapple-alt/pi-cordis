# SkillsService (`ctx.skills`)

[English](skills-service.md) | 中文

`SkillsService` 是 Pi-Cordis 的技能发现、加载与动态注册服务。它自动扫描工作区与用户目录下的 Markdown 技能文件（如 `.agents/skills/*/SKILL.md`），并允许插件通过 `this.ctx.effect()` 动态注册内存技能，在插件卸载时自动可逆注销。

---

## 技能目录结构与格式

Pi-Cordis 遵循标准技能规范，支持以下发现路径：
- 项目级：`<cwd>/.agents/skills/<skill-name>/SKILL.md`
- 项目级兼容：`<cwd>/.picds/skills/` 或 `<cwd>/.pi/skills/`
- 全局级：`~/.picds/agent/skills/`

### `SKILL.md` 格式范例
```markdown
---
name: code-review
description: 审查拉取请求 (PR) 的代码质量、安全漏洞与测试覆盖率
---

# Code Review Skill
当用户请求审查代码时，请按以下步骤执行...
```

---

## API 接口参考

### 1. `ctx.skills.load(options?): { skills: Skill[], diagnostics: any[] }`
扫描并加载所有磁盘技能，并与动态注册的内存技能合并返回。

### 2. `ctx.skills.registerSkill(skill: Skill): () => void`
动态注册一个自定义技能。返回 Disposer 销毁函数并在卸载时自动注销。
```typescript
const unregister = ctx.skills.registerSkill({
    name: "git-release",
    description: "自动化 Git Release 打标签与发版流程",
    instructions: "# Git Release Instructions\n..."
});
```

### 3. `ctx.skills.getSkill(name: string): Skill | undefined`
通过技能名称检索指定技能对象。

### 4. `ctx.skills.getAllSkills(): Skill[]`
获取当前所有可用技能的平铺列表。

---

## 广播事件 (Events)

- **`pi/skill-registered`**：当新技能被注册时触发 `(skill: Skill)`；
- **`pi/skill-unregistered`**：当技能被注销时触发 `(name: string)`。

---

## 插件集成范例 (Plugin Example)

```typescript
import type { Context } from "@deepseek-ai/cordis";

export const name = "dynamic-security-skills";
export const inject = ["skills"];

export function apply(ctx: Context) {
    const unregister = ctx.skills.registerSkill({
        name: "security-audit",
        description: "快速扫描代码中的硬编码秘钥与高危 SQL 拼接",
        instructions: "# Security Audit Guide\n..."
    });

    ctx.effect(() => () => unregister());
}
```
