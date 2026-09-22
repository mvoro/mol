export const APP_BASE = import.meta.env?.BASE_URL ?? '/';

// Public files and app routes share the deployment prefix. Keep uploaded files,
// external URLs and already-prefixed history entries unchanged.
export function withBasePath(path, base = APP_BASE) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return path;
  const prefix = `${base.replace(/\/+$/, '')}/`;
  if (prefix === '/' || path === prefix.slice(0, -1) || path.startsWith(prefix)) return path;
  return `${prefix}${path.slice(1)}`;
}

export function withoutBasePath(pathname, base = APP_BASE) {
  const prefix = `${base.replace(/\/+$/, '')}/`;
  if (pathname === prefix.slice(0, -1)) return '/';
  return prefix !== '/' && pathname.startsWith(prefix) ? `/${pathname.slice(prefix.length)}` : pathname;
}
