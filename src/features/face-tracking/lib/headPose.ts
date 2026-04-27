import type { HeadOrientationDegrees } from '../types';

/**
 * Rotação aproximada a partir de matriz 4×4 em coluna-major (MediaPipe).
 * Não é calibração clínica; serve para acompanhar a cabeça na UI.
 */
export function matrix4ColMajorToHeadDegrees(
  m16: Float32Array | number[] | undefined
): HeadOrientationDegrees | null {
  if (m16 == null || m16.length < 16) return null;
  const m00 = m16[0];
  const m10 = m16[1];
  const m11 = m16[5];
  const m12 = m16[9];
  const m20 = m16[2];
  const m21 = m16[6];
  const m22 = m16[10];

  const sinY = -m20;
  const yaw = Math.asin(Math.max(-1, Math.min(1, sinY)));
  let pitch: number;
  let roll: number;
  if (Math.abs(m20) < 0.99999) {
    pitch = Math.atan2(m21, m22);
    roll = Math.atan2(m10, m00);
  } else {
    pitch = Math.atan2(-m12, m11);
    roll = 0;
  }
  return {
    yaw: (yaw * 180) / Math.PI,
    pitch: (pitch * 180) / Math.PI,
    roll: (roll * 180) / Math.PI,
  };
}

export function headOrientationToHudString(deg: HeadOrientationDegrees | null): string {
  if (deg == null) return '—';
  return `P:${deg.pitch.toFixed(1)} Y:${deg.yaw.toFixed(1)} R:${deg.roll.toFixed(1)}`;
}
