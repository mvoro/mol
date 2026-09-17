import test from 'node:test';
import assert from 'node:assert/strict';
import { mentionQuery, normalizeParts, partsText, trimParts, filterPhotos } from '../src/prompt-mentions.js';
const photos = [{id:'a', name:'Фото 1.jpg', mime:'image/jpeg'}, {id:'b', name:'Фото 1.jpg', mime:'image/jpeg'}, {id:'c',name:'Фон.png',mime:'image/png'}, {id:'d',name:'Report.pdf',mime:'application/pdf'}];
test('mention query respects caret, email boundaries and lines', () => {
  assert.deepEqual(mentionQuery('Замени фон на @Фо затем',17), { start:14,end:17,query:'Фо' });
  assert.equal(mentionQuery('mail@example.com',16),null);
  assert.equal(mentionQuery('@Фото\nдалее',11),null);
  assert.equal(mentionQuery('@Фото 1',7).query,'Фото 1');
});
test('identically named attachments retain distinct IDs and removed files become plain text', () => {
  const parts = [{type:'attachment',fileId:'a',name:'stale'}, {type:'text',text:' и '}, {type:'attachment',fileId:'b',name:'Фото 1.jpg'}];
  assert.deepEqual(normalizeParts(parts,photos).filter(p=>p.type==='attachment').map(p=>p.fileId),['a','b']);
  const removed = normalizeParts(parts,photos.filter(p=>p.id!=='b'));
  assert.equal(removed.filter(p=>p.type==='attachment').length,1);
  assert.equal(partsText(removed),'@Фото 1.jpg и Фото 1.jpg');
});
test('trim preserves structured references and filters only attached photos', () => {
  const parts=trimParts([{type:'text',text:'  '},{type:'attachment',fileId:'a',name:'Фото 1.jpg'},{type:'text',text:'\n'}]);
  assert.equal(parts.length,1);
  assert.deepEqual(filterPhotos(photos,'фото 1').map(p=>p.id),['a','b']);
  assert.deepEqual(filterPhotos(photos,'report'),[]);
});
test('malformed clipboard payload cannot create hidden references', () => {
  assert.deepEqual(normalizeParts([null,42,{type:'attachment',fileId:'unknown',name:'Фото'},{type:'text',text:' текст'}],photos),[{type:'text',text:'Фото текст'}]);
});
