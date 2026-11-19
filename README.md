# pi-audit-harness Connector 接入

本仓库维护 [pi-audit-harness](https://github.com/YoungsGao/pi-audit-harness) 接入 Agents Anywhere Connector 的需求。目标是让原版手机 App 和 Web 通过上游 Server、Connector 查看和控制 Windows 执行机上的既有审计任务。

- [在线需求](https://youngsgao.github.io/agents-anywhere-go/docs/prd/)
- [需求清单](https://youngsgao.github.io/agents-anywhere-go/docs/prd/#requirements)
- [完整 Markdown 方案](docs/prd/spec.md)

## 项目范围

- 复用上游 Server、Connector、设备配对、远程会话与重连机制。
- 验证 Connector 的 Runtime 扩展方式，并通过审计适配层调用 harness 已有的任务、授权、停止和恢复逻辑。
- 保留一份由 harness 管理的任务、快照、原始证据、人工复核和报告。使用固定样例对照桌面和远程执行结果。

## 实施阶段

| 阶段 | 目标 |
| --- | --- |
| M0 | 固定版本，验证 Runtime 发现和只读探测 |
| M1 | 接通本地业务服务，配对 Windows 执行机并读取现有任务 |
| M2 | 验证授权后启动、停止、按原任务恢复和事件补读 |
| M3 | 完成安装配置、隔离验证及原版手机、Web、桌面验收 |

## 本地预览

需要 Node.js 20 或更新版本。修改需求原文后运行下列命令。

```sh
npm run sync
npm test
npm run dev
```

本地地址为 `http://127.0.0.1:4173/docs/prd/`。GitHub Pages 从 `main` 分支根目录发布。
