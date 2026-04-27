import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export function formatLandmark(lm: NormalizedLandmark | undefined): string {
  if (lm == null) return '—';
  const z = lm.z;
  return `${lm.x.toFixed(2)}, ${lm.y.toFixed(2)}, z:${z != null ? z.toFixed(2) : '—'}`;
}
