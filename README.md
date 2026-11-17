# Agents Anywhere Go

兼容 [Agents Anywhere](https://github.com/anywhere-labs/Agents-Anywhere) 原版协议，使用 Go 分阶段重写 Server 与 Connector。

**当前交付为产品需求与技术方案网站。Go Server 和 Go Connector 尚未实现。** 页面中的 M0–M5 是实施安排，不是研发进度。

- [在线 PRD](https://youngsgao.github.io/agents-anywhere-go/docs/prd/)
- [61 项需求清单](https://youngsgao.github.io/agents-anywhere-go/docs/prd/#requirements)
- [完整 Markdown 方案](docs/prd/spec.md)

## 目标

- Go Server：Gin＋GORM＋MySQL＋Redis，兼容认证、设备、会话、Timeline、RPC 和实时通道。
- Go Connector：Go＋MeshCall，复刻 Runtime 管理、DSH 桥接、本机控制、文件、Shell、PTY 与同步恢复。
- 复用原版手机 App、Web、DSH Runtime 与插件 Bridge；按需调整插件启动器。
- Server / Connector 分别提供 Docker 镜像，在实验室部署并使用真实手机验收。

手机和插件填写的是 Server 地址。Connector 需要与 DSH 处于可访问本机桥接的执行环境；服务器里的 Connector 不能通过本机 socket 直接控制另一台电脑上的 DSH。

## 文档网站

静态 HTML、CSS 和 JavaScript，无需安装依赖或构建。61 项需求由原始方案生成，支持关键词搜索、模块/阶段组合筛选、详情面板和需求独立链接。

需要 Node.js 20 或更新版本运行本地开发工具：

```sh
npm run dev
npm test
```

默认本地地址：`http://127.0.0.1:4173/docs/prd/`。

更新内容时修改 `docs/prd/spec.md` 和 `scripts/sync-spec.mjs` 中的展示元数据，再执行：

```sh
npm run sync
npm test
```

GitHub Pages 使用 `main` 分支根目录发布，`.nojekyll` 保留 ES module 与静态数据。所有资源均为相对路径，不依赖外部字体、CDN 或 API。

## 实施阶段

| 阶段 | 交付目标 |
| --- | --- |
| M0 | 原版基线、配套版本、契约与桥接验证 |
| M1 | Go Server＋原版 Connector |
| M2 | 原版 Server＋Go Connector |
| M3 | 全 Go DSH 可用版与实验室 Docker 部署 |
| M4 | 冻结基线的其余适用能力 |
| M5 | 可选 MQ 学习增强 |

完整规划见 [spec.md](docs/prd/spec.md)。

## 来源

上游分析快照：`98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008`。实际开发需先锁定与手机 App、DSH 和插件配套的版本。

展示形式参考 [pi-audit-harness PRD](https://youngsgao.github.io/pi-audit-harness/docs/prd/index.html#requirements)。本仓库页面代码独立实现，未复制参考项目源码；当前不包含上游 Python 实现。
