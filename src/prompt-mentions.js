export const isPhotoAttachment = file => Boolean(file?.id) && (/^image\//i.test(file.mime || file.type || '') || /\.(png|jpe?g|webp|gif|avif|heic)$/i.test(file.name || ''));
export const partsText = parts => parts.map(part => part.type === 'attachment' ? `@${part.name}` : part.text || '').join('');
export function normalizeParts(parts, files) {
  const registry = new Map(files.filter(isPhotoAttachment).map(file => [file.id, file]));
  const result = [];
  for (const part of Array.isArray(parts) ? parts : []) {
    if (!part || typeof part !== 'object') continue;
    const file = part.type === 'attachment' && registry.get(part.fileId);
    const next = file ? { type: 'attachment', fileId: file.id, name: file.name } : { type: 'text', text: part.type === 'attachment' ? String(part.name || '') : String(part.text || '') };
    if (next.type === 'text' && !next.text) continue;
    if (next.type === 'text' && result.at(-1)?.type === 'text') result.at(-1).text += next.text;
    else result.push(next);
  }
  return result;
}
export function trimParts(parts) {
  const next = parts.map(part => ({ ...part }));
  while (next[0]?.type === 'text') { next[0].text = next[0].text.trimStart(); if (next[0].text) break; next.shift(); }
  while (next.at(-1)?.type === 'text') { next.at(-1).text = next.at(-1).text.trimEnd(); if (next.at(-1).text) break; next.pop(); }
  return next;
}
export function mentionQuery(text, caret) {
  const before = text.slice(0, caret);
  const match = /(?:^|[\s(])@([^@\n]{0,80})$/u.exec(before);
  return match ? { start: before.length - match[1].length - 1, end: caret, query: match[1] } : null;
}
export function filterPhotos(files, query) {
  const search = query.toLocaleLowerCase().trim();
  return files.filter(isPhotoAttachment).filter(file => !search || file.name.toLocaleLowerCase().includes(search));
}
