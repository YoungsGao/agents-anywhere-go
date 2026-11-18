# Agents Anywhere Go 项目需求

PRD v1.1 · 2026-11-18 · 规划稿

## 目标与职责

用户通过原版手机或 Web 连接实验室服务，选择设备和 Agent，继续会话、查看输出、回复审批。Go 重构范围为 Server。执行侧新增 Python 编写的 Pi Connector；DSH、Codex、Claude 和其他已支持的 Connector / Provider 均直接复用上游版本。功能按冻结组合的实际能力验收。

| 维护对象 | 职责与技术 |
| --- | --- |
| Go Server | Gin 接 HTTP/WebSocket，Service 编排操作，GORM 与显式 SQL 访问 MySQL。独立 DTO 保留字段缺省、null、分页、错误及整数精度。 |
| Pi Python Connector | 在上游 Python Connector 框架中提供 Pi 专用接入与实验室配置，复用现有 PiProvider、ACP stdio 与设备通道。M0 记录可复用项与待补差异，M2 交付 Python 接入入口、依赖说明与集成验证。 |
| 其他执行端 | 直接安装冻结版本，沿用原启动器、插件、凭据、设备协议和同步文件。服务端兼容问题由 Go Server 处理。 |
| 实验室部署 | Docker Compose 运行 Server、MySQL 与所需 Redis。执行端部署在能访问 Agent 和工作目录的主机。可与 Server 同机，也可从个人工作站主动连接。 |

## 协议与数据

原手机 / Web → HTTPS / WSS → Go Server → 已认证设备连接 → Python Connector → 选定 Runtime。Pi 通过 Python ACP 客户端调用 Pi 适配器；DSH 使用原版 Bridge。数据库仅供 Server 使用。

保持客户端 API v2、设备认证/摄取/WebSocket、RPC 信封、Timeline、审批和恢复语义。MySQL 保存账号、设备、会话、Timeline 和回执，版本化 SQL 迁移处理唯一约束、时间精度和事务顺序。Redis 承担票据和跨实例协调。设备连接归属和当前审批状态分别由在线连接与 Runtime 确认。附件使用持久卷。原 Server 参考实例使用独立 PostgreSQL 数据库。

## 实施阶段

| 阶段 | 工作 | 验收出口 |
| --- | --- | --- |
| M0 原版基线 | 固定可用客户端和执行环境，记录续聊、新建、审批、断线的真实调用。 | 同一部手机连上原 Server，能操作原 Connector；记录 Pi 的依赖与基线差异。 |
| M1 Go Server 可用版 | 实现认证、会话、设备 RPC、Timeline、MySQL 迁移及 Docker 部署。 | 手机通过 Go Server 续聊、查看输出；重启后历史可读，重复摄取可验证。 |
| M2 Pi Python 接入 | 接入真实 Pi，在固定工作目录验证发现、创建、续聊、中断和事件回传。 | 原手机和 Web 可在 Go Server 选择 Pi；其他原版 Runtime 仍可照常使用。 |
| M3 工作区与故障恢复 | 补齐服务端文件、终端转发、附件和队列；验证重连、重启及恢复。 | 运行两个账号的隔离测试，重建容器并恢复一次真实会话。 |
| M4 服务端兼容覆盖 | 补齐冻结基线内的配置、计划与目标、管理统计和分享接口。 | 每项服务端支持声明有客户端或协议测试记录。 |
| M5 MQ 学习增强 | 为已存在的统计或附件任务增加 Outbox、RabbitMQ 和幂等消费。 | 重复投递与失败重试可恢复。 |

## 基线与兼容

| ID | 阶段 | 需求 | 验收标准 |
| --- | --- | --- | --- |
| B01 | M0 | 冻结实验室兼容组合 | 记录手机 OS/App 构建号、Web、Server、Python Connector、DSH 插件、Pi/ACP 依赖及执行机系统；原版链路各跑一次 |
| B02 | M0 | 建立协议覆盖清单 | 收录有效 HTTP 路由、WebSocket、RPC 方法、通知、Schema、错误码和调用方，注明来源与实现状态 |
| B03 | M0–M4 | 建立兼容 fixtures | 覆盖正常/失败响应、null/缺省、分页、ID、时间、整数精度与流事件；动态 token/时间按约定比较 |
| B04 | M0–M4 | 按执行场景交叉联调 | 对照原 Server 与 Go Server 使用独立数据库；分别记录上游 Connector 和 Pi Python 接入的版本、场景、结果和差异 |

## Go Server

| ID | 阶段 | 需求 | 验收标准 |
| --- | --- | --- | --- |
| S01 | M1 | HTTP 与健康入口 | 保留基线路径、方法、状态码、错误结构和健康响应；原插件服务探测通过 |
| S02 | M1 | 用户、登录与权限 | 完成基线登录/退出和必要管理员初始化；所有资源按用户权限校验，错误行为与原客户端兼容 |
| S03 | M1 | 插件 OAuth 授权 | 兼容授权页、state、PKCE、一次性授权码和回环回调；取消、过期、重复兑换有明确结果 |
| S04 | M1 | 手机登录/配对 | 实现基线手机登录、扫码/确认和过期流程；凭据不会被错误重复消费 |
| S05 | M1 | 设备与凭据管理 | 支持设备注册、复用、token 轮换/撤销、删除、偏好和设备设置；已有配对不会无故生成新设备 |
| S06 | M1 | Connector 接入通道 | 兼容 auth、ingest、ws、握手、心跳、通知、连接替换和待处理 RPC 清理 |
| S07 | M1 | RPC 转发与隔离 | 通过 request ID 关联响应；超时或单次调用失败不关闭其他正常请求；禁止跨用户设备操作 |
| S08 | M1–M3 | Runtime 管理 | 兼容发现、实例身份、配置校验、启动/停止、模型/权限目录、配置选择和命令目录；能力按实际状态返回 |
| S09 | M1 | 项目和会话 | 兼容列表、详情、分页、项目绑定、已读、归档、恢复和基线要求的批量操作 |
| S10 | M1–M3 | Timeline 摄取与排序 | 同一源条目重复上报不会产生重复；ID 和 revision 稳定；并发/重启后 seq 不复用，历史不被旧数据覆盖；MySQL 提交后丢 ACK，重传同一批次并重启，按游标补读与对照实例一致 |
| S11 | M1–M3 | 快照、实时事件与恢复 | 兼容 session/dashboard WebSocket、ticket、snapshot、events 游标及基线事件类型；断线补齐后顺序正确 |
| S12 | M1–M3 | RuntimeLive 与有效能力 | 当前状态、能力、notice、选择项从 Runtime 读取或按基线缓存降级；历史数据不冒充当前可执行状态 |
| S13 | M1–M3 | 审批与用户输入 | 转发批准、拒绝和输入，校验当前 notice 与权限；过期、重复和双端操作结果符合基线 |
| S14 | M3 | 会话消息队列 | 保留队列顺序、编辑、撤回、重试、立即发送、暂停/恢复等行为；派发状态不明按基线处理，不盲目重发 |
| S15 | M1–M4 | Runtime 工作流 | 兼容基线异步会话创建、恢复、配置切换及 operationId/switchRevision 等 fence 语义；按 M0 录制链路优先实现真机新建会话所调用的准备和创建接口 |
| S16 | M3 | 附件与文件服务 | 兼容上传/下载、预览、文件票据与传输流程；超大文件、取消、越权和失效票据有一致结果 |
| S17 | M3 | Shell 与终端转发 | 实现基线执行、后台任务与终端路由，保留流帧、退出状态、尺寸变更和连接生命周期 |
| S18 | M1–M4 | GORM/MySQL 持久化 | 核对所有适用模型、唯一约束、排序、JSON、时间与事务；使用版本迁移，MySQL 并发测试通过 |
| S19 | M1–M3 | Redis 协调 | 维护在线租约、连接所属实例、RPC 路由和短期票据；租约过期后旧实例不能继续作为有效所有者 |
| S20 | M3–M4 | Plan 与 Goal | 适用 Runtime 的计划文档、模式切换、审阅、目标状态和操作回执与基线兼容，旧 revision 不能覆盖新状态 |
| S21 | M3–M4 | 模型配置与渠道同步 | 兼容基线模型 profile、实例分配、连接测试、切换/恢复、相关链接与回调；响应不泄露密钥 |
| S22 | M4 | 管理、统计、分享和公告 | 覆盖冻结基线中适用的管理员、使用统计、会话分享、实例设置与公告接口，原页面可正常使用 |
| S23 | M1–M4 | 原 Web 与公开地址 | 同源 Web/API 和插件登录路由可用，反向代理后 origin、回调、CORS、文件及 WebSocket 地址正确 |
| S24 | M1 | 发送、流式回复与中断 | 原手机向已有会话发消息，观察流式输出并中断；已下发但应答丢失时核对状态，避免重复执行 |

## Pi Python Connector

| ID | 阶段 | 需求 | 验收标准 |
| --- | --- | --- | --- |
| P01 | M0–M2 | Pi Python Connector 交付边界 | 在 Python 中实现 Pi 专用接入，复用上游设备认证、心跳、RPC、摄取及 PiProvider/ACP 能力；列出自有模块、上游依赖版本及启动入口 |
| P02 | M2 | Pi 实例注册与配置 | 原客户端识别 runtimeType=pi，按实例区分 runtimeId；在固定工作目录发现 Pi，依赖或凭据缺失返回明确原因，日志隐藏密钥 |
| P03 | M2 | Pi 会话执行 | 通过真实 Pi 创建及续聊会话、回传流式事件、按实际能力中断；手机重开后能读取同一会话历史 |
| P04 | M2 | Pi 能力与交互 | 按实例报告支持的能力；对于支持的输入或审批，答复交给对应会话，失效请求可识别；不支持的操作在客户端保持不可用 |
| P05 | M2–M3 | Pi 断线与检查点 | 提交后丢失 ACK 可安全重传；断开执行机网络再恢复，已接收事件可补读，未知结果的操作先核对，避免重复启动回合 |
| P06 | M2–M3 | Pi 与其他 Runtime 共存 | 同一账号下分别选择 Pi 和未经修改的 DSH 或 Codex 创建会话；设备身份、项目目录、消息和凭据互不串用 |

## 实验室部署与质量

| ID | 阶段 | 需求 | 验收标准 |
| --- | --- | --- | --- |
| D01 | M1–M2 | 实验室 Docker Compose | 构建 Go Server 镜像并固定 MySQL 与执行端依赖；全新环境按文档启动后原手机可访问 Server，Pi 依赖在执行机可用 |
| D02 | M0–M2 | 验证执行环境 | 实验室或个人工作站的原 Connector 能访问项目目录和对应 Runtime；在指定目录完成 DSH 与 Pi 实测，记录各自拓扑 |
| D03 | M1–M3 | HTTPS 与反向代理 | 手机和执行设备能访问实验室域名；WebSocket Upgrade、长连接、上传限制和 OAuth origin 配置通过实测 |
| D04 | M1–M3 | 持久化和秘密配置 | MySQL、文件、Connector 状态和 DSH 数据有明确卷；重建容器不丢绑定/检查点；凭据不写入镜像 |
| D05 | M1–M3 | 服务生命周期 | 分别中断 Server、网络及执行进程；健康检查、连接替换、待处理 RPC 清理和恢复后的能力状态可观察 |
| D06 | M1–M3 | 日志和指标 | 能按 connectorId/runtimeId/sessionId/requestId 定位问题；记录连接、RPC 延迟、同步积压和错误，默认不记录敏感正文 |
| D07 | M1–M4 | 备份与恢复 | 恢复 MySQL、文件和 Connector 状态后能继续使用；升级和回退使用匹配的数据/schema，不混写两个实现的数据库；首次承载真实实验室数据前演练一次卷恢复 |
| D08 | M2–M4 | 故障与压力验证 | 注入网络、进程、MySQL、Redis、重复事件和慢消费者故障；无无限增长队列、重复副作用或伪成功状态 |
| D09 | M1–M4 | 自动化兼容验证 | Schema/fixture、HTTP/WS/MeshCall 集成、真实 MySQL、并发检查和原版手机 E2E 各有记录；仅 mock 通过不能认定远程可用 |

## 可选 MQ 增强

| ID | 阶段 | 需求 | 验收标准 |
| --- | --- | --- | --- |
| E01 | M5 | 使用统计异步聚合 | MySQL Outbox 投递 RabbitMQ，消费者按 eventId 幂等更新聚合结果；MQ 重启和重复投递后结果正确 |
| E02 | M5 | 附件后处理或归档 | 为缩略图/归档选择一种真实任务，加入有限重试、死信和人工重放；不改变原版远程控制协议 |

## 联调验收

| 阶段 | 组合 | 证据 |
| --- | --- | --- |
| M0 | 原 Server + 原 Connector | 录制原手机和 Web 的调用与恢复样例，保存脱敏后的请求和事件。 |
| M1 | Go Server + 原 Connector | 同场景比较历史、登录、权限、续聊、流式输出与重启后的游标。 |
| M2 | Go Server + Python Pi Connector | 实机执行 Pi 任务，保留实例身份、会话 ID、输出、退出和恢复记录。 |
| M3–M4 | Go Server + Pi 与其他原版执行端 | 验证共存、丢 ACK、迟到响应、双端审批、越权与数据库恢复。 |

原版手机构建、上游提交、容器版本和验证日期随结果一起保存。规划阶段的需求统一标为待实现。

## 来源

- [Agents Anywhere 源码快照](https://github.com/anywhere-labs/Agents-Anywhere/tree/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008)
- [Connector README](https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/connector/README.md)
- [Server Architecture](https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/docs/server-architecture.md)
- [API 索引](https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/docs/api/README.md)
- [实时 API](https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/docs/api/realtime.md)
- [DSH Bridge 2.0](https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/contracts/dsh-bridge/2.0/README.md)
- [本机 Connector 记录 v2](https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/contracts/local-machine/2.0/README.md)
- [Runtime Control 2.1](https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/contracts/runtime-control/2.1/README.md)
- [上游 Python ACP 与 Pi 实现](https://github.com/anywhere-labs/Agents-Anywhere/blob/856026d/docs/runtime-protocol/acp-runtime-implementation.md)
