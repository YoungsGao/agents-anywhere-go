# pi-audit-harness Connector 接入需求

PRD v1.3 · 2026-11-19 · 规划稿

## 目标

让原版 Agents Anywhere 手机 App 和 Web 通过上游 Connector 查看、启动及停止 Windows 执行机上的 `pi-audit-harness` 防御性源码审计任务。桌面应用继续负责项目导入、审计配置、发送范围授权、原始证据、人工复核和报告导出。首轮验收使用上游 Server 和原版客户端。

## 接入边界

| 组件 | 职责 |
| --- | --- |
| Agents Anywhere App / Web / Server | 登录、设备配对、远程入口、会话控制、状态展示及连接恢复。 |
| 上游 Connector | 复用设备协议、认证、RPC、摄取、心跳和重连。通过可验证的 Runtime 扩展入口将请求转给审计适配层。 |
| 审计适配层 | 连接上游 Runtime 契约和 harness 已有业务入口，映射任务、能力、受控命令及允许同步的事件。扩展方式以 M0 的版本兼容验证为准。 |
| pi-audit-harness | 使用其现有 Pi SDK、模型配置、授权、任务队列、预算、SQLite、事件和报告，作为审计任务的事实来源。 |

上游 PiProvider 面向通用 Pi Agent 会话。项目需要验证 Connector 发起的请求确实进入 harness 的任务生命周期，并能在桌面工作台查到同一个任务。当前参考的 harness 源码使用嵌入式 Pi SDK 与本地业务服务，具体扩展接口以冻结源码和联调结果为准。

`原版 App / Web → 上游 Server ↔ 上游 Connector → 审计适配层 → pi-audit-harness 本地服务`

Connector 与 harness 在可访问该工作区的同一 Windows 执行机运行。服务端负责远程通道，业务数据和模型凭据由 harness 保存。首轮使用公开或合成样例验证编码后的状态与事件。额外的源码、证据或附件共享按用户授权范围验收。

## 实施阶段

| 阶段 | 工作 | 验收出口 |
| --- | --- | --- |
| M0 现状与接口基线 | 固定两端版本，核对 harness 的运行和授权入口，验证上游 Runtime 扩展方式 | 本地审计基线可复现，Connector 能发现测试实例并通过一次只读状态探测 |
| M1 本机适配与配对 | 接通 Windows 本地服务，完成配对、任务身份映射、能力与状态同步 | 手机与 Web 发现 harness 实例，可读取准备好的测试任务及进度 |
| M2 远程审计与恢复 | 接入授权后启动、停止、受控恢复和事件回放 | 手机发起一个本地预授权样例，桌面看到同一任务，断网后按原进度补读 |
| M3 真机与部署验收 | 验证安装配置、隔离、审计报告一致性与桌面回归 | 原版手机和 Web 通过端到端测试，交付可复现的安装配置说明和脱敏记录 |

## 基线与契约

| ID | 阶段 | 需求 | 验收标准 |
| --- | --- | --- | --- |
| B01 | M0 | 冻结上游与 harness 组合 | 记录两端提交、Windows、Node、Pi SDK、Connector 依赖、手机 App 与 Web 版本，保留一条原版连接基线 |
| B02 | M0–M1 | 核对 Runtime 扩展和本地业务接口 | 验证冻结版 Connector 能加载适配层，可发现实例并执行只读状态查询。记录实际 Runtime、RPC、任务和事件契约 |
| B03 | M0–M3 | 建立兼容样例 | 保存脱敏的发现、任务、事件和错误样例，覆盖字段缺省、重复事件、权限失败、断线与恢复 |
| B04 | M0–M3 | 固定同一审计样例作对照 | 用同一公开或合成快照比较桌面直接运行和 Connector 发起的结果，记录任务 ID、状态、过程事件、人工复核与报告的一致性 |

## Connector 接入

| ID | 阶段 | 需求 | 验收标准 |
| --- | --- | --- | --- |
| C01 | M1 | 沿用上游配对及设备凭据 | 原版 App 和 Web 可见已配对的 Windows 执行机，重复启动沿用设备身份，撤销凭据后执行权限及时失效 |
| C02 | M0–M1 | 暴露可辨识的审计 Runtime 实例 | 原版客户端可按稳定实例标识识别 pi-audit-harness；实例重启后身份保持一致，并与通用 Pi Runtime 区分 |
| C03 | M1–M2 | 复用 Runtime 控制通道 | 支持状态查询和已授权的审计操作。超时、重复请求、离线和不支持的操作有明确结果，能够按 request ID 对照 |
| C04 | M1–M2 | 映射稳定的远程会话 | 每条远程会话关联唯一的本地项目、快照与任务，重复打开和重连仍关联原任务 |
| C05 | M1–M3 | 转发经授权的任务状态与事件 | 手机和 Web 能看到任务进度、阶段和可操作状态。通过版本化映射同步必要摘要，原始审计记录继续在 harness 内复核 |

## 审计工作流

| ID | 阶段 | 需求 | 验收标准 |
| --- | --- | --- | --- |
| P01 | M1–M2 | 调用现有审计任务入口 | 远程启动固定样例后，桌面出现同一 runId，并使用相同快照、模板、模型配置和审计逻辑 |
| P02 | M2 | 启动前检查本地发送授权 | 远程只能启动已准备且已有适用授权的任务。授权缺失或范围变化时明确提示桌面确认，确认前模型调用计数为零 |
| P03 | M2 | 保留现有预算和停止语义 | 手机停止可达本地任务并保留已提交结果。预算耗尽、失败及用户停止分别呈现真实状态 |
| P04 | M2–M3 | 恢复原任务和事件 | 相同 runId 的任务可按现有恢复条件继续。断线后的事件按游标补读，进度、累计预算和报告关联保留 |
| P05 | M2–M3 | 防止重复启动和结果串用 | 重试或双端同时操作同一请求只启动一次；不同设备、项目、快照及任务之间隔离数据和操作 |
| P06 | M2–M3 | 保留报告与人工复核入口 | 桌面能定位远程任务的已有证据、独立人工复核结论和报告，原版客户端显示获准的状态和摘要 |

## 部署与验收

| ID | 阶段 | 需求 | 验收标准 |
| --- | --- | --- | --- |
| D01 | M1–M3 | 安装和配置 Windows 执行机 | 两个组件按固定版本安装，Connector 通过受认证的本地接口访问 harness。退出、重启和凭据失效的行为可复核 |
| D02 | M2–M3 | 真机与 Web 端到端回归 | 使用固定样例完成配对、查看、授权后启动、停止或恢复，并用桌面直接运行结果作对照 |
| D03 | M2–M3 | 故障验证 | 分别中断手机网络、Connector 和本地服务，核对任务状态、游标、数据持久化和重复操作结果 |
| D04 | M1–M3 | 资源与权限隔离 | 验证无权限设备、未授权任务和无关文件无法访问。沿用 harness 的只读取证和发送范围设置，凭据与未授权内容留在执行机 |
| D05 | M3 | 交付运行记录和配置说明 | 提供安装、配对、状态诊断、退出和恢复文档。记录版本、执行拓扑、验收结果和已知限制 |

## 需求来源

- [pi-audit-harness 入口与现有能力](https://github.com/YoungsGao/pi-audit-harness)
- [harness 本地业务服务](https://github.com/YoungsGao/pi-audit-harness/blob/23a0e964128ba199211b4dd6c446acdac6e24a55/desktop/src/service/http-server.ts)
- [harness Pi SDK 会话入口](https://github.com/YoungsGao/pi-audit-harness/blob/23a0e964128ba199211b4dd6c446acdac6e24a55/desktop/src/service/pi-session-factory.ts)
- [上游 Connector 使用说明](https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/connector/README.md)
- [上游 ACP 与 Runtime 扩展](https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/connector/connector/runtimes/acp/README.md)
