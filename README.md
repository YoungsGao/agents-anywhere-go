# Agents Anywhere Go

用 Go 重构 Server，使用 MySQL 持久化并通过 Docker Compose 部署到实验室。Pi Connector 使用 Python，其余 Connector 直接复用上游版本。当前交付为项目需求与验收方案。

- [在线 PRD](https://youngsgao.github.io/agents-anywhere-go/docs/prd/)
- [需求清单](https://youngsgao.github.io/agents-anywhere-go/docs/prd/#requirements)
- [完整 Markdown 方案](docs/prd/spec.md)

## 文档网站

静态 HTML、CSS 和 JavaScript，无需安装依赖或构建。各项需求由原始方案生成，支持关键词搜索、模块/阶段组合筛选、详情面板和需求独立链接。

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

- M0 · 原版基线。同一部手机连上原 Server，能操作原 Connector；记录 Pi 的依赖与基线差异。
- M1 · Go Server 可用版。手机通过 Go Server 续聊、查看输出；重启后历史可读，重复摄取可验证。
- M2 · Pi Python 接入。原手机和 Web 可在 Go Server 选择 Pi；其他原版 Runtime 仍可照常使用。
- M3 · 工作区与故障恢复。运行两个账号的隔离测试，重建容器并恢复一次真实会话。
- M4 · 服务端兼容覆盖。每项服务端支持声明有客户端或协议测试记录。
- M5 · MQ 学习增强。重复投递与失败重试可恢复。
