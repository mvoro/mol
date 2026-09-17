export const UI_OUTLINE_WIDTH = 1.5;

// The regular/light/thin Phosphor contours occupy 16/12/8 units in a 256 viewBox.
// Pick a contour no thicker than the target, then add the exact missing width.
export function getOutlineMetrics(size) {
  const pixels = Number(size) || 24;
  const weight = pixels <= 24 ? "regular" : pixels <= 32 ? "light" : "thin";
  const units = { regular: 16, light: 12, thin: 8 }[weight];
  return { weight, offset: Math.max(0, UI_OUTLINE_WIDTH - pixels * units / 256) };
}
