import test from "node:test";
import assert from "node:assert/strict";
import { getChatModes } from "../src/history-types.js";

test("a mixed conversation keeps each assistant mode once in conversation order", () => {
  assert.deepEqual(
    getChatModes({
      mode: "audio",
      messages: [
        { role: "assistant", mode: "text" },
        { role: "assistant", mode: "image", media: { type: "image" } },
        { role: "assistant", mode: "text" },
        { role: "assistant", mode: "video", media: { type: "video" } },
        { role: "assistant", mode: "audio", media: { type: "audio" } },
      ],
    }),
    ["text", "image", "video", "audio"],
  );
});

test("Molly and its actual media result both contribute modes", () => {
  assert.deepEqual(
    getChatModes({
      messages: [
        { role: "assistant", mode: "auto", media: { type: "image" } },
        { role: "assistant", mode: "auto", media: { type: "video" } },
      ],
    }),
    ["auto", "image", "video"],
  );
});

test("user attachments and unrelated titles never imply an assistant mode", () => {
  assert.deepEqual(
    getChatModes({
      title: "Создать видео и картинку",
      messages: [
        { role: "user", mode: "video", media: { type: "image" } },
        { role: "assistant", mode: "text" },
      ],
    }),
    ["text"],
  );
});

test("legacy and malformed conversations fall back to a valid saved mode or Molly", () => {
  assert.deepEqual(getChatModes({ mode: "audio", messages: [] }), ["audio"]);
  assert.deepEqual(
    getChatModes({
      mode: "unknown",
      messages: [
        { role: "assistant", mode: "unknown", media: { type: "unknown" } },
      ],
    }),
    ["auto"],
  );
  assert.deepEqual(getChatModes({ messages: null }), ["auto"]);
  assert.deepEqual(getChatModes(), ["auto"]);
});
