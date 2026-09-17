import { sanitizeGenerationRequest } from './generation-request.js';
export const PROJECTS_KEY = 'molecula-composer-projects';
export const HISTORY_KEY = 'molecula-composer-history';
export const PROJECT_COLORS = ['#e4a257', '#669adb', '#ab8bd0', '#6cae98', '#e97171', '#7a3fff', '#da7bb0', '#8c939e'];
export const PROJECT_SEED = [
  { id: 'p1', name: 'Летняя кампания', color: PROJECT_COLORS[0] },
  { id: 'p2', name: 'Личное', color: PROJECT_COLORS[1] },
];

export function readProjects(storage) {
  const fallback = { projects: PROJECT_SEED, activeId: null };
  try {
    const data = JSON.parse(storage.getItem(PROJECTS_KEY));
    if (!Array.isArray(data?.projects) ||
        !data.projects.every(p => typeof p.id === 'string' && typeof p.name === 'string')) return fallback;
    return { projects: data.projects.map((project, index) => ({...project, color: project.color || PROJECT_COLORS[index % PROJECT_COLORS.length]})), activeId: data.activeId === null || data.projects.some(p => p.id === data.activeId) ? data.activeId : null };
  } catch { return fallback; }
}

export function readHistory(storage) {
  try {
    const data = JSON.parse(storage.getItem(HISTORY_KEY));
    if (!Array.isArray(data)) return [];
    return data.filter(chat => typeof chat.title === 'string' && Array.isArray(chat.messages)).map((chat, index) => ({ ...chat, id: chat.id || `legacy-${index}`, projectId: chat.projectId ?? null }));
  } catch { return []; }
}

export function persist(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)); } catch { /* Private/full storage still permits using the current session. */ }
}

export function conversationSnapshot({ id, projectId, mode, model, values, messages, title }) {
  return {
    id,
    projectId,
    title: title || messages.find(m => m.role === 'user')?.text.slice(0, 60) || 'Новый чат',
    mode,
    model,
    values,
    updatedAt: Date.now(),
    messages: messages.map(message => ({
      ...message,
      ...(message.generation ? {generation:sanitizeGenerationRequest(message.generation)} : {}),
      ...(message.media?.poster?.startsWith('blob:') ? {media:{...message.media,poster:message.media.type === 'video' ? '/media/creative-demo.jpg' : undefined}} : {}),
      files: message.files?.map(file => ({ id: file.id, name: file.name, mime: file.mime || file.type, size: file.size })),
    })),
  };
}

// IDs keep two identically titled chats distinct and updates in the same chat together.
export function upsertConversation(history, conversation) {
  const existing = history.find(chat => chat.id === conversation.id);
  return [{ ...existing, ...conversation }, ...history.filter(chat => chat.id !== conversation.id)].slice(0, 100);
}

export function moveConversation(history, id, projectId) {
  return history.map(chat => chat.id === id ? { ...chat, projectId } : chat);
}

// General history contains only unassigned chats; archives keep the same owner.
export function selectHistory(history, projectId = null, archived = false) {
  return history.filter(chat => (chat.projectId ?? null) === projectId && Boolean(chat.archived) === archived)
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
}
