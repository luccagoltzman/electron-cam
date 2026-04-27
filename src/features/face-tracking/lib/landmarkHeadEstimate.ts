import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { HeadOrientationDegrees } from '../types';

/**
 * Poses aproximadas a partir de landmarks 2D quando a matriz facial
 * (`facialTransformationMatrixes`) não vem preenchida — situação comum no Tasks/WASM
 * ainda com rosto e nariz/olhos visíveis na UI.
 */
export function estimateHeadPoseFromLandmarks(
  face: NormalizedLandmark[] | null | undefined
): HeadOrientationDegrees | null {
  if (face == null || face.length < 300) return null;
  // Face oval: ~234 / ~454 (eixo aprox. esq./dir.); olhos: ~33 e ~263; nariz: 1
  const pL = face[234];
  const pR = face[454];
  const nose = face[1];
  const le = face[33];
  const re = face[263];
  if (pL == null || pR == null || nose == null || le == null || re == null) return null;

  const cx = (pL.x + pR.x) * 0.5;
  const faceW = Math.abs(pR.x - pL.x) + 1e-5;
  const horizN = (nose.x - cx) / (faceW * 0.5);
  const yaw = Math.max(-1, Math.min(1, horizN)) * 58;

  const eyeY = (le.y + re.y) * 0.5;
  const faceH = Math.max(0.04, Math.abs(nose.y - eyeY) * 2.2 + 0.06);
  const pitch = ((nose.y - eyeY) / faceH) * 48;

  const roll = (Math.atan2(re.y - le.y, re.x - le.x) * 180) / Math.PI;

  return { yaw, pitch, roll };
}
