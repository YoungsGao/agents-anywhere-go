export const views = ['overview', 'requirements', 'architecture', 'roadmap', 'acceptance'];

export function includesPhase(range, phase) {
  if (!phase || phase === 'all') return true;
  const bounds = range.match(/M\d+/g) || [];
  if (!bounds.length || !/^M\d+$/.test(phase)) return false;
  const number = Number(phase.slice(1));
  return number >= Number(bounds[0].slice(1)) && number <= Number(bounds.at(-1).slice(1));
}

export function filterRequirements(requirements, { module = 'all', phase = 'all', query = '' } = {}) {
  const words = query.toLocaleLowerCase().trim().split(/\s+/u).filter(Boolean);
  return requirements.filter(requirement => {
    if (module !== 'all' && requirement.module !== module) return false;
    if (!includesPhase(requirement.phase, phase)) return false;
    const text = `${requirement.id} ${requirement.title} ${requirement.acceptance} ${requirement.phase}`.toLocaleLowerCase();
    return words.every(word => text.includes(word));
  });
}

export function parseRoute(hash) {
  let route;
  try { route = decodeURIComponent(hash.replace(/^#/, '')); }
  catch { route = ''; }
  const [requestedView, requestedId] = route.split('/');
  const view = views.includes(requestedView) ? requestedView : 'overview';
  const requirementId = view === 'requirements' && /^[BSPDE]\d{2}$/.test(requestedId || '') ? requestedId : null;
  return { view, requirementId };
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
