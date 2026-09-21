import { getSettingsOptions } from './components/settings-data.js';

// Prototype estimate: media modifiers use the same prices displayed in settings.
// A server quote can replace this estimate through ChatComposer's cost prop.
export function estimateGenerationCost(mode = 'auto', settings = {}) {
  const modifier = key => getSettingsOptions(mode, key).find(option => option.value === settings[key])?.boost || 0;
  if (mode === 'image') {
    const quality = modifier('quality') || 250;
    const count = Math.min(4, Math.max(1, Number.parseInt(settings.count, 10) || 1));
    return quality * count;
  }
  if (mode === 'video') return 500 + modifier('quality') + modifier('duration') + (settings.sound ? 200 : 0);
  if (mode === 'audio') return 300 + modifier('duration') + (settings.backgroundMusic ? 150 : 0);
  const speed = mode === 'auto' ? ({ 'Быстро': 1, 'Оптимально': 2, 'Глубоко': 3 }[settings.speed] || 1) : 1;
  return speed + (settings.web ? 15 : 0) + (settings.reasoning ? 1 : 0);
}

// Studio estimates share the composer's unit rates; no balance is debited locally.
export function estimateCarouselCost({ count = 5 } = {}) {
  const parsed = Number(count);
  const slides = Number.isFinite(parsed) ? Math.min(10, Math.max(3, Math.round(parsed))) : 5;
  return slides * estimateGenerationCost('image', { quality: '1K', count: '1 шт' });
}

export function estimateTrendCost({ quality = '720' } = {}) {
  return estimateGenerationCost('video', { quality: quality === '1080' ? '1080p' : '720p', sound: false });
}

export function formatGenerationCost(value) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
}
