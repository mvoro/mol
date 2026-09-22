import { withBasePath } from './base-path.js';
// Binary attachments live separately from the small JSON conversation snapshots.
function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('molecula-documents', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function storeDocument(file) {
  if (!file.raw || !file.id) return;
  const db = await database();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      transaction.objectStore('files').put(file.raw, file.id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}
export async function readDocument(file, signal) {
  if (file.raw) return file.raw;
  if (file.url && /^(\/documents\/|blob:)/.test(file.url)) {
    const response = await fetch(withBasePath(file.url), { signal });
    if (!response.ok) throw new Error('Не удалось загрузить файл. Проверьте соединение и повторите попытку.');
    return response.blob();
  }
  const db = await database();
  try {
    const blob = await new Promise((resolve, reject) => {
      const request = db.transaction('files').objectStore('files').get(file.id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (!blob) throw new Error('Содержимое этого вложения не сохранено. Прикрепите исходный файл ещё раз.');
    return blob;
  } finally { db.close(); }
}
