import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAppNavigation } from '../src/app-navigation.js';

const projects = [{ id: 'project-a' }, { id: 'project-b' }];
const history = [{ id: 'chat-a' }, { id: 'chat-b' }];
const projectContext = { projects, history, conversationRoute: 'project', activeProjectId: 'project-a' };
const chatContext = { projects, history, conversationRoute: 'chat', currentChatId: 'chat-a', activeProjectId: 'project-a' };

test('direct studio routes take priority over unrelated project query parameters', () => {
  for (const page of ['carousel', 'trends']) {
    assert.deepEqual(resolveAppNavigation({ pathname: `/${page}`, search: '?project=project-a' }, projectContext), { route: page, preserveConversation: true });
  }
});

test('back and forward through studios preserve an unsent project workspace draft', () => {
  assert.deepEqual(resolveAppNavigation({ pathname: '/', search: '?project=project-a' }, projectContext), { route: 'project', projectId: 'project-a', preserveConversation: true });
  assert.deepEqual(resolveAppNavigation({ pathname: '/', search: '?project=project-b' }, projectContext), { route: 'project', projectId: 'project-b', preserveConversation: false });
});

test('returning to a shared chat keeps its draft while opening another chat loads it', () => {
  assert.deepEqual(resolveAppNavigation({ pathname: '/', search: '?chat=chat-a' }, chatContext), { route: 'chat', chatId: 'chat-a', preserveConversation: true });
  assert.deepEqual(resolveAppNavigation({ pathname: '/', search: '?chat=chat-b' }, chatContext), { route: 'chat', chatId: 'chat-b', preserveConversation: false });
});

test('ordinary chat URLs preserve project-owned conversations after a studio visit', () => {
  assert.deepEqual(resolveAppNavigation({ pathname: '/', search: '' }, chatContext), { route: 'chat', projectId: null, preserveConversation: true });
  assert.deepEqual(resolveAppNavigation({ pathname: '/', search: '' }, projectContext), { route: 'chat', projectId: null, preserveConversation: false });
});

test('deleted project and chat links fall back to a general chat', () => {
  assert.deepEqual(resolveAppNavigation({ pathname: '/', search: '?project=deleted&chat=deleted' }, projectContext), { route: 'chat', projectId: null, preserveConversation: false });
});
