# @pi-cordis/plugin-plan-mode

[English](README.md) | 中文

原生 Cordis 结构化规划模式与计划文档编排插件。通过 `plan_step` 工具实现 **`implementation_plan.md`（实施计划文档）的自动生成与增量同步**、**用户审查与批准门禁（User Review & Approval Gate）**、**执行过程中的反复查看与进度实时投影** 以及 **结项演练总结（Walkthrough）**。

---

## 🌟 核心价值与能力

1. **自动生成与同步 `implementation_plan.md`**：
   - 包含结构化字段：概述与背景、用户审查待确认项（`User Review Required`）、待确认问题（`Open Questions`）、拟定修改清单（`Proposed Changes`，带 `[NEW]`、`[MODIFY]`、`[DELETE]`）、步骤依赖图与验证计划；
   - 自动落盘至 `.pi/plans/implementation_plan.md`，执行过程中每一步更新均就地自动同步刷新。
2. **用户审查与批准门禁 (User Review & Approval Gate)**：
   - 在用户批准计划之前，强制拦截一切破坏性修改工具（`write`、`edit`、`patch`、`apply_patch`）；
   - 支持通过 `action: "request_review"` 提示用户审查，并在用户确认后调用 `action: "approve"` 解除写拦截。
3. **执行过程中的反复查看 (Live Inspection)**：
   - 用户与模型可通过 `action: "view"` 或 `action: "get_plan"` 随时调取最新计划 Markdown、进度条与各步骤状态。
4. **结项演练与成果总结 (`walkthrough.md`)**：
   - 当任务执行完毕，调用 `action: "finish"` 时自动生成结项演练总结，提供变更对照与测试通过证据。

---

## 🛠️ 工具：`plan_step`

### 参数定义
- `action` (必填):
  - `"set_plan"`: 设置/更新计划整体元数据（标题、概述、待确认项、拟定修改清单、验证计划）；
  - `"add"`: 增加计划步骤；
  - `"update"`: 更新指定步骤状态 (`pending` | `in_progress` | `completed` | `failed`)；
  - `"request_review"`: 请求用户审查计划，标明待确认项；
  - `"approve"`: 用户批准计划，解除写操作拦截；
  - `"view"` / `"get_plan"`: 获取当前计划文档的完整 Markdown、路径与执行进度；
  - `"finish"`: 完成计划，可传入 `summary` 自动生成 `walkthrough.md`；
  - `"list"`: 列出所有步骤。
- `id` (number, 可选): 步骤编号。
- `title` (string, 可选): 计划标题或步骤描述。
- `overview` (string, 可选): 计划背景与目标概述。
- `userReviewRequired` (string, 可选): 需要用户重点审查与确认的内容。
- `openQuestions` (string[], 可选): 待用户澄清的疑问列表。
- `proposedChanges` (数组, 可选): 拟定修改的文件与组件清单。
- `verificationPlan` (string, 可选): 验收与测试计划。
- `status` (string, 可选): `"pending"` | `"in_progress"` | `"completed"` | `"failed"`。
- `dependsOn` (number[], 可选): 依赖的前置步骤 ID 列表。
- `notes` (string, 可选): 步骤备注或技术选型依据。
- `summary` (string, 可选): 结项演练与成果总结。

---

## 📝 产物格式规范

### 1. 计划文档 (`implementation_plan.md`)
```markdown
# [Goal Description]

> **Status**: 🟡 Pending User Review | **Progress**: [████░░░░░░] 40% (2/5 completed)

## 概述与目标 (Overview & Background)
...

## 用户审查与待确认项 (User Review Required & Open Questions)
> [!IMPORTANT]
> ...

## 拟定修改清单 (Proposed Changes)
| 变更类型 | 目标文件 / 组件 | 修改说明与影响 |
| :--- | :--- | :--- |
| `[MODIFY]` | `src/service.ts` | 增加响应式事件广播 |

## 步骤进度与依赖图 (Execution Steps & Dependencies)
- [✓] **#1**: 步骤1
- [▶] **#2**: 步骤2 *(依赖: #1)*

## 验证计划 (Verification Plan)
- 运行 vitest 自动化测试套件
```

### 2. 成果演练文档 (`walkthrough.md`)
调用 `action: "finish"` 时自动生成，包含执行结果结算、核心变更清单与验证结论。
