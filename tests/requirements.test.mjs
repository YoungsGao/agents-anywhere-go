import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const dataUrl = new URL('../docs/prd/requirements.json', import.meta.url);
const coreUrl = new URL('../docs/prd/core.mjs', import.meta.url);
const specUrl = new URL('../docs/prd/spec.md', import.meta.url);

function readData() {
  assert.ok(existsSync(dataUrl), '网页需要从原始方案生成完整的结构化需求数据');
  return JSON.parse(readFileSync(dataUrl, 'utf8'));
}

async function core() {
  assert.ok(existsSync(coreUrl), '需求列表需要可测试的搜索、筛选和链接行为');
  return import(coreUrl.href);
}

test('all IDs are unique and belong to a declared module', () => {
  const data = readData();
  const ids = new Set(data.requirements.map(r => r.id));
  assert.equal(ids.size, data.requirements.length);
  for (const r of data.requirements) {
    assert.ok(data.modules.some(m => m.id === r.module && m.prefix === r.id[0]));
  }
  for (const group of [...data.protocols, ...data.failureCases]) {
    for (const id of group.ids) assert.ok(ids.has(id), id);
  }
});

test('every requirement keeps the exact title and acceptance criteria from the original specification', () => {
  const data = readData();
  assert.ok(existsSync(specUrl), '发布版本必须保留可下载的原始方案');
  const source = readFileSync(specUrl, 'utf8');
  const lines = source.split(/\r?\n/).filter(line => /^\| [BSPDE]\d{2} \|/.test(line));
  assert.equal(lines.length, data.requirements.length);
  for (const line of lines) {
    const [id, phase, title, acceptance] = line.split('|').slice(1, -1).map(s => s.trim());
    const requirement = data.requirements.find(r => r.id === id);
    assert.ok(requirement, `缺少 ${id}`);
    assert.equal(requirement.title, title);
    assert.equal(requirement.phase, phase);
    assert.equal(requirement.acceptance, acceptance);
    assert.equal(requirement.status, 'planned');
  }
});

test('module selection returns the Server requirements', async () => {
  const { filterRequirements } = await core();
  const results = filterRequirements(readData().requirements, { module: 'server' });
  assert.equal(results.length, readData().requirements.filter(r => r.module === 'server').length);
  assert.ok(results.every(r => r.id.startsWith('S')));
});

test('search supports case-insensitive words across the requirement content', async () => {
  const { filterRequirements } = await core();
  const results = filterRequirements(readData().requirements, { query: 'gorm mysql' });
  assert.ok(results.some(r => r.id === 'S18'));
  assert.equal(filterRequirements(readData().requirements, { query: '此关键词没有任何匹配987' }).length, 0);
});

test('module, milestone and search filters compose without losing acceptance content', async () => {
  const { filterRequirements } = await core();
  const results = filterRequirements(readData().requirements, { module: 'pi', phase: 'M2', query: 'ACP' });
  assert.deepEqual(results.map(r => r.id), ['P01']);
  assert.ok(filterRequirements(readData().requirements, { query: '检查点' }).some(r => r.id === 'P05'));
});

test('a milestone range includes its intermediate phases and M5 remains optional extensions', async () => {
  const { includesPhase, filterRequirements } = await core();
  assert.equal(includesPhase('M1–M4', 'M2'), true);
  assert.equal(includesPhase('M1–M4', 'M4'), true);
  assert.equal(includesPhase('M1–M4', 'M0'), false);
  assert.deepEqual(filterRequirements(readData().requirements, { phase: 'M5' }).map(r => r.id), ['E01', 'E02']);
});

test('requirement deep links retain the selected ID and invalid routes are safe', async () => {
  const { parseRoute } = await core();
  assert.equal(parseRoute('#requirements/P01').requirementId, 'P01');
  assert.deepEqual(parseRoute('#requirements/S18'), { view: 'requirements', requirementId: 'S18' });
  assert.deepEqual(parseRoute('#architecture'), { view: 'architecture', requirementId: null });
  assert.deepEqual(parseRoute('#requirements/%3Cscript%3E'), { view: 'requirements', requirementId: null });
  assert.deepEqual(parseRoute('#unknown'), { view: 'overview', requirementId: null });
});
