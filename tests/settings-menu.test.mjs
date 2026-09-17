import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Compile the real JSX without a browser or an application build.
const compiled = buildSync({
  entryPoints: [fileURLToPath(new URL("../src/components/SettingsMenu.jsx", import.meta.url))],
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["react", "react-dom", "react-dom/*"],
  jsx: "automatic",
  loader: { ".css": "empty" },
  write: false,
}).outputFiles[0].text;
const componentModule = { exports: {} };
new Function("require", "module", "exports", compiled)(
  createRequire(import.meta.url),
  componentModule,
  componentModule.exports,
);
const { SettingsMenu, getSettingsMenuPresentation, getSettingsPanelPlacement } = componentModule.exports;

const cases = [
  ["auto", "speed", "Глубоко"],
  ["auto", "role", "Копирайтер"],
  ["text", "role", "Маркетолог"],
  ["image", "ratio", "9:16"],
  ["image", "quality", "4K"],
  ["image", "count", "3 шт"],
  ["video", "ratio", "4:3"],
  ["video", "quality", "1080p"],
  ["video", "duration", "10 с"],
  ["audio", "voice", "Рома"],
  ["audio", "language", "Английский"],
  ["audio", "duration", "1 мин"],
];

test("every quick setting renders one value panel and preserves its selected value", () => {
  const previousWindow = globalThis.window;
  globalThis.window = { matchMedia: () => ({ matches: false }) };
  try {
    for (const [mode, menu, value] of cases) {
      const html = renderToStaticMarkup(createElement(SettingsMenu, {
        mode, menu, values: { [menu]: value },
      }));
      const label = `${mode}/${menu}`;
      assert.equal((html.match(/class="settings-panel /g) || []).length, 1, label);
      assert.ok(html.includes(`settings-direct-${menu}`), label);
      assert.ok(!html.includes("settings-submenu"), label);
      assert.ok(!html.includes("Настройки чата"), label);
      assert.ok(!html.includes("settings-back"), label);
      assert.ok(!html.includes("Прикрепить фото и файлы"), label);
      assert.ok(!html.includes("Добавить фото или файл"), label);
      const selected = (html.match(/<button[^>]*aria-pressed="true"[^>]*>[\s\S]*?<\/button>/g) || []).filter(button => !button.includes('settings-favorite'));
      assert.equal(selected.length, 1, label);
      assert.ok(selected[0].includes(value), label);
    }
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("only a flow entered through plus offers a submenu and back navigation", () => {
  assert.deepEqual(getSettingsMenuPresentation("main"), {
    direct: false, canGoBack: false, showSubmenu: false,
  });
  for (const menu of new Set(cases.map(([, menu]) => menu))) {
    assert.deepEqual(getSettingsMenuPresentation(menu), {
      direct: true, canGoBack: false, showSubmenu: false,
    }, menu);
    assert.deepEqual(getSettingsMenuPresentation("main", menu), {
      direct: false, canGoBack: true, showSubmenu: true,
    }, menu);
  }
});

test("role picker shows all catalog roles, shared favorites, and a selected legacy role", () => {
  const previousWindow = globalThis.window;
  globalThis.window = {
    matchMedia: () => ({ matches: false }),
    localStorage: { getItem: () => JSON.stringify(["coach", "reels-scenarist"]) },
  };
  try {
    const html = renderToStaticMarkup(createElement(SettingsMenu, { mode: "text", menu: "role", values: { role: "Бизнес-аналитик" } }));
    assert.equal((html.match(/class="settings-role-select"/g) || []).length, 42);
    assert.ok(html.includes('aria-label="Убрать из избранного: Коуч" aria-pressed="true"'));
    assert.ok(html.includes('aria-label="Убрать из избранного: Сценарист Reels" aria-pressed="true"'));
    assert.match(html, /class="settings-role-select" aria-pressed="true"[^>]*>[\s\S]*?Бизнес-аналитик/);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("plus still renders the main menu for all five composer modes", () => {
  const previousWindow = globalThis.window;
  globalThis.window = { matchMedia: () => ({ matches: false }) };
  try {
    for (const mode of ["auto", "text", "image", "video", "audio"]) {
      const html = renderToStaticMarkup(createElement(SettingsMenu, { mode, menu: "main" }));
      assert.ok(html.includes("Настройки чата"), mode);
      assert.ok(!html.includes("settings-direct"), mode);
      assert.equal((html.match(/class="settings-panel /g) || []).length, 1, mode);
    }
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("standalone popovers use the chip anchor and clamp at viewport edges", () => {
  for (const mainWidth of [264, 300, 364]) {
    for (const viewportWidth of [701, 1024, 1440]) {
      for (const anchorLeft of [12, viewportWidth / 2, viewportWidth - 24]) {
        const position = getSettingsPanelPlacement({
          anchorLeft, anchorTop: 600, mainWidth, mainHeight: 240,
          viewportWidth, viewportHeight: 800,
        });
        assert.equal(position.top, 352);
        assert.ok(position.left >= 12);
        assert.ok(position.left + mainWidth <= viewportWidth - 12);
        assert.equal(position.submenuLeft, undefined);
      }
    }
  }
});
