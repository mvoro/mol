import test from 'node:test';
import assert from 'node:assert/strict';
import { readProjects, readHistory, conversationSnapshot, upsertConversation, moveConversation } from '../src/project-history.js';

test('legacy chats remain readable and unassigned', () => {
  const chats = readHistory({ getItem: () => JSON.stringify([{ title: 'Старый чат', mode: 'auto', messages: [] }]) });
  assert.equal(chats[0].projectId, null);
  assert.equal(chats[0].id, 'legacy-0');
});

test('same titles do not merge different chats; continuing a chat updates it', () => {
  const first = { id: 'one', title: 'Идеи', messages: [] };
  const second = { id: 'two', title: 'Идеи', messages: [] };
  const history = upsertConversation([first], second);
  assert.equal(history.length, 2);
  const updated = upsertConversation(history, { ...first, messages: [{ text: 'Ответ' }] });
  assert.equal(updated.length, 2);
  assert.equal(updated[0].messages[0].text, 'Ответ');
});

test('moving a chat changes its project without losing messages or duplicating it', () => {
  const history = [{ id: 'one', projectId: 'p1', messages: [{ text: 'Ответ' }] }, { id: 'two', projectId: 'p1', messages: [] }];
  const moved = moveConversation(history, 'one', 'p2');
  assert.equal(moved[0].projectId, 'p2');
  assert.deepEqual(moved[0].messages, history[0].messages);
  assert.equal(moved[1], history[1]);
  assert.equal(moveConversation(moved, 'one', null)[0].projectId, null);
});

test('snapshot keeps file metadata without persisting expired blob URLs or File objects', () => {
  const snapshot = conversationSnapshot({ id: 'one', projectId: 'p1', mode: 'text', messages: [{ role: 'user', text: 'Вложение', files: [{ name: 'a.png', mime: 'image/png', url: 'blob:ephemeral', raw: { private: true } }] }] });
  assert.equal(snapshot.title, 'Вложение');
  assert.equal(snapshot.messages[0].files[0].name, 'a.png');
  assert.ok(!JSON.stringify(snapshot).includes('ephemeral'));
  assert.ok(!JSON.stringify(snapshot).includes('private'));
});

test('project state restores no-project and rejects malformed storage', () => {
  assert.equal(readProjects({ getItem: () => JSON.stringify({ projects: [{ id: 'x', name: 'X' }], activeId: null }) }).activeId, null);
  assert.equal(readProjects({ getItem: () => '{broken' }).activeId, null);
});

test('deleting every project does not restore seed projects on reload', () => {
  assert.deepEqual(readProjects({ getItem: () => JSON.stringify({ projects: [], activeId: null }) }), { projects: [], activeId: null });
});

test('project settings and folder color survive restoration', () => {
  const project = { id: 'p', name: 'Проект', color: '#7a3fff', instructions: 'Кратко', memory: 'project', libraryAccess: false };
  assert.deepEqual(readProjects({ getItem: () => JSON.stringify({ projects: [project], activeId: 'deleted' }) }), { projects: [project], activeId: null });
});

test('snapshot preserves image mentions and frame identity without a transient file URL', () => {
  const prompt = { version: 1, parts: [{ type: 'text', text: 'Оживи ' }, { type: 'attachment', fileId: 'frame-1', name: 'Кадр.jpg' }] };
  const snapshot = conversationSnapshot({ id:'chat-mentions', title:'Мой ролик', projectId:null, mode:'video', model:'Kling', values:{}, messages:[{ id:'u', role:'user', text:'Оживи @Кадр.jpg', prompt, files:[{id:'frame-1',name:'Кадр.jpg',mime:'image/jpeg',url:'blob:temporary',raw:{},size:100}] }] });
  assert.equal(snapshot.title,'Мой ролик');
  assert.deepEqual(snapshot.messages[0].prompt,prompt);
  assert.equal(snapshot.messages[0].files[0].id,'frame-1');
  assert.equal(snapshot.messages[0].files[0].url,undefined);
});

test('general history excludes project chats and archives; pinned chats stay first', async () => {
  const { selectHistory } = await import('../src/project-history.js');
  const chats = [{id:'p',projectId:'p1'},{id:'a',projectId:null},{id:'pin',pinned:true},{id:'archive',projectId:null,archived:true}];
  assert.deepEqual(selectHistory(chats).map(chat=>chat.id), ['pin','a']);
  assert.deepEqual(selectHistory(chats,'p1').map(chat=>chat.id), ['p']);
  assert.deepEqual(selectHistory(chats,null,true).map(chat=>chat.id), ['archive']);
});

test('saving another answer preserves pin and archive flags', () => {
  const updated = upsertConversation([{id:'one', pinned:true, archived:true, messages:[]}], {id:'one',messages:[{text:'Новый ответ'}]});
  assert.equal(updated[0].pinned,true);
  assert.equal(updated[0].archived,true);
  assert.equal(updated[0].messages[0].text,'Новый ответ');
});

test('snapshot strips transient generation attachments and video poster', () => {
  const snapshot = conversationSnapshot({id:'media',projectId:null,mode:'video',messages:[{role:'user',text:'Ролик'},{role:'assistant',generation:{attachments:[{id:'file',name:'a.png',raw:{binary:true},url:'blob:expired'}],references:[]},media:{type:'video',poster:'blob:expired',src:'/media/creative-demo.mp4'}}]});
  assert.equal(snapshot.messages[1].generation.attachments[0].raw,undefined);
  assert.equal(snapshot.messages[1].generation.attachments[0].url,undefined);
  assert.equal(snapshot.messages[1].media.poster,'/media/creative-demo.jpg');
});
