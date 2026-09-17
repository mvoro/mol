export function imageCrop(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;
  const width = sourceRatio > targetRatio ? sourceHeight * targetRatio : sourceWidth;
  const height = sourceRatio > targetRatio ? sourceHeight : sourceWidth / targetRatio;
  return { x: (sourceWidth - width) / 2, y: (sourceHeight - height) / 2, width, height };
}
export async function downloadImageResult(media) {
  const picture = new Image();
  picture.src = media.src;
  await picture.decode();
  const canvas = document.createElement('canvas');
  canvas.width = media.width || picture.naturalWidth;
  canvas.height = media.height || picture.naturalHeight;
  const crop = imageCrop(picture.naturalWidth, picture.naturalHeight, canvas.width, canvas.height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');
  context.drawImage(picture, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Image export failed');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `molecula-${media.id || 'image'}-${canvas.width}x${canvas.height}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
