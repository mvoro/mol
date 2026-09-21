const DB_NAME = 'molecula-trends-v1';
let database;
function openDatabase() {
  if (database) return database;
  database = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('Хранилище недоступно')); return; }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('studio');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = null; reject(request.error); };
  });
  return database;
}
export async function loadTrendsStudio() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction('studio').objectStore('studio').get('state');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}
export async function saveTrendsStudio(value) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('studio', 'readwrite');
    transaction.objectStore('studio').put(value, 'state');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('Не удалось сохранить видео'));
  });
}
