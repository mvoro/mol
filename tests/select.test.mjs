import test from 'node:test';
import assert from 'node:assert/strict';
import { nextSelectIndex, findSelectMatch, getSelectPlacement } from '../src/components/select-utils.js';

test('select navigation skips disabled options, wraps, and permits an empty list', () => {
  const options = [{label:'Первый'},{label:'Недоступный',disabled:true},{label:'Последний'}];
  assert.equal(nextSelectIndex(options, 0, 1), 2);
  assert.equal(nextSelectIndex(options, 2, 1), 0);
  assert.equal(nextSelectIndex(options, 0, -1), 2);
  assert.equal(nextSelectIndex([], -1, 1), -1);
  assert.equal(nextSelectIndex([{disabled:true}], 0, 1), -1);
});

test('typeahead finds Russian labels without selecting disabled matches', () => {
  const options = [{label:'Выключено',disabled:true},{label:'Включено'},{label:'Все проекты'},{label:'Только этот проект'}];
  assert.equal(findSelectMatch(options, 'В', -1), 1);
  assert.equal(findSelectMatch(options, 'в', 1), 2);
  assert.equal(findSelectMatch(options, 'ТОЛЬКО'), 3);
  assert.equal(findSelectMatch(options, 'нет'), -1);
});

test('popup matches the field, prefers below and flips above near the screen bottom', () => {
  const viewport = {left:0,top:0,width:1024,height:768};
  const low = getSelectPlacement({left:300,top:680,bottom:726,width:462}, 108, viewport);
  assert.equal(low.placement, 'top');
  assert.equal(low.top, 566);
  assert.equal(low.width, 462);
  const high = getSelectPlacement({left:300,top:120,bottom:166,width:462}, 108, viewport);
  assert.equal(high.placement, 'bottom');
  assert.equal(high.top, 172);
});

test('long popups stay inside a narrow visual viewport and cap scrolling height', () => {
  const viewport = {left:0,top:100,width:320,height:350};
  const placed = getSelectPlacement({left:8,top:340,bottom:386,width:400}, 900, viewport);
  assert.equal(placed.width, 296);
  assert.equal(placed.left, 12);
  assert.equal(placed.placement, 'top');
  assert.ok(placed.top >= 112);
  assert.ok(placed.top + placed.maxHeight <= 438);
});
