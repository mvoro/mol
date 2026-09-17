import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

function loadComponentModule(path) {
  const compiled = buildSync({ entryPoints: [fileURLToPath(new URL(path, import.meta.url))], bundle: true, platform: "node", format: "cjs", external: ["react", "react-dom", "react-dom/*"], jsx: "automatic", loader: { ".css": "empty" }, write: false }).outputFiles[0].text;
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled)(createRequire(import.meta.url), module, module.exports);
  return module.exports;
}
const { ROLE_CATALOG, ROLE_FAVORITES_KEY, ROLE_FAVORITES_EVENT, normalizeRoleFavorites, readRoleFavorites, saveRoleFavorites, resolveCatalogRole } = loadComponentModule("../src/components/role-data.js");
const { resolveRoleAbout, DEFAULT_ROLE_ABOUT } = loadComponentModule("../src/components/RoleAbout.jsx");

test("all 40 role info dialogs use the showcase metadata, illustrations and examples", () => {
  assert.equal(ROLE_CATALOG.length, 40);
  assert.equal(new Set(ROLE_CATALOG.map(role => role.image)).size, 40);
  for (const role of ROLE_CATALOG) {
    const about = resolveRoleAbout(role.name);
    assert.equal(about.name, role.name);
    assert.equal(about.image, role.image);
    assert.equal(about.tagline, role.description);
    assert.deepEqual(about.hints, role.prompts);
    assert.equal(about.hints.length, 3);
  }
});

test("legacy names resolve without confusing content manager with marketplace content manager", () => {
  assert.equal(resolveCatalogRole("Менеджер маркетплейсов").id, "marketplace-content");
  assert.equal(resolveCatalogRole("Промпт-инженер").name, "Промпт Инженер");
  assert.equal(resolveRoleAbout("Контент-менеджер").name, "Контент-менеджер");
  assert.equal(resolveRoleAbout().name, DEFAULT_ROLE_ABOUT.name);
  assert.equal(resolveRoleAbout("Бизнес-аналитик").name, "Бизнес-аналитик");
  assert.equal(resolveRoleAbout({ name: "Промпт-инженер", tagline: "Свой текст" }).tagline, "Свой текст");
});

test("favorites migrate names to IDs and persist the same data with a synchronization event", () => {
  const previousWindow = globalThis.window;
  const storage = new Map([[ROLE_FAVORITES_KEY, JSON.stringify(["Сценарист Reels", "Промпт-инженер", "reels-scenarist"])]]);
  const events = [];
  globalThis.window = { localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, dispatchEvent: event => events.push(event) };
  try {
    assert.deepEqual(readRoleFavorites(), ["reels-scenarist", "prompt-engineer"]);
    assert.deepEqual(normalizeRoleFavorites(["Коуч", "coach", "удалённая роль"]), ["coach"]);
    saveRoleFavorites(["coach", "Сценарист Reels"]);
    assert.deepEqual(readRoleFavorites(), ["coach", "reels-scenarist"]);
    assert.equal(events[0].type, ROLE_FAVORITES_EVENT);
    assert.deepEqual(events[0].detail, ["coach", "reels-scenarist"]);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
