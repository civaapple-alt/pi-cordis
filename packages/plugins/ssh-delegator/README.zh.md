# @pi-cordis/plugin-ssh-delegator

[English](README.md) | 中文

原生 Cordis 远程 SSH 执行与容器代理插件。注册 `ssh_exec` 工具，将 Shell 命令与文件探查委托至远程 SSH 服务器或 Docker 容器环境中执行。

## 工具

### `ssh_exec`

接受参数：
- `command` (string, 必填)：在目标远程主机上执行的 Shell 命令。
- `host` (string, 可选)：远程主机域名或 IP 地址（缺省时使用插件配置）。
- `user` (string, 可选)：远程登录用户名（缺省时使用插件配置）。

返回值：
- `success` (boolean)：远程执行状态。
- `target` (string)：实际连接目标标识（`user@host`）。
- `command` (string)：实际执行的命令。
- `stdout` (string)：捕获的远程终端输出。
- `exitCode` (number)：远程进程退出状态码。

## 模型体验
- **远程环境协同**：支持在 Pi 中直接探查云端服务器日志、在远程测试机中运行集成测试。
- **可配置缺省连接**：在 `cordis.yml` 中配置默认的主机与用户名，简化参数调用。
