const STANDALONE_PAGES = new Set(['components', 'roles', 'carousel', 'trends']);

// A studio visit leaves the conversation mounted. Returning to that same
// conversation must not call newChat/openHistory and discard its local draft.
export function resolveAppNavigation(location, {
  projects = [], history = [], conversationRoute = 'chat',
  currentChatId = null, activeProjectId = null,
} = {}) {
  const page = location.pathname.slice(1);
  if (STANDALONE_PAGES.has(page)) return { route: page, preserveConversation: true };

  const params = new URLSearchParams(location.search);
  const chatId = params.get('chat');
  if (chatId && history.some(chat => chat.id === chatId)) return {
    route: 'chat', chatId,
    preserveConversation: conversationRoute === 'chat' && currentChatId === chatId,
  };

  const projectId = params.get('project');
  if (projectId && projects.some(project => project.id === projectId)) return {
    route: 'project', projectId,
    preserveConversation: conversationRoute === 'project' && activeProjectId === projectId,
  };

  return { route: 'chat', projectId: null, preserveConversation: conversationRoute === 'chat' };
}
