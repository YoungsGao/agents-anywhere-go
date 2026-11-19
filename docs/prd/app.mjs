import { escapeHtml as h, filterRequirements, includesPhase, parseRoute } from './core.mjs';

const paths = {
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  external: '<path d="M14 4h6v6m0-6L10 14M20 14v6H4V4h6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  server: '<rect x="4" y="3" width="16" height="7" rx="2"/><rect x="4" y="14" width="16" height="7" rx="2"/><path d="M8 6.5h.01M8 17.5h.01M12 6.5h5M12 17.5h5"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3m6 0h4"/>',
  box: '<path d="m12 3 9 5v8l-9 5-9-5V8l9-5Zm0 10v8M3 8l9 5 9-5M7.5 5.5l9 5"/>',
  queue: '<path d="M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01"/>',
  file: '<path d="M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 12h8M8 16h6"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  shield: '<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Zm-4 9 3 3 5-5"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>',
  network: '<rect x="8" y="2" width="8" height="6" rx="1"/><rect x="2" y="16" width="8" height="6" rx="1"/><rect x="14" y="16" width="8" height="6" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>',
};

const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.file}</svg>`;
const labels = { overview: '项目总览', requirements: '需求清单', architecture: '架构与协议', roadmap: '迭代计划', acceptance: '验收标准' };
const state = { view: 'overview', module: 'all', phase: 'all', query: '', deployment: 'lab' };
const content = document.querySelector('#content');
const search = document.querySelector('#global-search');
const dialog = document.querySelector('#requirement-dialog');
let data;
let lastRequirement = null;
let toastTimer;

const badge = (text, color = '') => `<span class="badge ${color}">${h(text)}</span>`;
const requirementLink = (id, label = id) => `<button type="button" data-requirement="${h(id)}" title="${h(data.requirements.find(r => r.id === id)?.title || id)}">${h(label)}</button>`;
const moduleFor = id => data.modules.find(module => module.id === id);
const moduleCount = id => data.requirements.filter(requirement => requirement.module === id).length;
const requirementStatus = requirement => {
  return requirement.module === 'baseline' || requirement.module === 'deployment' ? '待验证' : '待接入';
};

function heading(eyebrow, title, description, download = true) {
  return `<div class="page-heading"><div><div class="eyebrow">DOCS <span class="slash">/</span> ${eyebrow} <span class="slash">/</span> ${h(data.version.replace('PRD ', '').toUpperCase())}</div><h1>${title}</h1><p>${description}</p></div><div class="heading-actions">${badge('规划稿', 'soft')}${download ? `<a class="btn ghost" href="./spec.md" download="pi-audit-harness-connector-prd.md">${icon('download')}完整方案</a>` : ''}</div></div>`;
}

function overview() {
  return `${heading('PROJECT OVERVIEW', '为 pi-audit-harness 接入 Connector', '通过 Agents Anywhere 原版手机和 Web 操作 Windows 执行机上的已有审计任务。')}
    <section class="panel intro-panel" aria-label="项目定位"><div><div class="panel-title">PI AUDIT HARNESS · CONNECTOR INTEGRATION</div><h2 class="intro-title">用 <em>Connector</em> 接通现有审计任务</h2><p>上游 Server 和 Connector 提供远程通道。审计适配层调用 harness 已有的授权、任务和恢复入口。</p><div class="tech-tags">${['Windows', 'Connector', 'Pi SDK', 'SQLite', 'WebSocket'].map(tag => `<span>${tag}</span>`).join('')}</div><div class="intro-actions"><a class="btn primary" href="#requirements">浏览 ${data.requirements.length} 项需求 ${icon('arrow')}</a><a class="btn ghost" href="${h(data.repository)}" target="_blank" rel="noopener noreferrer">GitHub 仓库 ${icon('external')}</a></div></div><div class="scope-box"><div class="scope-line"><span class="scope-num">01</span><div><strong>配对 Windows 执行机</strong><small>原版 App 和 Web 使用上游 Server</small></div></div><div class="scope-line"><span class="scope-num">02</span><div><strong>连接审计业务入口</strong><small>关联本地任务与远程会话</small></div></div><div class="scope-line"><span class="scope-num">03</span><div><strong>验证授权、停止和恢复</strong><small>用同一样例对照桌面和手机</small></div></div></div></section>
    <div class="stat-grid"><div class="panel stat-card"><span>需求总数<small>四个模块</small></span><strong>${data.requirements.length}<span class="stat-symbol">项</span></strong></div><div class="panel stat-card"><span>Connector 接入<small>设备和会话</small></span><strong>${moduleCount('connector')}<span class="stat-symbol">项</span></strong></div><div class="panel stat-card"><span>审计工作流<small>现有任务与授权</small></span><strong>${moduleCount('harness')}<span class="stat-symbol">项</span></strong></div><div class="panel stat-card"><span>实施阶段<small>M0–M3</small></span><strong>${data.phases.length}<span class="stat-symbol">阶段</span></strong></div></div>
    <div class="section-heading"><h2>按职责阅读需求</h2><a href="#requirements">查看完整清单 ${icon('arrow')}</a></div><div class="module-grid">${data.modules.map((module, index) => `<button type="button" class="panel module-card" data-module="${module.id}"><div class="module-top">${icon(module.icon)}<span class="module-number">0${index + 1} / ${module.english}</span></div><h3>${module.name}</h3><p>${module.description}</p><div class="module-bottom"><span>${moduleCount(module.id)} 项需求</span>${icon('arrow')}</div></button>`).join('')}<div class="panel module-doc">${icon('file')}<h3>下载接入需求</h3><p>每项需求保留原始编号、实施阶段和验收标准，可通过独立链接分享。</p><a class="btn ghost" href="./spec.md" download="pi-audit-harness-connector-prd.md">下载原始方案 ${icon('download')}</a></div></div>
    <div class="section-heading"><h2>项目边界</h2><span class="dim" style="font-size:10px">设计已明确 · 实现按阶段推进</span></div><div class="three-col">${data.boundaries.map((boundary, index) => `<article class="panel text-card"><div class="panel-title">BOUNDARY / 0${index + 1}</div><h3>${boundary.title}</h3><p>${boundary.text}</p></article>`).join('')}</div>
    <div class="note-strip">${icon('info')}<div><strong>阶段用于组织接入与验收。</strong> 参考上游源码快照 <code>${data.baseline}</code>，M0 核定实际 App、Connector 与 harness 的配套版本。</div></div>`;
}

function requirements() {
  const results = filterRequirements(data.requirements, state);
  return `${heading('REQUIREMENTS', '需求清单', '按模块、实施阶段或关键词定位需求，点击条目查看完整验收标准与实现边界。')}
    <div class="module-tabs" role="group" aria-label="按模块筛选"><button type="button" data-module="all" class="${state.module === 'all' ? 'active' : ''}" aria-pressed="${state.module === 'all'}">全部模块 <span>${data.requirements.length}</span></button>${data.modules.map(module => `<button type="button" data-module="${module.id}" class="${state.module === module.id ? 'active' : ''}" aria-pressed="${state.module === module.id}">${module.name}<span>${moduleCount(module.id)}</span></button>`).join('')}</div>
    <div class="filter-bar"><div class="filter-left"><label class="filter-label" for="phase-filter">实施阶段</label><span class="select-wrap"><select id="phase-filter" aria-label="按阶段筛选"><option value="all">全部阶段</option>${data.phases.map(phase => `<option value="${phase.id}" ${state.phase === phase.id ? 'selected' : ''}>${phase.id} · ${phase.title}</option>`).join('')}</select></span>${state.query ? `<span class="query-label" title="${h(state.query)}">搜索：${h(state.query)}</span>` : ''}</div><div class="filter-right"><span class="filter-count" aria-live="polite">显示 <strong>${results.length}</strong> / ${data.requirements.length} 项需求</span><button type="button" class="reset-button" data-action="reset">重置筛选</button></div></div>
    ${results.length ? `<div class="panel requirements-list"><div class="list-head" aria-hidden="true"><span>编号</span><span>需求与验收摘要</span><span class="head-module">职责模块</span><span>实施阶段</span><span class="head-status">状态</span><span></span></div>${results.map(requirement => `<button type="button" class="requirement-row" data-requirement="${requirement.id}" aria-label="查看 ${requirement.id} ${h(requirement.title)}"><span class="row-id">${requirement.id}</span><span><strong class="row-title">${h(requirement.title)}</strong><span class="row-desc">${h(requirement.acceptance)}</span></span><span class="row-module">${moduleFor(requirement.module).name}</span><span class="row-phase">${h(requirement.phase)}</span><span class="row-status">${requirementStatus(requirement)}</span>${icon('arrow')}</button>`).join('')}</div>` : `<div class="empty-state">${icon('search')}<h2>没有找到匹配的需求</h2><p>试试需求编号、技术关键词，或放宽模块与阶段条件。</p><button type="button" class="btn" data-action="reset">清空条件，查看全部需求 ${icon('arrow')}</button></div>`}
    <p class="list-note">${icon('info')}跨阶段需求会出现在对应阶段的筛选结果中。Connector 和审计工作流条目用于跟踪接入。</p>`;
}

function deploymentDiagram() {
  const lab = state.deployment === 'lab';
  return `<div class="diagram-top"><h3>${icon('network')} 执行拓扑</h3><div class="segmented" role="group" aria-label="执行部署方式"><button type="button" data-deployment="lab" class="${lab ? 'active' : ''}" aria-pressed="${lab}">实验室 Windows</button><button type="button" data-deployment="workstation" class="${lab ? '' : 'active'}" aria-pressed="${!lab}">个人 Windows</button></div></div>
    <div class="deployment-flow"><div class="flow-column"><div class="flow-label">01 / ORIGINAL CLIENTS</div><div class="flow-node"><strong>${icon('phone')}原版手机 App</strong><small>登录 · 查看会话 · 回复审批</small></div><div class="flow-node"><strong>${icon('file')}原版 Web</strong><small>授权 · 配置 · 管理</small></div></div><div class="flow-column"><div class="flow-label">02 / LAB CONTROL PLANE</div><div class="flow-node highlight"><strong>${icon('server')}上游 Server</strong><small>设备配对、会话与实时通道</small></div></div><div class="flow-column"><div class="flow-label">03 / ${lab ? 'WINDOWS EXECUTION HOST' : 'PERSONAL WORKSTATION'}</div><div class="flow-node highlight"><strong>${icon('terminal')}上游 Connector</strong><small>上游设备协议与审计 Runtime 适配</small></div><div class="flow-connector">通过受认证的本地业务接口</div><div class="flow-node"><strong>${icon('layers')}pi-audit-harness</strong><small>Pi SDK · 本地队列 · 授权与恢复</small></div><div class="flow-connector">本地快照、SQLite、证据与报告</div></div></div><p class="diagram-caption"><strong>${lab ? '集中执行前提：' : '工作站执行前提：'}</strong>${lab ? 'Windows 执行机同机运行 Connector 与 harness，持久化本地审计任务和配置。' : '在有审计工作区的 Windows 工作站运行两者，Connector 主动连接上游 Server。'}</p>`;
}

function architecture() {
  const constraints = [
    ['任务身份', '远程会话通过 runId 关联本地项目、快照和任务。'],
    ['本地授权', '开始分析前沿用 harness 现有的发送范围确认。'],
    ['状态与证据', '原始记录由 harness 保存，远程通道接收授权范围内的事件。'],
    ['恢复与重试', '查询原任务和已提交游标，使用现有恢复条件继续。'],
  ];
  return `${heading('ARCHITECTURE & PROTOCOLS', '上游通道与本地审计服务', 'Connector 负责远程连接，审计适配层负责映射到 harness 已有的任务入口。')}
    <div class="panel diagram-panel" id="deployment-diagram">${deploymentDiagram()}</div>
    <div class="section-heading"><h2>服务端与执行端的职责</h2><span class="dim" style="font-size:10px">上游通道 · 审计适配 · 本地服务</span></div><div class="three-col"><article class="panel text-card"><div class="top-icon">${icon('server')}</div><h3>上游 Server</h3><p>认证、设备、会话、实时通道与 RPC 转发。</p></article><article class="panel text-card"><div class="top-icon">${icon('terminal')}</div><h3>Connector 与审计适配层</h3><p>复用设备与 Runtime 通道，映射现有任务、能力和可同步的事件。</p></article><article class="panel text-card"><div class="top-icon">${icon('layers')}</div><h3>harness 本地服务</h3><p>管理模型配置、授权、运行预算、SQLite 事件、人工复核与报告。</p></article></div>
    <div class="section-heading"><h2>协议兼容面</h2><p>按真实调用与有效契约逐项核对</p></div><div class="two-col">${data.protocols.map(protocol => `<article class="panel protocol-card"><div class="card-top"><h3>${protocol.title}</h3>${badge(protocol.tag)}</div><div class="code-lines">${protocol.paths.map(path => `<code>${h(path)}</code>`).join('')}</div><p>${protocol.text}</p><div class="related-links">${protocol.ids.map(id => requirementLink(id)).join('')}</div></article>`).join('')}</div>
    <div class="section-heading"><h2>实现时必须保留的约束</h2></div><div class="panel constraint-list">${constraints.map(([title, text], index) => `<article class="constraint-item"><span>0${index + 1}</span><div><h3>${title}</h3><p>${text}</p></div></article>`).join('')}</div>
    <div class="note-strip amber">${icon('info')}<div><strong>使用同一个固定样例作对照。</strong> 比较桌面直接运行和 Connector 发起的状态、证据与报告。</div></div>
    <div class="section-heading"><h2>源码与协议依据</h2><p>分析快照 ${data.baseline} · 实施前锁定实际配套版本</p></div><div class="source-links">${data.sources.map(source => `<a href="${h(source.url)}" target="_blank" rel="noopener noreferrer">${source.label} ↗</a>`).join('')}</div>`;
}

function roadmap() {
  return `${heading('IMPLEMENTATION ROADMAP', 'Connector 接入迭代计划', '从版本与扩展方式验证，推进到配对、远程任务、恢复和真机验收。')}
    <div class="note-strip">${icon('info')}<div><strong>交叉验证优先。</strong> 固定版本和审计样例，比较桌面直接运行与 Connector 发起的结果。</div></div>
    <div class="milestone-strip" aria-label="实施阶段顺序">${data.phases.map(phase => `<div class="milestone-step"><strong>${phase.id}</strong>${phase.label}</div>`).join('')}</div><div class="milestone-grid">${data.phases.map(phase => `<article class="panel milestone-card"><div class="card-top"><span class="milestone-id">${phase.id}</span>${badge(phase.label, 'soft')}</div><h3>${phase.title}</h3><p>${phase.description}</p><ul class="deliverables">${phase.deliverables.map(item => `<li>${icon('check')}<span>${item}</span></li>`).join('')}</ul><div class="exit-box"><small>EXIT CRITERIA / 验收出口</small><p>${phase.exit}</p></div><div class="milestone-foot"><span>${phase.dependency}</span><button type="button" data-phase="${phase.id}">查看 ${data.requirements.filter(r => includesPhase(r.phase, phase.id)).length} 项相关需求 ${icon('arrow')}</button></div></article>`).join('')}</div>
    <div class="note-strip amber">${icon('info')}<div><strong>验收以真实任务为准。</strong> 手机操作要进入 harness 的本地任务，桌面能按同一 runId 复核结果。</div></div>`;
}

function acceptance() {
  const matrix = [
    ['M0', '桌面 harness', '本地审计', '固定样例、快照、任务和报告', false],
    ['M1', '上游 Server', 'Connector 与审计适配层', '验证配对、Runtime 发现和状态读取', false],
    ['M2', '上游 Server', '原版 App 与 Web', '验证授权后启动、停止和重连补读', false],
    ['M3', 'Windows 执行机', '桌面与远程端', '对照任务及报告，验证权限与恢复', true],
  ];
  const implementation = value => `<span class="implementation">${h(value)}</span>`;
  return `${heading('VALIDATION & DELIVERY', '原版客户端能用，远程链路才算成立。', '契约样例、自动化检查与真实手机操作共同构成验收；只通过 mock 不能认定交付。')}
    <div class="section-heading"><h2>验收场景</h2><p>使用固定的公开或合成样例</p></div><div class="panel matrix"><div class="matrix-head"><span>阶段</span><span>服务或执行机</span><span>客户端或链路</span><span>验证目标</span><span>状态</span></div>${matrix.map(([number, server, connector, goal, final]) => `<div class="matrix-row ${final ? 'final' : ''}"><span>${number}</span>${implementation(server)}${implementation(connector)}<p>${goal}</p>${badge('待验收', 'soft')}</div>`).join('')}</div>
    <div class="note-strip">${icon('phone')}<div><strong>真机验收</strong> 在原版 App 打开审计任务，切换网络后确认同一任务和事件可恢复。</div></div>
    <div class="section-heading"><h2>${data.failureCases.length} 个关键故障与边界场景</h2><p>展开查看目标行为与对应需求</p></div><div class="failure-grid">${data.failureCases.map((failure, index) => `<details class="failure-card"><summary><span>${String(index + 1).padStart(2, '0')}</span>${failure.title}</summary><div class="failure-body"><p>${failure.text}</p><div class="related-links">${failure.ids.map(id => requirementLink(id)).join('')}</div></div></details>`).join('')}</div>
    <div class="section-heading"><h2>交付物与原始依据</h2></div><article class="panel delivery-card"><div><div class="panel-title">DELIVERY PACKAGE</div><h3>接入配置、契约与验收记录</h3><p>交付审计适配、上游 Connector 安装与配置说明、兼容样例、故障复现步骤和手机/Web 验收记录。</p></div><a class="btn" href="./spec.md" download="pi-audit-harness-connector-prd.md">${icon('download')}下载完整方案</a></article>
    <div class="section-heading"><h2>文档来源</h2><p>需求基于 harness 的当前源码和上游 Connector 契约</p></div><div class="source-links"><a href="${h(data.repository)}/blob/main/docs/prd/spec.md" target="_blank" rel="noopener noreferrer">完整 Markdown 方案 ↗</a>${data.sources.map(source => `<a href="${h(source.url)}" target="_blank" rel="noopener noreferrer">${source.label} ↗</a>`).join('')}</div>`;
}

const moduleNotes = {
  baseline: '用冻结源码和真实调用确认 Runtime 扩展方式，以及 harness 的任务和授权入口。',
  connector: '复用设备认证和远程会话协议，审计实例使用独立可辨识的身份。',
  harness: '调用现有任务、预算和恢复接口，报告与原始证据由桌面业务服务保存。',
  deployment: '使用真实 Windows 执行机、原版 App 和 Web 验证安装、权限、重启和恢复。',
};

const relatedById = {
  C02: ['B02', 'C01', 'C04'], C05: ['B03', 'P04', 'D04'],
  P01: ['C04', 'P02', 'D02'], P03: ['P04', 'D03'], P05: ['C03', 'C04', 'D04'],
};

function showDetail(id) {
  const requirement = data.requirements.find(item => item.id === id);
  if (!requirement) return;
  lastRequirement = id;
  const module = moduleFor(requirement.module);
  const related = (relatedById[id] || (requirement.module === 'baseline' ? ['B01', 'B02', 'B04'] : ['B02', 'B03', 'D02'])).filter(item => item !== id);
  const criteria = requirement.acceptance.split('；').filter(Boolean);
  dialog.innerHTML = `<div class="detail-layout"><header class="detail-head"><div class="detail-top"><span class="detail-id">REQUIREMENT / ${id}</span><div class="detail-actions"><button type="button" class="icon-button" data-action="copy" aria-label="复制需求链接" title="复制需求链接">${icon('copy')}</button><button type="button" class="icon-button" data-action="close" aria-label="关闭需求详情" title="关闭 · Esc">${icon('close')}</button></div></div><h2 id="detail-title">${h(requirement.title)}</h2><div class="detail-tags">${badge(module.name, 'blue')}${badge(requirement.phase)}${badge(requirementStatus(requirement), 'soft')}</div></header><div class="detail-body"><section class="detail-section"><h3>${icon(module.icon)}需求说明</h3><p>${h(requirement.title)}。${module.description}</p></section><section class="detail-section"><h3>${icon('check')}验收标准</h3><ul class="acceptance-list">${criteria.map(criterion => `<li>${icon('check')}<span>${h(criterion)}</span></li>`).join('')}</ul></section><div class="detail-facts"><div><small>职责归属</small><strong>${module.name}</strong></div><div><small>相关实施阶段</small><strong>${h(requirement.phase)}</strong></div><div><small>计划状态</small><strong>${requirementStatus(requirement)}</strong></div><div><small>需求来源</small><strong>Connector 接入 PRD · ${id}</strong></div></div><section class="detail-section"><h3>实现边界</h3><div class="detail-note">${moduleNotes[requirement.module]}</div></section><section class="detail-section"><h3>相关需求</h3><div class="related-links">${related.map(item => requirementLink(item, `${item} · ${data.requirements.find(r => r.id === item).title}`)).join('')}</div></section><details class="technical-notes"><summary>阶段说明与原始依据</summary><p>${module.emphasis}</p>${data.phases.filter(phase => includesPhase(requirement.phase, phase.id)).map(phase => `<p><strong>${phase.id} · ${phase.title}</strong><br>${phase.exit}</p>`).join('')}<p>本项标题、阶段和验收标准与原始方案一致。<a href="${h(data.repository)}/blob/main/docs/prd/spec.md" target="_blank" rel="noopener noreferrer">查看完整 Markdown 方案 ↗</a></p><p>分析源码快照：<a href="${h(data.sourceSnapshot)}" target="_blank" rel="noopener noreferrer">${data.baseline}</a>。实际实施先锁定配套客户端与协议版本。</p></details></div><footer class="detail-bottom">Connector 接入规划与验收标准</footer></div>`;
  document.querySelectorAll('[data-requirement]').forEach(row => row.classList.toggle('active', row.dataset.requirement === id));
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('.detail-body').scrollTop = 0;
  dialog.querySelector('[data-action="close"]').focus();
}

function render() {
  if (!data) return;
  const activeControl = content.contains(document.activeElement) ? document.activeElement : null;
  const focusSelector = activeControl?.id === 'phase-filter' ? '#phase-filter'
    : activeControl?.dataset.module ? `[data-module="${activeControl.dataset.module}"]`
    : activeControl?.dataset.action === 'reset' ? '[data-action="reset"]' : null;
  const route = parseRoute(location.hash);
  const changedView = state.view !== route.view;
  state.view = route.view;
  const selected = data.requirements.find(requirement => requirement.id === route.requirementId);
  if (selected && !filterRequirements([selected], state).length) {
    state.module = 'all'; state.phase = 'all'; state.query = ''; search.value = '';
  }
  document.title = `${labels[state.view]} · Connector 接入`;
  document.querySelectorAll('[data-view]').forEach(link => {
    const active = link.dataset.view === state.view;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  content.innerHTML = ({ overview, requirements, architecture, roadmap, acceptance })[state.view]();
  if (route.requirementId && data.requirements.some(r => r.id === route.requirementId)) {
    showDetail(route.requirementId);
  } else if (dialog.open) {
    dialog.close();
    content.querySelector(`[data-requirement="${lastRequirement}"]`)?.focus();
  }
  if (!dialog.open && focusSelector) content.querySelector(focusSelector)?.focus({ preventScroll: true });
  if (changedView) window.scrollTo({ top: 0 });
}

function go(view, requirementId = null) {
  const hash = `#${view}${requirementId ? `/${requirementId}` : ''}`;
  if (location.hash === hash) render(); else location.hash = hash;
}

function clearFilters() {
  state.module = 'all'; state.phase = 'all'; state.query = ''; search.value = '';
  go('requirements');
}

function notify(message) {
  let toast = document.querySelector('#toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast'; toast.className = 'toast';
    toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
  }
  (dialog.open ? dialog : document.body).append(toast);
  clearTimeout(toastTimer);
  toast.textContent = message; toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3000);
}

document.addEventListener('click', async event => {
  if (event.target.closest('.skip-link')) { event.preventDefault(); content.focus(); return; }
  const requirement = event.target.closest('[data-requirement]');
  if (requirement) { go('requirements', requirement.dataset.requirement); return; }
  const view = event.target.closest('[data-view]');
  if (view) { event.preventDefault(); go(view.dataset.view); return; }
  const module = event.target.closest('[data-module]');
  if (module) {
    state.module = module.dataset.module;
    if (state.view !== 'requirements') { state.phase = 'all'; state.query = ''; search.value = ''; }
    go('requirements'); return;
  }
  const phase = event.target.closest('[data-phase]');
  if (phase) { state.phase = phase.dataset.phase; state.module = 'all'; state.query = ''; search.value = ''; go('requirements'); return; }
  const deployment = event.target.closest('[data-deployment]');
  if (deployment) {
    const restoreFocus = document.activeElement === deployment;
    state.deployment = deployment.dataset.deployment;
    document.querySelector('#deployment-diagram').innerHTML = deploymentDiagram();
    if (restoreFocus) document.querySelector(`[data-deployment="${state.deployment}"]`)?.focus({ preventScroll: true });
    return;
  }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'reset') clearFilters();
  if (action === 'close') go('requirements');
  if (action === 'copy') {
    try { await navigator.clipboard.writeText(location.href); notify('需求链接已复制，可以直接分享。'); }
    catch { notify('复制未完成，可直接复制浏览器地址栏中的需求链接。'); }
  }
});

document.addEventListener('change', event => { if (event.target.id === 'phase-filter') { state.phase = event.target.value; render(); } });
search.addEventListener('input', event => { state.query = event.target.value; go('requirements'); });
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); search.focus(); search.select(); }
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !dialog.open) { event.preventDefault(); search.focus(); }
});
dialog.addEventListener('cancel', event => { event.preventDefault(); go('requirements'); });
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) go('requirements');
});
window.addEventListener('hashchange', render);

try {
  const response = await fetch(new URL('./requirements.json', import.meta.url));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  data = await response.json();
  if (!/Mac|iPhone|iPad/.test(navigator.platform)) document.querySelector('.searchbox kbd').textContent = 'Ctrl K';
  render();
} catch {
  content.innerHTML = '<div class="empty-state"><h1>需求数据暂未载入</h1><p>请刷新页面，或下载完整原始方案继续阅读。</p><a class="btn" href="./spec.md">查看 Markdown 方案</a></div>';
}
