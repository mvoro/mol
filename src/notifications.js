const GENERATION_TITLES = {
  image: 'Изображение готово',
  video: 'Видео готово',
  audio: 'Аудио готово',
  text: 'Ответ готов',
  auto: 'Ответ Молли готов',
};

export function createGenerationNotification({ chatId, messageId, mode = 'auto', title, thumbnail, createdAt = Date.now() }) {
  return {
    id: `generation-${chatId}-${messageId}`,
    type: 'generation',
    title: GENERATION_TITLES[mode] || GENERATION_TITLES.auto,
    description: title || 'Откройте чат, чтобы посмотреть результат',
    chatId, messageId, mode, thumbnail, createdAt, read: false,
    actionLabel: 'Открыть результат',
  };
}

export function getNotificationIndicator(notifications, now = Date.now()) {
  if (notifications.some(item => item.type !== 'offer' && !item.read)) return 'unread';
  if (notifications.some(item => item.type === 'billing-error' && !item.resolved)) return 'danger';
  if (notifications.some(item => item.type === 'offer' && (!item.expiresAt || new Date(item.expiresAt).getTime() > now) && (!item.read || item.expiresAt))) return 'gift';
  return null;
}

export function notificationTime(createdAt, now = Date.now()) {
  const timestamp = new Date(createdAt).getTime();
  if (!Number.isFinite(timestamp)) return '';
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 60) return seconds < 10 ? 'сейчас' : `${seconds} сек`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} мин`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} дн`;
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(timestamp);
}
