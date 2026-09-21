export const DOCUMENT_DEMO_ID = 'molecula-document-demo-v1';
export function documentFormat(file) {
  const extension = file?.name?.split('.').pop()?.toLowerCase();
  return ['pdf', 'docx', 'md'].includes(extension) ? extension : null;
}
export function panelBounds(total) {
  return { min: Math.min(300, total), max: Math.max(Math.min(300, total), total - 360) };
}
export function panelWidth(width, total) {
  const { min, max } = panelBounds(total);
  return Math.min(max, Math.max(min, width));
}
export function ensureDocumentDemo(history) {
  if (history.some(chat => chat.id === DOCUMENT_DEMO_ID)) return history;
  const formats = ['pdf', 'docx', 'md'];
  return [{ id: DOCUMENT_DEMO_ID, title: 'Демо: просмотр документов', projectId: null, mode: 'auto', model: 'Молли 1.0', updatedAt: 1790000000000,
    messages: [
      { id: 'document-demo-intro', role: 'assistant', model: 'Молли 1.0', text: 'Три документа об одной идее: небольшой городской сад. Откройте вложение, чтобы прочитать его рядом с чатом. Панель можно растянуть, развернуть или скрыть.' },
      ...formats.map((format, index) => ({ id: `document-demo-${format}`, role: 'user', text: ['План проекта в PDF — три страницы с этапами и бюджетом.', 'Редакционный бриф в Word с таблицей и иллюстрацией.', 'Заметки в Markdown со списками, цитатой и примером кода.'][index], files: [{ id: `garden-${format}`, name: `Городской сад.${format}`, url: `/documents/garden.${format}`, mime: {pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',md:'text/markdown'}[format] }] })),
    ],
  }, ...history];
}
