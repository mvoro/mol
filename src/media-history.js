// Current messages take precedence over persisted snapshots of the same result.
export function collectReadyMedia(history, messages) {
  const seen = new Set();
  const items = [];
  const sources = [...messages].reverse().concat(history.flatMap(chat => [...chat.messages].reverse()));
  for (const message of sources) {
    if (!message.id || seen.has(message.id)) continue;
    seen.add(message.id);
    const media = message.media || (message.preview ? { type: 'image', src: message.preview, ready: true, model: message.model, title: 'Пример изображения' } : null);
    if (!media?.ready || !media.src || !['image', 'video', 'audio'].includes(media.type)) continue;
    const variants = media.variants?.length ? media.variants : [media];
    variants.forEach((item, index) => items.push({ ...item, ready: media.ready, id: index === 0 ? message.id : `${message.id}-${index}` }));
  }
  return items;
}
