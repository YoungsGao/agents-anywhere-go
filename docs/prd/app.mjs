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

function heading(eyebrow, title, description, download = true) {
  return `<div class="page-heading"><div><div class="eyebrow">DOCS <span class="slash">/</span> ${eyebrow} <span class="slash">/</span> V1.1</div><h1>${title}</h1><p>${description}</p></div><div class="heading-actions">${badge('规划稿', 'soft')}${download ? `<a class="btn ghost" href="./spec.md" download="agents-anywhere-go-prd.md">${icon('download')}完整方案</a>` : ''}</div></div>`;
}

function overview() {
  return `${heading('PROJECT OVERVIEW', 'Agents Anywhere，Go 复刻计划。', '沿用原版交互与协议，用 Go 重构 Server，新增 Python Pi Connector，直接复用其他 Connector。')}
    <section class="panel intro-panel" aria-label="项目定位"><div><div class="panel-title">PROTOCOL-COMPATIBLE · GO REWRITE</div><h2 class="intro-title">兼容原版协议，<br>用 <em>Go</em> 重构远程 Agent 后端。</h2><p>手机 App、Web 与 DSH Bridge 继续复用。围绕 Gin＋GORM 服务端、Python Pi 接入与实验室 Docker 部署，系统学习长连接、状态同步、数据一致性和故障恢复。</p><div class="tech-tags">${['Go', 'Gin', 'GORM', 'MySQL', 'Redis', 'Python', 'Docker'].map(tag => `<span>${tag}</span>`).join('')}</div><div class="intro-actions"><a class="btn primary" href="#requirements">浏览 ${data.requirements.length} 项需求 ${icon('arrow')}</a><a class="btn ghost" href="${h(data.repository)}" target="_blank" rel="noopener noreferrer">GitHub 仓库 ${icon('external')}</a></div></div><div class="scope-box"><div class="scope-line"><span class="scope-num">01</span><div><strong>重构 Go Server</strong><small>Gin、GORM、MySQL 与实时通道</small></div></div><div class="scope-line"><span class="scope-num">02</span><div><strong>复用原版客户端</strong><small>手机、Web 与 DSH 插件使用原版</small></div></div><div class="scope-line"><span class="scope-num">03</span><div><strong>增加 Pi Python 接入</strong><small>其他 Agent 直接复用原 Connector</small></div></div></div></section>
    <div class="stat-grid"><div class="panel stat-card"><span>需求总数<small>五个职责模块</small></span><strong>${data.requirements.length}<span class="stat-symbol">项</span></strong></div><div class="panel stat-card"><span>Go Server<small>Gin ＋ GORM</small></span><strong>${moduleCount('server')}<span class="stat-symbol">项</span></strong></div><div class="panel stat-card"><span>Pi Connector<small>Python ＋ ACP</small></span><strong>${moduleCount('pi')}<span class="stat-symbol">项</span></strong></div><div class="panel stat-card"><span>实施阶段<small>M0—M5 · 含可选增强</small></span><strong>06<span class="stat-symbol">阶段</span></strong></div></div>
    <div class="section-heading"><h2>按职责阅读需求</h2><a href="#requirements">查看完整清单 ${icon('arrow')}</a></div><div class="module-grid">${data.modules.map((module, index) => `<button type="button" class="panel module-card" data-module="${module.id}"><div class="module-top">${icon(module.icon)}<span class="module-number">0${index + 1} / ${module.english}</span></div><h3>${module.name}</h3><p>${module.description}</p><div class="module-bottom"><span>${moduleCount(module.id)} 项需求${module.id === 'extension' ? ' · 可选迭代' : ''}</span>${icon('arrow')}</div></button>`).join('')}<div class="panel module-doc">${icon('file')}<h3>从方案，到可验收的复刻。</h3><p>每项需求保留原始编号、实施阶段和验收标准，可通过独立链接分享。</p><a class="btn ghost" href="./spec.md" download="agents-anywhere-go-prd.md">下载原始方案 ${icon('download')}</a></div></div>
    <div class="section-heading"><h2>项目边界</h2><span class="dim" style="font-size:10px">设计已明确 · 实现按阶段推进</span></div><div class="three-col">${data.boundaries.map((boundary, index) => `<article class="panel text-card"><div class="panel-title">BOUNDARY / 0${index + 1}</div><h3>${boundary.title}</h3><p>${boundary.text}</p></article>`).join('')}</div>
    <div class="note-strip">${icon('info')}<div><strong>当前为需求规划。</strong> 页面中的阶段和验收条件均为实施目标，不表示 Go 后端已经完成。源码快照 <code>${data.baseline}</code> 用于分析参考；开发先锁定与实际手机 App 配套的版本组合。</div></div>`;
}

function requirements() {
  const results = filterRequirements(data.requirements, state);
  return `${heading('REQUIREMENTS', '需求清单', '按模块、实施阶段或关键词定位需求，点击条目查看完整验收标准与实现边界。')}
    <div class="module-tabs" role="group" aria-label="按模块筛选"><button type="button" data-module="all" class="${state.module === 'all' ? 'active' : ''}" aria-pressed="${state.module === 'all'}">全部模块 <span>${data.requirements.length}</span></button>${data.modules.map(module => `<button type="button" data-module="${module.id}" class="${state.module === module.id ? 'active' : ''}" aria-pressed="${state.module === module.id}">${module.name}<span>${moduleCount(module.id)}</span></button>`).join('')}</div>
    <div class="filter-bar"><div class="filter-left"><label class="filter-label" for="phase-filter">实施阶段</label><span class="select-wrap"><select id="phase-filter" aria-label="按阶段筛选"><option value="all">全部阶段</option>${data.phases.map(phase => `<option value="${phase.id}" ${state.phase === phase.id ? 'selected' : ''}>${phase.id} · ${phase.title}</option>`).join('')}</select></span>${state.query ? `<span class="query-label" title="${h(state.query)}">搜索：${h(state.query)}</span>` : ''}</div><div class="filter-right"><span class="filter-count" aria-live="polite">显示 <strong>${results.length}</strong> / ${data.requirements.length} 项需求</span><button type="button" class="reset-button" data-action="reset">重置筛选</button></div></div>
    ${results.length ? `<div class="panel requirements-list"><div class="list-head" aria-hidden="true"><span>编号</span><span>需求与验收摘要</span><span class="head-module">职责模块</span><span>实施阶段</span><span class="head-status">状态</span><span></span></div>${results.map(requirement => `<button type="button" class="requirement-row" data-requirement="${requirement.id}" aria-label="查看 ${requirement.id} ${h(requirement.title)}"><span class="row-id">${requirement.id}</span><span><strong class="row-title">${h(requirement.title)}</strong><span class="row-desc">${h(requirement.acceptance)}</span></span><span class="row-module">${moduleFor(requirement.module).name}</span><span class="row-phase">${h(requirement.phase)}</span><span class="row-status">${requirement.optional ? '可选规划' : '待实现'}</span>${icon('arrow')}</button>`).join('')}</div>` : `<div class="empty-state">${icon('search')}<h2>没有找到匹配的需求</h2><p>试试需求编号、技术关键词，或放宽模块与阶段条件。</p><button type="button" class="btn" data-action="reset">清空条件，查看全部需求 ${icon('arrow')}</button></div>`}
    <p class="list-note">${icon('info')}跨阶段需求会出现在多个阶段的筛选结果中。阶段表示实施安排，所有后端需求当前均为待实现。</p>`;
}

function deploymentDiagram() {
  const lab = state.deployment === 'lab';
  return `<div class="diagram-top"><h3>${icon('network')} 执行拓扑</h3><div class="segmented" role="group" aria-label="执行部署方式"><button type="button" data-deployment="lab" class="${lab ? 'active' : ''}" aria-pressed="${lab}">实验室集中执行</button><button type="button" data-deployment="workstation" class="${lab ? '' : 'active'}" aria-pressed="${!lab}">个人电脑执行</button></div></div>
    <div class="deployment-flow"><div class="flow-column"><div class="flow-label">01 / ORIGINAL CLIENTS</div><div class="flow-node"><strong>${icon('phone')}原版手机 App</strong><small>登录 · 查看会话 · 回复审批</small></div><div class="flow-node"><strong>${icon('file')}原版 Web</strong><small>授权 · 配置 · 管理</small></div></div><div class="flow-column"><div class="flow-label">02 / LAB CONTROL PLANE</div><div class="flow-node highlight"><strong>${icon('server')}Go Server</strong><small>HTTPS / WSS · Gin ＋ GORM<br>设备、会话、事件与 RPC 路由</small></div><div class="storage-row"><div>MySQL<br><small>持久化业务事实</small></div><div>Redis<br><small>租约、路由与票据</small></div></div><div class="flow-connector">Server 独立 Docker 镜像</div></div><div class="flow-column"><div class="flow-label">03 / ${lab ? 'LAB EXECUTION ENVIRONMENT' : 'PERSONAL WORKSTATION'}</div><div class="flow-node highlight"><strong>${icon('terminal')}Python Connector</strong><small>Pi 专用接入或其他上游执行端</small></div><div class="flow-connector">按 Runtime 选择本机协议</div><div class="flow-node"><strong>${icon('layers')}Pi / ACP 或原版 DSH 等</strong><small>原生会话 · 模型调用 · 审批与输入</small></div><div class="flow-connector">工作目录 / Git / Shell / PTY</div></div></div><p class="diagram-caption"><strong>${lab ? '集中执行前提：' : '工作站执行前提：'}</strong>${lab ? '执行机在实验室运行 Python Connector 与选定 Runtime；持久化凭据、检查点和工作目录。' : 'Python Connector 在个人工作站访问本机项目，主动连接实验室 Server。'}</p>`;
}

function architecture() {
  const constraints = [
    ['兼容原始响应形状', '独立 DTO 与 GORM 模型；保留字段缺省、null、空数组、状态码与错误详情。'],
    ['持久化与实时事实分开', 'MySQL 保存持久化业务状态；当前 Runtime 状态、notice 与有效能力由 Runtime 裁决。'],
    ['确认成功后再推进检查点', '服务端未接受的数据不能被检查点越过。超时后的修改操作先核对状态。'],
    ['MySQL 迁移逐项核对', '处理 PostgreSQL 的序列、锁、upsert、部分唯一索引和排序语义；使用版本化迁移。'],
    ['执行侧的复用范围', 'DSH 继续使用上游启动器；Pi 专项通过 Python Connector 的 ACP 接口接入。'],
    ['分别固定协议版本', 'HTTP API v2、平台协议、Runtime Control 和 DSH Bridge 各自记录版本，按冻结基线验证。'],
  ];
  return `${heading('ARCHITECTURE & PROTOCOLS', '执行边界清楚，协议行为一致。', '保留原来的客户端操作路径，在后端实现上使用 Go、Gin＋GORM 与清晰的职责边界。')}
    <div class="panel diagram-panel" id="deployment-diagram">${deploymentDiagram()}</div>
    <div class="section-heading"><h2>服务端与执行端的职责</h2><span class="dim" style="font-size:10px">Go 服务端 · Python 执行端</span></div><div class="three-col"><article class="panel text-card"><div class="top-icon">${icon('server')}</div><h3>Go Server</h3><p>认证、设备、项目与会话、Timeline、实时通道、RPC 转发和管理配置。</p><div class="tech-tags"><span>Gin</span><span>GORM</span><span>MySQL</span><span>Redis</span></div></article><article class="panel text-card"><div class="top-icon">${icon('terminal')}</div><h3>Pi Python Connector</h3><p>负责 Pi 实例发现、会话执行与能力报告，借用原 Connector 的设备通道和同步。</p><div class="tech-tags"><span>Python</span><span>ACP</span><span>CLI / JSON State</span></div></article><article class="panel text-card"><div class="top-icon">${icon('layers')}</div><h3>状态归属</h3><ul><li>持久化业务事实 → MySQL</li><li>在线租约与短期协调 → Redis</li><li>原生上下文 → DSH / Runtime</li><li>本机检查点与记录 → Connector 文件</li></ul></article></div>
    <div class="section-heading"><h2>协议兼容面</h2><p>按真实调用与有效契约逐项核对</p></div><div class="two-col">${data.protocols.map(protocol => `<article class="panel protocol-card"><div class="card-top"><h3>${protocol.title}</h3>${badge(protocol.tag)}</div><div class="code-lines">${protocol.paths.map(path => `<code>${h(path)}</code>`).join('')}</div><p>${protocol.text}</p><div class="related-links">${protocol.ids.map(id => requirementLink(id)).join('')}</div></article>`).join('')}</div>
    <div class="section-heading"><h2>实现时必须保留的约束</h2></div><div class="panel constraint-list">${constraints.map(([title, text], index) => `<article class="constraint-item"><span>0${index + 1}</span><div><h3>${title}</h3><p>${text}</p></div></article>`).join('')}</div>
    <div class="note-strip amber">${icon('info')}<div><strong>对照实例与 Go 实例使用独立数据库。</strong> 原 Python Server 保留 PostgreSQL；Go Server 使用 MySQL。交叉联调验证协议，两个实现不混写同一个数据库。</div></div>
    <div class="section-heading"><h2>源码与协议依据</h2><p>分析快照 ${data.baseline} · 实施前锁定实际配套版本</p></div><div class="source-links">${data.sources.map(source => `<a href="${h(source.url)}" target="_blank" rel="noopener noreferrer">${source.label} ↗</a>`).join('')}</div>`;
}

function roadmap() {
  return `${heading('IMPLEMENTATION ROADMAP', '分阶段替换，每一步都有验收出口。', '先发布可与原 Connector 联调的 Go Server，再加入 Python Pi 接入。M5 为可选的中间件学习增强。')}
    <div class="note-strip">${icon('info')}<div><strong>交叉验证优先。</strong> 固定原版客户端与 Connector，比对原 Server 和 Go Server 的响应，再验证 Pi 的新增行为。</div></div>
    <div class="milestone-strip" aria-label="实施阶段顺序">${data.phases.map(phase => `<div class="milestone-step"><strong>${phase.id}</strong>${phase.label}</div>`).join('')}</div><div class="milestone-grid">${data.phases.map(phase => `<article class="panel milestone-card ${phase.optional ? 'optional' : ''}"><div class="card-top"><span class="milestone-id">${phase.id}</span>${badge(phase.label, phase.optional ? 'amber' : 'soft')}</div><h3>${phase.title}</h3><p>${phase.description}</p><ul class="deliverables">${phase.deliverables.map(item => `<li>${icon('check')}<span>${item}</span></li>`).join('')}</ul><div class="exit-box"><small>EXIT CRITERIA / 验收出口</small><p>${phase.exit}</p></div><div class="milestone-foot"><span>${phase.dependency}</span><button type="button" data-phase="${phase.id}">查看 ${data.requirements.filter(r => includesPhase(r.phase, phase.id)).length} 项相关需求 ${icon('arrow')}</button></div></article>`).join('')}</div>
    <div class="section-heading"><h2>怎样定义“做完了”</h2></div><div class="two-col"><article class="panel text-card"><div class="panel-title">M1 / SERVER RELEASE</div><h3>第一条完整远程链路</h3><p>原版手机连接实验室地址，看到 DSH 设备，继续会话并接收流式输出；Go Server 重启后仍可读取历史。</p></article><article class="panel text-card"><div class="panel-title">M4 / BASELINE FEATURE PARITY</div><h3>冻结基线的适用能力覆盖</h3><p>覆盖已声明的 Server API、计划/目标、配置和管理功能，其他 Runtime 采用上游版本。按目标平台逐项完成清单；未验证或未实现的能力保持明确不可用。</p></article></div>
    <div class="note-strip amber">${icon('info')}<div><strong>阶段不是研发进度。</strong> 本页不预设完成率或日期。M0 的手机版本、实验室网络、DSH 无头环境与插件启动验证完成后，再细化工作量和排期。</div></div>`;
}

function acceptance() {
  const matrix = [
    ['01', '原 Server', '原 Connector', '获得冻结版本的真实参考行为', false],
    ['02', 'Go Server', '原 Connector', '验证服务端接口、实时通道与转发兼容', false],
    ['03', 'Go Server', 'Pi Python Connector', '验证 Pi 会话创建、续聊和恢复', false],
    ['04', 'Go Server', 'Pi 与原 Connector', '验证多 Runtime 共存与故障恢复', true],
  ];
  const implementation = value => `<span class="implementation"><b class="${value !== 'Go Server' ? 'original' : ''}">${value !== 'Go Server' ? 'PY' : 'GO'}</b>${value}</span>`;
  return `${heading('VALIDATION & DELIVERY', '原版客户端能用，远程链路才算成立。', '契约样例、自动化检查与真实手机操作共同构成验收；只通过 mock 不能认定交付。')}
    <div class="section-heading"><h2>四组交叉联调</h2><p>各组合使用独立测试数据</p></div><div class="panel matrix"><div class="matrix-head"><span>组合</span><span>Server</span><span>Connector</span><span>验证目标</span><span>状态</span></div>${matrix.map(([number, server, connector, goal, final]) => `<div class="matrix-row ${final ? 'final' : ''}"><span>${number}</span>${implementation(server)}${implementation(connector)}<p>${goal}</p>${badge('待验收', 'soft')}</div>`).join('')}</div>
    <div class="note-strip">${icon('phone')}<div><strong>按阶段验收：</strong> M1 验已有会话、流式输出和恢复；M2 验 Pi 新建与续聊、有效能力和其他 Agent 共存；M3 验工作区与故障恢复。</div></div>
    <div class="section-heading"><h2>${data.failureCases.length} 个关键故障与边界场景</h2><p>展开查看目标行为与对应需求</p></div><div class="failure-grid">${data.failureCases.map((failure, index) => `<details class="failure-card"><summary><span>${String(index + 1).padStart(2, '0')}</span>${failure.title}</summary><div class="failure-body"><p>${failure.text}</p><div class="related-links">${failure.ids.map(id => requirementLink(id)).join('')}</div></div></details>`).join('')}</div>
    <div class="section-heading"><h2>交付物与原始依据</h2></div><article class="panel delivery-card"><div><div class="panel-title">DELIVERY PACKAGE</div><h3>程序、镜像、契约与可复现的验收记录</h3><p>交付 aa-server、Python Pi 接入模块、版本化数据库迁移、Docker/Compose、兼容 fixtures、测试结果、部署与备份恢复文档。当前仓库先保存本份 PRD 展示页，后端实现按里程碑推进。</p></div><a class="btn" href="./spec.md" download="agents-anywhere-go-prd.md">${icon('download')}下载完整方案</a></article>
    <div class="section-heading"><h2>文档来源</h2><p>需求定义来自已确认的 Go 复刻规划</p></div><div class="source-links"><a href="${h(data.repository)}/blob/main/docs/prd/spec.md" target="_blank" rel="noopener noreferrer">完整 Markdown 方案 ↗</a>${data.sources.map(source => `<a href="${h(source.url)}" target="_blank" rel="noopener noreferrer">${source.label} ↗</a>`).join('')}<a href="${h(data.reference)}" target="_blank" rel="noopener noreferrer">展示形式参考 ↗</a></div>`;
}

const moduleNotes = {
  baseline: '实际开发以可下载手机 App 的配套版本为基线。proposal / target 文档需与有效源码和真实调用核对，不能只按接口名称判断兼容。',
  server: '使用 Gin 处理协议入口，GORM 处理 MySQL 事务与持久化。API DTO 与数据库模型分开，当前 Runtime 事实不由历史记录推断。',
  pi: 'Pi 使用 Python，沿用上游设备协议、实例身份与 ACP 接口。',
  deployment: '镜像内只包含运行所需依赖，状态与工作目录使用明确的持久卷。实际手机、网络和进程重启验证属于交付条件。',
  extension: '这是协议复刻稳定后的可选学习项。RabbitMQ 处理真实的异步业务，不替换现有 Connector 控制通道和会话队列语义。',
};

const relatedById = {
  S06: ['S07', 'S19'], S10: ['S11', 'S18', 'P05'], S24: ['S07', 'S11', 'P03'],
  P01: ['B01', 'P02'], P03: ['P02', 'P04', 'S24'], P05: ['S10', 'S11', 'D05'],
  P06: ['P02', 'S07'], E01: ['S18', 'S22', 'D08'], E02: ['S16', 'D04', 'D08'],
};

function showDetail(id) {
  const requirement = data.requirements.find(item => item.id === id);
  if (!requirement) return;
  lastRequirement = id;
  const module = moduleFor(requirement.module);
  const related = (relatedById[id] || (requirement.module === 'baseline' ? ['B01', 'B02', 'B04'] : ['B02', 'B03', 'D09'])).filter(item => item !== id);
  const criteria = requirement.acceptance.split('；').filter(Boolean);
  dialog.innerHTML = `<div class="detail-layout"><header class="detail-head"><div class="detail-top"><span class="detail-id">REQUIREMENT / ${id}</span><div class="detail-actions"><button type="button" class="icon-button" data-action="copy" aria-label="复制需求链接" title="复制需求链接">${icon('copy')}</button><button type="button" class="icon-button" data-action="close" aria-label="关闭需求详情" title="关闭 · Esc">${icon('close')}</button></div></div><h2 id="detail-title">${h(requirement.title)}</h2><div class="detail-tags">${badge(module.name, 'blue')}${badge(requirement.phase)}${badge(requirement.optional ? '可选规划' : '待实现', 'soft')}</div></header><div class="detail-body"><section class="detail-section"><h3>${icon(module.icon)}需求说明</h3><p>${h(requirement.title)}。${module.description}</p></section><section class="detail-section"><h3>${icon('check')}验收标准</h3><ul class="acceptance-list">${criteria.map(criterion => `<li>${icon('check')}<span>${h(criterion)}</span></li>`).join('')}</ul></section><div class="detail-facts"><div><small>职责归属</small><strong>${module.name}</strong></div><div><small>相关实施阶段</small><strong>${h(requirement.phase)}</strong></div><div><small>实现状态</small><strong>规划中 · 待实现</strong></div><div><small>需求来源</small><strong>Go 复刻方案 · ${id}</strong></div></div><section class="detail-section"><h3>实现边界</h3><div class="detail-note">${moduleNotes[requirement.module]}</div></section><section class="detail-section"><h3>相关需求</h3><div class="related-links">${related.map(item => requirementLink(item, `${item} · ${data.requirements.find(r => r.id === item).title}`)).join('')}</div></section><details class="technical-notes"><summary>阶段说明与原始依据</summary><p>${module.emphasis}</p>${data.phases.filter(phase => includesPhase(requirement.phase, phase.id)).map(phase => `<p><strong>${phase.id} · ${phase.title}</strong><br>${phase.exit}</p>`).join('')}<p>本项标题、阶段和验收标准与原始方案一致。<a href="${h(data.repository)}/blob/main/docs/prd/spec.md" target="_blank" rel="noopener noreferrer">查看完整 Markdown 方案 ↗</a></p><p>分析源码快照：<a href="${h(data.sourceSnapshot)}" target="_blank" rel="noopener noreferrer">${data.baseline}</a>。实际实施先锁定配套客户端与协议版本。</p></details></div><footer class="detail-bottom">需求定义与验收目标 · 不代表 Go 后端功能已经实现</footer></div>`;
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
  document.title = `${labels[state.view]} · Agents Anywhere Go`;
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
