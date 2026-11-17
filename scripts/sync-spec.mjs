import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('docs/prd/spec.md', root), 'utf8');
const modules = [
  { id: 'baseline', prefix: 'B', name: '基线与兼容', english: 'BASELINE & CONTRACTS', short: '基线', icon: 'layers', description: '冻结原版组合，建立协议清单、样例与交叉联调基线。', emphasis: '先确认我们要兼容什么。' },
  { id: 'server', prefix: 'S', name: 'Go Server', english: 'CONTROL PLANE', short: 'Server', icon: 'server', description: '用 Gin＋GORM 实现认证、设备、会话、事件和 RPC 转发。', emphasis: '手机与插件填写的实验室服务地址。' },
  { id: 'connector', prefix: 'C', name: 'Go Connector', english: 'EXECUTION BRIDGE', short: 'Connector', icon: 'terminal', description: '重写运行时管理、DSH 桥接、本机控制、同步和文件终端。', emphasis: '与 DSH 处于同一个可访问本机桥接的执行环境。' },
  { id: 'deployment', prefix: 'D', name: '部署与质量', english: 'DELIVERY & RELIABILITY', short: '部署', icon: 'box', description: '独立 Docker 镜像、实验室网络、持久化和故障恢复验证。', emphasis: '真实手机可用，才算完成远程链路。' },
  { id: 'extension', prefix: 'E', name: 'MQ 学习增强', english: 'OPTIONAL EXTENSIONS', short: '增强', icon: 'queue', description: '用 RabbitMQ 演练统计聚合、Outbox、幂等与死信处理。', emphasis: '作为可选迭代，不阻塞 DSH 协议复刻。' },
];

const requirements = source.split(/\r?\n/).filter(line => /^\| [BSCDE]\d{2} \|/.test(line)).map(line => {
  const [id, phase, title, acceptance] = line.split('|').slice(1, -1).map(value => value.trim());
  const module = modules.find(item => item.prefix === id[0]).id;
  return { id, module, phase, title, acceptance, status: 'planned', optional: module === 'extension' };
});

if (requirements.length !== 61 || new Set(requirements.map(r => r.id)).size !== 61) {
  throw new Error('The specification must contain exactly 61 unique requirements.');
}

const data = {
  title: 'Agents Anywhere · Go Rewrite',
  version: 'PRD v1.0',
  updated: '2026-11-17',
  baseline: '98dd0e6',
  repository: 'https://github.com/YoungsGao/agents-anywhere-go',
  reference: 'https://youngsgao.github.io/pi-audit-harness/docs/prd/index.html#requirements',
  upstream: 'https://github.com/anywhere-labs/Agents-Anywhere',
  sourceSnapshot: 'https://github.com/anywhere-labs/Agents-Anywhere/tree/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008',
  modules,
  requirements,
  phases: [
    { id: 'M0', title: '建立兼容基线', label: '原版先跑通', description: '部署原版，固定配套版本，记录真实请求与事件；验证实验室网络、DSH 无头执行和 MeshCall Go 接入。', exit: '原版手机通过实验室地址完成真实远程操作；版本与协议覆盖清单明确。', deliverables: ['原版环境与版本矩阵', '接口、事件、错误与 fixtures 清单', 'DSH / MeshCall 接入验证结果'], dependency: '项目起点', pair: '原 Server ＋ 原 Connector' },
    { id: 'M1', title: 'Go Server 核心替换', label: 'Gin ＋ GORM', description: '实现手机与 DSH 所需的认证、授权、设备、会话、摄取和实时通道，使用独立 MySQL 与 Redis。', exit: '原版手机、插件和 Python Connector 可以使用 Go Server。', deliverables: ['Go Server 与版本化数据库迁移', '原版 Web / OAuth 路由复用', 'Server Docker 镜像'], dependency: 'M0 版本与协议基线', pair: 'Go Server ＋ 原 Connector' },
    { id: 'M2', title: 'Go Connector 核心替换', label: 'DSH 先行', description: '实现 CLI、服务器通道、Runtime Supervisor、MeshCall、本机发现、DSH 操作和增量同步。', exit: 'Go Connector 能连接原 Server，并由原插件发现和驱动 DSH。', deliverables: ['Go Connector 与本机状态兼容', 'MeshCall Control / Logs / Sync', 'Connector Docker 镜像'], dependency: 'M0 桥接可行性验证', pair: '原 Server ＋ Go Connector' },
    { id: 'M3', title: '全 Go DSH 可用版', label: '首个完整交付', description: '连接两个 Go 组件，补齐审批、附件、文件、Shell、PTY、计划、恢复和插件启动管理。', exit: '原版手机在实验室环境完成全部已声明支持的 DSH 操作，并通过重启恢复。', deliverables: ['全 Go DSH 远程链路', '实验室 Compose 与持久化', '真实手机与故障验收记录'], dependency: 'M1 ＋ M2 交叉联调', pair: 'Go Server ＋ Go Connector' },
    { id: 'M4', title: '基线全量复刻', label: '扩大兼容覆盖', description: '逐项补齐其他 Runtime / Profile、目标模式、模型渠道、管理统计、分享和目标平台适用能力。', exit: '冻结基线覆盖清单逐项完成，每项能力声明都有契约与运行验证。', deliverables: ['其他 Provider 与 ACP Profile', 'Plan / Goal 与剩余 Server API', '完整兼容矩阵与运维文档'], dependency: 'M3 DSH 稳定链路', pair: '冻结基线的适用功能' },
    { id: 'M5', title: 'MQ 学习增强', label: '可选迭代', description: '以统计聚合或附件后处理为业务入口，引入 RabbitMQ、Outbox、幂等、有限重试和死信处理。', exit: 'MQ 故障与重复投递可恢复，对外原版远程控制协议保持兼容。', deliverables: ['一种可验证的异步业务', 'Outbox / 幂等 / 死信处理', '故障注入与人工重放记录'], dependency: '协议复刻稳定后', pair: '不替换 Connector 控制通道', optional: true },
  ],
  boundaries: [
    { title: 'Server 与 Connector 都重写', text: 'Server 承接公网服务与持久化，Connector 承接工作设备上的 Runtime、本机操作与同步。两个程序分别验证、分别打包。' },
    { title: '保留原客户端与 DSH', text: '手机 App、Web、DSH Runtime 和插件 Bridge 业务继续复用；需要一键管理 Go Connector 时，仅调整启动器与打包层。' },
    { title: 'DSH 可用版 ≠ 全量复刻', text: 'M3 交付首条可用远程链路；M4 对齐所选基线其余适用功能。所有需求当前均为规划，阶段不代表研发进度。' },
  ],
  protocols: [
    { title: '客户端 ↔ Server', tag: 'HTTP / WebSocket', paths: ['/api/v2/auth/*', '/api/v2/oauth/*', '/api/v2/connectors', '/api/v2/sessions/*', '/api/v2/ws-ticket'], text: '兼容原路径、方法、认证、状态码、JSON 形状、分页、文件流和实时事件。Gin 的错误映射遵循原客户端约定。', ids: ['B02', 'S01', 'S03', 'S11'] },
    { title: 'Server ↔ Connector', tag: 'AUTH / INGEST / RPC', paths: ['/api/v2/connector/auth', '/api/v2/connector/ingest', '/api/v2/connector/ws'], text: '保留握手、请求与通知信封、request ID、错误、超时及 runtimeType / runtimeId 身份。旧连接的迟到响应不能覆盖新状态。', ids: ['S06', 'S07', 'C02', 'C03'] },
    { title: 'Connector ↔ DSH 插件', tag: 'LOCAL MESHCALL', paths: ['aa.local.v2.Control', 'aa.local.v2.Logs', 'aa.dsh.v2.Sync', 'aa.dsh.v2.Bridge'], text: '使用原版本机发现文件、socket / 命名管道、角色鉴权与流语义。SDK 与 Router 固定兼容版本，服务名与 metadata 保持一致。', ids: ['C05', 'C06', 'C09', 'C11'] },
    { title: '宿主 ↔ Connector', tag: 'CLI / FILE CONTRACT', paths: ['configure / start / rpc', 'connector.ready', 'connector-runtime.json', 'sync-state.json / kv.json'], text: '兼容 CLI 参数、就绪消息、退出码、配置、本机所有权和原子状态文件。GORM 不介入这些共享文件契约。', ids: ['C01', 'C07', 'C17', 'C22'] },
  ],
  failureCases: [
    { title: '重复消息与重复摄取', text: '相同 clientMessageId 和相同同步批次重复到达时，消息、Timeline 条目与 revision 符合基线去重语义。', ids: ['S10', 'C11'] },
    { title: '接受数据后再推进检查点', text: '服务端拒收、超时或暂时离线时，不保存覆盖这些数据的同步检查点，重连后可重发与校准。', ids: ['C11', 'C12'] },
    { title: '响应丢失与执行结果不明', text: '操作可能已送达 DSH 时，先读取原生状态和回执；修改操作不因网络超时盲目重发。', ids: ['S07', 'C17'] },
    { title: '单个坏会话的隔离', text: '一个损坏历史、超大快照或失败会话不阻塞其余会话；已同步历史不会被空快照错误覆盖。', ids: ['C12'] },
    { title: '重连与迟到响应', text: '旧连接、旧实例和过期租约失效后，迟到响应不覆盖新的连接与 Runtime 状态。', ids: ['S07', 'S19'] },
    { title: '双端审批竞争', text: '手机与 Web 同时回应相同审批时，按照 Runtime 当前 notice 和有效能力裁决，过期请求不生效。', ids: ['S12', 'S13'] },
    { title: '各进程分别重启', text: '分别重启 Server、Connector、DSH 与 Router，校准后历史、当前状态和检查点一致。', ids: ['C17', 'D05'] },
    { title: '容器重建与本机身份', text: '设备凭据、检查点、工作目录持久保存；遗留 PID 或 PID 复用不会造成错误接管。', ids: ['C07', 'D02', 'D04'] },
    { title: '文件与终端授权', text: '校验资源所属用户、路径根目录、符号链接、附件票据和终端权限，防止跨资源访问。', ids: ['S16', 'S17', 'C14'] },
    { title: '插件启动器冲突', text: '插件使用 Go Connector 或明确的外部管理模式后，不会再额外启动 Python Connector 抢占所有权。', ids: ['C22'] },
    { title: '慢消费者与积压', text: '限制 RPC 并发、同步积压、日志缓冲和终端输出；压力下仍可诊断并清理资源。', ids: ['C03', 'C08', 'D08'] },
    { title: '真实手机最终验收', text: '记录手机系统、App、DSH、插件、Go 后端和部署版本，实际完成登录、会话、审批、文件与恢复操作。', ids: ['B01', 'D09'] },
  ],
  sources: [
    { label: '上游源码快照', url: 'https://github.com/anywhere-labs/Agents-Anywhere/tree/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008' },
    { label: 'Server 架构', url: 'https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/docs/server-architecture.md' },
    { label: 'DSH Bridge 2.0', url: 'https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/contracts/dsh-bridge/2.0/README.md' },
    { label: '本机记录与启动协议', url: 'https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/contracts/local-machine/2.0/README.md' },
    { label: 'Runtime Control 2.1', url: 'https://github.com/anywhere-labs/Agents-Anywhere/blob/98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008/contracts/runtime-control/2.1/README.md' },
    { label: 'MeshCall Go SDK', url: 'https://github.com/t4wefan/meshcall/blob/main/meshcall-go/README.md' },
  ],
};

await writeFile(new URL('docs/prd/requirements.json', root), JSON.stringify(data, null, 2) + '\n');
console.log(`Synced ${requirements.length} requirements across ${modules.length} modules.`);
