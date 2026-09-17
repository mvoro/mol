import test from 'node:test';
import assert from 'node:assert/strict';
import { createGenerationNotification, getNotificationIndicator, notificationTime } from '../src/notifications.js';

test('ready generation links to one stable result and starts unread', () => {
  const first = createGenerationNotification({ chatId: 'chat-1', messageId: 'reply-2', mode: 'image', title: 'Белый кот', createdAt: 1000 });
  const repeated = createGenerationNotification({ chatId: 'chat-1', messageId: 'reply-2', mode: 'image', createdAt: 2000 });
  assert.equal(first.id, repeated.id);
  assert.equal(first.read, false);
  assert.equal(first.title, 'Изображение готово');
  assert.equal(first.description, 'Белый кот');
  assert.equal(first.chatId, 'chat-1');
  assert.equal(first.messageId, 'reply-2');
});

test('reading a billing error reveals persistent danger until it is resolved', () => {
  const failure = { type: 'billing-error', read: false };
  assert.equal(getNotificationIndicator([failure]), 'unread');
  assert.equal(getNotificationIndicator([{ ...failure, read: true }]), 'danger');
  assert.equal(getNotificationIndicator([{ ...failure, read: true, resolved: true }]), null);
});

test('limited offers remain after reading, expire, and yield to unread results', () => {
  const now = Date.UTC(2026, 8, 17, 12);
  const offer = { type: 'offer', read: true, expiresAt: now + 60_000 };
  assert.equal(getNotificationIndicator([offer], now), 'gift');
  assert.equal(getNotificationIndicator([offer], now + 60_001), null);
  assert.equal(getNotificationIndicator([offer, { type: 'generation', read: false }], now), 'unread');
  assert.equal(getNotificationIndicator([{ type: 'offer', read: true }], now), null);
});

test('relative notification dates handle future or invalid values', () => {
  assert.equal(notificationTime('invalid'), '');
  assert.equal(notificationTime(20_000, 10_000), 'сейчас');
  assert.equal(notificationTime(0, 120_000), '2 мин');
});
