import {
  EYE_LOOK_HORIZONTAL_MAX,
  HEAD_SOFT_MAX_ABS_PITCH,
  HEAD_SOFT_MAX_ABS_ROLL,
  HEAD_SOFT_MAX_ABS_YAW,
} from '../config/proctoring';
import { extractGazeFromBlendshapes, type GazeBlendshapeScores } from './gazeBlendshapes';
import type { HeadOrientationDegrees } from '../types';

export type AttentionInput = {
  hasFace: boolean;
  headOrientation: HeadOrientationDegrees | null;
  /** Classifications do MediaPipe (faceBlendshapes[0]). */
  faceBlendshapes?: { categories?: { categoryName?: string; score: number }[] } | null;
};

export function proctoringDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('proctoringDebug') === '1';
  } catch {
    return false;
  }
}

function headLookingAway(deg: HeadOrientationDegrees | null): boolean {
  if (deg == null) return false;
  if (Math.abs(deg.yaw) > HEAD_SOFT_MAX_ABS_YAW) return true;
  if (Math.abs(deg.pitch) > HEAD_SOFT_MAX_ABS_PITCH) return true;
  if (Math.abs(deg.roll) > HEAD_SOFT_MAX_ABS_ROLL) return true;
  return false;
}

function eyesLookingAway(gaze: GazeBlendshapeScores | null): boolean {
  if (gaze == null) return false;
  // Só horizontal: olhar para baixo no ecrã é esperado com webcam no topo.
  return gaze.horizontal > EYE_LOOK_HORIZONTAL_MAX;
}

/**
 * Atento = rosto presente e NÃO (olhar lateral forte OU cabeça virada).
 * Usa blendshapes `eyeLook*` do MediaPipe + yaw/pitch/roll da matriz.
 */
export function isLookingAtScreen(input: AttentionInput): boolean {
  if (!input.hasFace) return false;
  const gaze = extractGazeFromBlendshapes(input.faceBlendshapes);
  if (eyesLookingAway(gaze)) return false;
  if (headLookingAway(input.headOrientation)) return false;
  return true;
}

export type AttentionDebugSnapshot = {
  hasFace: boolean;
  gaze: GazeBlendshapeScores | null;
  headDeg: HeadOrientationDegrees | null;
  eyesAway: boolean;
  headAway: boolean;
  isLookingAtScreen: boolean;
  resumo: string;
};

export function getAttentionDebugSnapshot(input: AttentionInput): AttentionDebugSnapshot {
  const gaze = extractGazeFromBlendshapes(input.faceBlendshapes);
  const eyesAway = eyesLookingAway(gaze);
  const headAway = headLookingAway(input.headOrientation);
  const looking = isLookingAtScreen(input);

  let resumo = 'atento';
  if (!input.hasFace) resumo = 'sem rosto';
  else if (eyesAway) resumo = `olhar lateral (h=${gaze?.horizontal.toFixed(2)})`;
  else if (headAway) resumo = 'cabeça virada';

  return {
    hasFace: input.hasFace,
    gaze,
    headDeg: input.headOrientation,
    eyesAway,
    headAway,
    isLookingAtScreen: looking,
    resumo,
  };
}
