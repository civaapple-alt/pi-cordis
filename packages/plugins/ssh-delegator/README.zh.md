# @pi-cordis/plugin-ssh-delegator

[English](README.md) | 中文

原生 Cordis 远程 SSH 执行与容器委派插件。提供 `ssh_exec` 工具，具备连接配置管理、执行延迟测量与远端 Linux/Docker 环境命令代理能力。

## 工具

### `ssh_exec`

接受参数：
- `command` (string, 必填)：在远程服务器上执行的 Shell 命令。
- `host` (string, 可选)：远程主机域名或 IP 地址（缺省时使用插件配置）。
- `user` (string, 可选)：远程登录用户名（缺省时使用插件配置）。
- `port` (number, 可选)：远程 SSH 端口（默认：`22`）。

返回值：
- `success` (boolean)：执行结果状态。
- `target` (string)：目标远程地址（`user@host`）。
- `command` (string)：已执行的命令。
- `stdout` (string)：标准输出。
- `stderr` (string, 可选)：标准错误输出。
- `exitCode` (number)：退出码。
- `latencyMs` (number)：执行耗时（毫秒）。

## 配置选项

- `defaultHost` (string, 默认 `'localhost'`)：默认远程主机。
- `defaultUser` (string, 默认 `'root'`)：默认远程用户。
- `defaultPort` (number, 默认 `22`)：默认 SSH 端口。
- `timeoutMs` (number, 默认 `30000`)：远程命令超时时间。

## 模型体验
- **跨机运维能力**：赋能智能体在远端测试机或容器集群中无缝执行部署与回归测试；
- **耗时透明度**：精确测量并回传远端往返耗时，方便定位网络与执行瓶颈。
