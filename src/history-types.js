const CHAT_MODES = new Set(["auto", "text", "image", "video", "audio"]);
const MEDIA_TYPES = new Set(["image", "video", "audio"]);

export function getChatModes(chat) {
  const modes = new Set();
  for (const message of Array.isArray(chat?.messages) ? chat.messages : []) {
    if (message?.role !== "assistant") continue;
    if (CHAT_MODES.has(message.mode)) modes.add(message.mode);
    if (MEDIA_TYPES.has(message.media?.type)) modes.add(message.media.type);
  }
  return modes.size
    ? [...modes]
    : [CHAT_MODES.has(chat?.mode) ? chat.mode : "auto"];
}
