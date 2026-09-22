import { withBasePath } from '../base-path.js';
import catalog from "./roles-catalog.json";
import { ROLE_PROMPTS } from "./role-prompts.js";

export const ROLE_CATALOG = catalog.map(role => ({ ...role, image: withBasePath(role.image), prompts: ROLE_PROMPTS[role.name] || [] }));
export const ROLE_FAVORITES_KEY = "molecula-role-favorites-v1";
export const ROLE_FAVORITES_EVENT = "molecula-role-favorites-change";
export const DEFAULT_ROLE_FAVORITES = ["reels-scenarist", "prompt-engineer", "psychologist"];

const normalized = value => String(value || "").trim().toLocaleLowerCase("ru").replace(/ё/g, "е").replace(/[‐‑–—]/g, "-").replace(/\s+/g, " ");
const aliases = {
  "менеджер маркетплейсов": "marketplace-content",
  "контент-менеджер маркетплейса": "marketplace-content",
  "промпт-инженер": "prompt-engineer",
  "промпт инженер": "prompt-engineer",
  "сценарист рилс": "reels-scenarist",
  "инста-карусели": "carousels",
  "телеграм-копирайтер": "telegram-copywriter",
  "телеграм-редактор": "telegram-copywriter",
  "smm-стратег": "smm-manager",
  "сторис-мейкер": "stories",
};

export function resolveCatalogRole(value) {
  const name = normalized(value && typeof value === "object" ? value.id || value.name : value);
  return ROLE_CATALOG.find(role => role.id === name || normalized(role.name) === name || role.id === aliases[name]) || null;
}

export function normalizeRoleFavorites(value) {
  return [...new Set((Array.isArray(value) ? value : DEFAULT_ROLE_FAVORITES).map(item => resolveCatalogRole(item)?.id).filter(Boolean))];
}

export function readRoleFavorites() {
  try {
    const stored = window.localStorage.getItem(ROLE_FAVORITES_KEY);
    return normalizeRoleFavorites(stored === null ? DEFAULT_ROLE_FAVORITES : JSON.parse(stored));
  } catch { return [...DEFAULT_ROLE_FAVORITES]; }
}

export function saveRoleFavorites(value) {
  const next = normalizeRoleFavorites(value);
  try { window.localStorage.setItem(ROLE_FAVORITES_KEY, JSON.stringify(next)); } catch { /* Keep favorites usable for this session. */ }
  window.dispatchEvent(new CustomEvent(ROLE_FAVORITES_EVENT, { detail: next }));
  return next;
}
