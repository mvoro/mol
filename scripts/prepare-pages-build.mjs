import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { STANDALONE_PAGES } from '../src/app-navigation.js';

const client = new URL('../dist/client/', import.meta.url);
const index = new URL('index.html', client);

// Pages has no SPA rewrite server. Real entry files make direct links and
// reloads of each app route return HTTP 200, while Vite keeps assets under /mol/.
for (const route of STANDALONE_PAGES) {
  const folder = new URL(`${route}/`, client);
  mkdirSync(folder, { recursive: true });
  copyFileSync(index, new URL('index.html', folder));
}
copyFileSync(index, new URL('404.html', client));
writeFileSync(new URL('.nojekyll', client), '');
console.log(`Prepared GitHub Pages site: ${fileURLToPath(client)}`);
