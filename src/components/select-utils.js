export function nextSelectIndex(options, current, direction) {
  if (!options.length) return -1;
  for (let step = 1; step <= options.length; step += 1) {
    const index = ((current + direction * step) % options.length + options.length) % options.length;
    if (!options[index].disabled) return index;
  }
  return -1;
}

export function findSelectMatch(options, query, current = -1) {
  const normalize = value => String(value).trim().toLocaleLowerCase('ru');
  const text = normalize(query);
  if (!text) return -1;
  for (let step = 1; step <= options.length; step += 1) {
    const index = (current + step) % options.length;
    if (!options[index].disabled && normalize(options[index].label).startsWith(text)) return index;
  }
  return -1;
}

export function getSelectPlacement(anchor, panelHeight, viewport) {
  const margin = 12;
  const gap = 6;
  const width = Math.min(anchor.width, Math.max(0, viewport.width - margin * 2));
  const left = Math.max(margin + viewport.left, Math.min(anchor.left, viewport.left + viewport.width - width - margin));
  const below = Math.max(0, viewport.top + viewport.height - anchor.bottom - gap - margin);
  const above = Math.max(0, anchor.top - viewport.top - gap - margin);
  const placement = below >= Math.min(panelHeight, 280) || below >= above ? 'bottom' : 'top';
  const maxHeight = Math.min(280, placement === 'bottom' ? below : above);
  const height = Math.min(panelHeight, maxHeight);
  const top = placement === 'bottom' ? anchor.bottom + gap : anchor.top - gap - height;
  return { width, left, top: Math.max(viewport.top + margin, top), maxHeight, placement };
}
