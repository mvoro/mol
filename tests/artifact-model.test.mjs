import test from 'node:test';
import assert from 'node:assert/strict';
import { documentFormat, ensureDocumentDemo, panelBounds, panelWidth, DOCUMENT_DEMO_ID } from '../src/artifact-model.js';
import { conversationSnapshot } from '../src/project-history.js';
test('document demo seeds once and preserves user conversations', () => {
  const user = {id:'user',title:'My notes',messages:[]};
  const first = ensureDocumentDemo([user]);
  assert.equal(first.length,2); assert.equal(first[1],user);
  assert.equal(first[0].id,DOCUMENT_DEMO_ID);
  assert.equal(ensureDocumentDemo(first),first);
  const snapshot = conversationSnapshot({...first[0]});
  assert.deepEqual(snapshot.messages.filter(m=>m.files).flatMap(m=>m.files.map(f=>f.url)), ['/documents/garden.pdf','/documents/garden.docx','/documents/garden.md']);
});
test('panel keeps free widths near quarters and respects both minima', () => {
  assert.equal(panelWidth(492,1000),492);
  assert.equal(panelWidth(530,1000),530);
  assert.equal(panelWidth(249,1000),300);
  assert.equal(panelWidth(749,1000),640);
  for (const target of [400,800,1200]) assert.equal(panelWidth(target+12,1600),target+12);
  assert.equal(panelWidth(790,1000),640);
  assert.deepEqual(panelBounds(700),{min:300,max:340});
});
test('only supported document extensions open previews, case insensitive', () => {
  for (const type of ['PDF','docx','md']) assert.equal(documentFormat({name:`brief.${type}`}),type.toLowerCase());
  assert.equal(documentFormat({name:'photo.png'}),null);
});
test('snapshots never persist transient blob URLs or raw document bytes', () => {
 const snapshot=conversationSnapshot({id:'a',messages:[{role:'user',text:'Hi',files:[{id:'file',name:'note.md',url:'blob:temporary',raw:{},size:3}]}]});
 assert.equal(snapshot.messages[0].files[0].url,undefined);
 assert.equal(snapshot.messages[0].files[0].raw,undefined);
 assert.equal(snapshot.messages[0].files[0].id,'file');
});
