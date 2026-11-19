import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('docs/prd/spec.md', root), 'utf8');
const lines = source.split(/\r?\n/);
const [, version, updated] = source.match(/^(PRD v\d+\.\d+) · (\d{4}-\d{2}-\d{2})/m);
const repository = 'https://github.com/YoungsGao/agents-anywhere-go';
const target = 'https://github.com/YoungsGao/pi-audit-harness';
const targetSnapshot = '23a0e964128ba199211b4dd6c446acdac6e24a55';
const upstream = 'https://github.com/anywhere-labs/Agents-Anywhere';
const snapshot = '98dd0e6e5ddc1c5d1b35e1aaea6b5d00bdfd7008';
const upstreamFiles = upstream + '/blob/' + snapshot;

const modules = [
  {
    id: 'baseline', prefix: 'B', name: '基线与契约', english: 'BASELINE & CONTRACTS',
    icon: 'layers', description: '固定版本、扩展接口和可对照的审计样例。',
    emphasis: '验证请求进入 harness 已有业务服务。'
  },
  {
    id: 'connector', prefix: 'C', name: 'Connector 接入', english: 'CONNECTOR INTEGRATION',
    icon: 'network', description: '复用上游设备通道，映射审计实例、任务和事件。',
    emphasis: '设备和会话身份在重连前后保持可追踪。'
  },
  {
    id: 'harness', prefix: 'P', name: '审计工作流', english: 'AUDIT WORKFLOW',
    icon: 'terminal', description: '用现有授权、任务、预算、恢复和复核逻辑执行审计。',
    emphasis: '桌面和远程端共享同一个本地审计任务。'
  },
  {
    id: 'deployment', prefix: 'D', name: '部署与验收', english: 'DEPLOYMENT & VALIDATION',
    icon: 'box', description: '验证 Windows 执行环境、隔离、故障和真实设备。',
    emphasis: '使用公开或合成样例进行端到端对照。'
  }
];

const phaseDetails = {
  M0: { label: '现状与契约', deliverables: ['版本与接口基线', 'Runtime 发现和只读探测'], dependency: '项目起点' },
  M1: { label: '本机接通', deliverables: ['Connector 配对', '桌面任务与远程会话映射'], dependency: 'M0 阶段出口' },
  M2: { label: '远程任务', deliverables: ['受授权启动与停止', '同一任务恢复和事件回放'], dependency: 'M1 阶段出口' },
  M3: { label: '交付验收', deliverables: ['安装与配置说明', '手机、Web 和桌面对照记录'], dependency: 'M2 阶段出口' }
};

const fields = line => line.split('|').slice(1, -1).map(value => value.trim());
const requirements = lines.filter(line => /^\| [BCPD]\d{2} \|/.test(line)).map(line => {
  const [id, phase, title, acceptance] = fields(line);
  const module = modules.find(item => item.prefix === id[0]).id;
  return { id, module, phase, title, acceptance, status: 'planned' };
});
if (!requirements.length || new Set(requirements.map(r => r.id)).size !== requirements.length) {
  throw new Error('The specification must contain unique requirement IDs.');
}

const phases = lines.filter(line => /^\| M\d /.test(line)).map(line => {
  const [heading, description, exit] = fields(line);
  const [id, ...words] = heading.split(' ');
  return { id, title: words.join(' '), description, exit, ...phaseDetails[id] };
});

const data = {
  title: 'pi-audit-harness Connector 接入需求',
  version, updated, baseline: snapshot.slice(0, 7), repository, target, upstream,
  sourceSnapshot: upstream + '/tree/' + snapshot,
  modules, requirements, phases,
  boundaries: [
    { title: '上游通道', text: '使用原版 App、Web、Server 和 Connector 完成登录、配对、发现、RPC 与实时传输。' },
    { title: '审计适配', text: '验证 Runtime 扩展入口，映射审计任务、能力、控制操作和经授权可同步的事件。' },
    { title: '现有业务服务', text: 'pi-audit-harness 管理快照、发送授权、任务、预算、原始证据、复核和报告。' }
  ],
  protocols: [
    {
      title: '原版客户端 ↔ 上游 Server', tag: 'HTTP / WebSocket',
      paths: ['/api/v2/connectors', '/api/v2/sessions/*', '/api/v2/ws-ticket'],
      text: '用原版 App 与 Web 检验设备发现、任务状态和会话重连。',
      ids: ['B01', 'C01', 'D02']
    },
    {
      title: '上游 Server ↔ Connector', tag: 'AUTH / INGEST / RPC',
      paths: ['/api/v2/connector/auth', '/api/v2/connector/ingest', '/api/v2/connector/ws'],
      text: '复用登录、设备身份、请求信封和重连。核对允许远程执行的 Runtime 能力。',
      ids: ['B02', 'C02', 'C03']
    },
    {
      title: '审计适配层 ↔ harness', tag: 'LOCAL SERVICE / EVENTS',
      paths: ['RuntimeProvider', '任务 API', '持久化事件'],
      text: '复用现有业务授权和任务生命周期，建立可对照的本地任务与远程会话映射。',
      ids: ['C04', 'C05', 'P01', 'P02']
    }
  ],
  failureCases: [
    { title: '授权缺失或变化', text: '提示桌面确认，确认前的模型调用计数为零。', ids: ['P02', 'D04'] },
    { title: '重复请求', text: '按原任务身份和请求标识校验结果，连续重试及双端操作只启动一次。', ids: ['C03', 'P05'] },
    { title: '重连与事件补读', text: '重新连接后查询原任务，按游标恢复允许同步的状态和事件。', ids: ['P04', 'D03'] },
    { title: '本地服务退出', text: '手机显示真实离线或故障状态。服务恢复后核对快照、预算和结果。', ids: ['P03', 'D01', 'D03'] },
    { title: '无权限设备与未授权内容', text: '按任务授权校验访问，凭据及未授权源码和原始证据留在执行机。', ids: ['C01', 'C05', 'D04'] }
  ],
  sources: [
    { label: 'pi-audit-harness 项目', url: target },
    { label: '本地业务服务', url: target + '/blob/' + targetSnapshot + '/desktop/src/service/http-server.ts' },
    { label: 'Pi SDK 会话入口', url: target + '/blob/' + targetSnapshot + '/desktop/src/service/pi-session-factory.ts' },
    { label: '上游 Connector', url: upstreamFiles + '/connector/README.md' },
    { label: '上游 Runtime 扩展', url: upstreamFiles + '/connector/connector/runtimes/acp/README.md' }
  ]
};

await writeFile(new URL('docs/prd/requirements.json', root), JSON.stringify(data, null, 2) + '\n');
console.log('Synced ' + requirements.length + ' requirements across ' + modules.length + ' modules.');
