# Pi-Cordis 核心服务目录 (Core Services)

[English](README.md) | 中文

本目录包含支撑 Pi-Cordis 智能体内核的 10 大原生 Cordis 服务。每个服务全面践行 **DSH 架构的 5 大核心准则 (The 5 Pillars)**：

1. **能力接缝 (Capability Seam)**：强类型服务定义、解耦的 Provider 与消费者 API；
2. **可逆销毁 (Reversibility & Fiber Teardown)**：声明式注册，通过 `this.ctx.effect()` 返回注销句柄；
3. **响应式事件总线 (Reactive Event Bus)**：在 Cordis 上下文总线中广播完整的生命周期事件流；
4. **瀑布与串行拦截链 (Waterfall & Serial Interceptor Chains)**：工具调用前置校验、耗时统计与结果后置处理；
5. **作用域隔离 (Context Isolation)**：支持 `ctx.extend()` 子 Fiber 派生与零副作用边界。

---

## 10 大核心服务清单

| 服务名称 | 在 `ctx` 上的键 | 文件 | 功能描述 |
| :--- | :--- | :--- | :--- |
| **SettingsService** | `ctx.settings` | [`settings-service.ts`](./settings-service.ts) | 响应式全局与项目配置管理、热更新与 `pi/settings-updated` 事件广播。 |
| **AuthService** | `ctx.auth` | [`auth-service.ts`](./auth-service.ts) | 凭证读取、Provider API Key 存取与 `pi/auth-updated` 事件广播。 |
| **AIService** | `ctx.ai` | [`ai-service.ts`](./ai-service.ts) | 动态模型 Provider 注册与 Fiber 销毁句柄、模型切换与 `pi/model-change` 事件。 |
| **ToolRegistryService** | `ctx.tools` | [`tool-registry-service.ts`](./tool-registry-service.ts) | 内置与自定义工具注册、模型侧屏蔽过滤与 `executeTool` 拦截管道。 |
| **SessionService** | `ctx.session` | [`session-service.ts`](./session-service.ts) | 会话工厂与活跃追踪、内存会话与 `pi/session-created`/`forked`/`closed` 事件。 |
| **SkillsService** | `ctx.skills` | [`skills-service.ts`](./skills-service.ts) | 本地技能加载器、动态技能注册与 `pi/skill-registered` 事件。 |
| **PromptsService** | `ctx.prompts` | [`prompts-service.ts`](./prompts-service.ts) | 提示词模板加载器、动态模板注册与 `pi/prompt-registered` 事件。 |
| **ExtensionService** | `ctx.extensions` | [`extension-service.ts`](./extension-service.ts) | 扩展包加载器、工具/命令注册状态与 `pi/extension-loaded` 事件。 |
| **PackageManagerService** | `ctx.packageManager` | [`package-manager-service.ts`](./package-manager-service.ts) | 扩展包安装、卸载、更新与实时进度流 (`pi/package-progress`)。 |
| **AgentService** | `ctx.agent` | [`agent-service.ts`](./agent-service.ts) | AgentSession 创建与生命周期编排、轮次事件映射 (`pi/session-turn-start/end`)。 |

---

## 详细使用文档

各服务的详细使用方法与接口文档请参阅：
[`packages/coding-agent/docs/cordis/services/`](../../../../docs/cordis/services/README.zh.md)
