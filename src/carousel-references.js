export const MAX_CAROUSEL_REFERENCES = 5;
export const MAX_CAROUSEL_REFERENCE_BYTES = 15 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const REFERENCE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const DATABASE = 'molecula-carousel-references-v1';
const STORE = 'photos';

export function isCarouselReferenceId(id) { return typeof id === 'string' && REFERENCE_ID.test(id); }

/** Persist only known metadata fields; a reference is never a URL or a filesystem path. */
export function normalizeCarouselReference(value) {
  if (!value || !isCarouselReferenceId(value.id) || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 240 || /[\\/\u0000-\u001f\u007f]/u.test(value.name)) return null;
  if (!IMAGE_TYPES.has(value.type) || !Number.isInteger(value.size) || value.size < 1 || value.size > MAX_CAROUSEL_REFERENCE_BYTES) return null;
  if (!Number.isInteger(value.width) || !Number.isInteger(value.height) || value.width < 128 || value.height < 128 || value.width * value.height > 48_000_000) return null;
  return { id: value.id, name: value.name, type: value.type, size: value.size, width: value.width, height: value.height };
}

export function validateCarouselReferenceFiles(files, existingCount = 0) {
  const batch = Array.from(files || []);
  if (!Number.isInteger(existingCount) || existingCount < 0 || batch.length + existingCount > MAX_CAROUSEL_REFERENCES) return 'Можно прикрепить до 5 фото-референсов.';
  if (batch.some(file => !IMAGE_TYPES.has(file?.type))) return 'Выберите фотографии в формате JPG, PNG или WebP.';
  if (batch.some(file => !Number.isFinite(file?.size) || file.size <= 0 || file.size > MAX_CAROUSEL_REFERENCE_BYTES)) return 'Каждое фото должно весить не больше 15 МБ.';
  return '';
}

async function dimensions(file) {
  // Check the signature as well as the supplied MIME type before decoding user files.
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!(jpeg || png || webp)) throw new Error('Не удалось прочитать фото. Выберите JPG, PNG или WebP.');
  if (typeof createImageBitmap === 'function') {
    const picture = await createImageBitmap(file);
    try { return { width: picture.width, height: picture.height }; } finally { picture.close(); }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const picture = new Image();
      picture.onload = () => resolve({ width: picture.naturalWidth, height: picture.naturalHeight });
      picture.onerror = () => reject(new Error('Не удалось прочитать фото. Выберите другой файл.'));
      picture.src = url;
    });
  } finally { URL.revokeObjectURL(url); }
}

function openReferenceStore() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('Браузер не поддерживает сохранение фото-референсов.')); return; }
    let blocked = false;
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE); };
    request.onsuccess = () => {
      if (blocked) { request.result.close(); return; }
      request.result.onversionchange = () => request.result.close(); resolve(request.result);
    };
    request.onerror = () => reject(new Error('Не удалось открыть хранилище фото. Проверьте настройки браузера.'));
    request.onblocked = () => { blocked = true; reject(new Error('Закройте другие вкладки приложения и попробуйте загрузить фото снова.')); };
  });
}

async function referenceTransaction(mode, operation) {
  const database = await openReferenceStore();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, mode);
      const request = operation(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = transaction.onabort = () => reject(new Error('Не удалось сохранить или прочитать фото в браузере. Проверьте свободное место и попробуйте снова.'));
    });
  } finally { database.close(); }
}

export async function saveCarouselReference(file) {
  const error = validateCarouselReferenceFiles([file]);
  if (error) throw new Error(error);
  let size;
  try { size = await dimensions(file); } catch { throw new Error('Не удалось прочитать фото. Выберите другой файл в формате JPG, PNG или WebP.'); }
  if (size.width < 128 || size.height < 128) throw new Error('Выберите фото размером от 128 × 128 пикселей.');
  if (size.width * size.height > 48_000_000) throw new Error('Фото слишком большое. Выберите изображение до 48 мегапикселей.');
  const metadata = { id: crypto.randomUUID(), name: String(file.name || 'Фото-референс').replace(/[\\/\u0000-\u001f\u007f]/gu, '-').slice(0, 240) || 'Фото-референс', type: file.type, size: file.size, ...size };
  await referenceTransaction('readwrite', store => store.put(file, metadata.id));
  return metadata;
}

export async function readCarouselReference(id) {
  if (!isCarouselReferenceId(id)) return null;
  const value = await referenceTransaction('readonly', store => store.get(id));
  return value instanceof Blob ? value : null;
}
