import {
  HEAD_SOFT_MAX_ABS_PITCH,
  HEAD_SOFT_MAX_ABS_ROLL,
  HEAD_SOFT_MAX_ABS_YAW,
} from '../config/proctoring';
import type { HeadOrientationDegrees } from '../types';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type AttentionInput = {
  hasFace: boolean;
  headOrientation: HeadOrientationDegrees | null;
  /** Opcional: só para contagem no debug. */
  faceLandmarks?: NormalizedLandmark[] | null;
};

/**
 * Proctoring: limites P/Y/R. `deg === null` = não falha (frame sem matriz estável).
 */
export function headAnglesWithinProctoringLimits(deg: HeadOrientationDegrees | null): boolean {
  if (deg == null) return true;
  const { pitch, yaw, roll } = deg;
  if (Math.abs(yaw) > HEAD_SOFT_MAX_ABS_YAW) return false;
  if (Math.abs(pitch) > HEAD_SOFT_MAX_ABS_PITCH) return false;
  if (Math.abs(roll) > HEAD_SOFT_MAX_ABS_ROLL) return false;
  return true;
}

/**
 * `true` em dev ou após `localStorage.setItem('proctoringDebug', '1')` (build empacotado).
 */
export function proctoringDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('proctoringDebug') === '1';
  } catch {
    return false;
  }
}

export type AttentionDebugSnapshot = {
  hasFace: boolean;
  landmarkCount: number;
  headPass: boolean | null;
  headDeg: HeadOrientationDegrees | null;
  headNotes: string[];
  isLookingAtScreen: boolean;
  resumo: string;
};

/**
 * Depuração: por que caiu em “não atento” (cabeça fora do limite ou sem rosto).
 */
export function getAttentionDebugSnapshot({
  hasFace,
  headOrientation,
  faceLandmarks,
}: AttentionInput): AttentionDebugSnapshot {
  const landmarkCount = faceLandmarks?.length ?? 0;

  const headNotes: string[] = [];
  let headPass: boolean | null = null;
  if (headOrientation == null) {
    headPass = true;
    headNotes.push('sem matriz P/Y/R neste frame – contado como OK');
  } else {
    const { pitch, yaw, roll } = headOrientation;
    headPass = true;
    if (Math.abs(yaw) > HEAD_SOFT_MAX_ABS_YAW) {
      headPass = false;
      headNotes.push(
        `yaw fora: |${yaw.toFixed(1)}°| > ${HEAD_SOFT_MAX_ABS_YAW}°`
      );
    }
    if (Math.abs(pitch) > HEAD_SOFT_MAX_ABS_PITCH) {
      headPass = false;
      headNotes.push(
        `pitch fora: |${pitch.toFixed(1)}°| > ${HEAD_SOFT_MAX_ABS_PITCH}°`
      );
    }
    if (Math.abs(roll) > HEAD_SOFT_MAX_ABS_ROLL) {
      headPass = false;
      headNotes.push(
        `roll fora: |${roll.toFixed(1)}°| > ${HEAD_SOFT_MAX_ABS_ROLL}°`
      );
    }
    if (headPass) headNotes.push('P/Y/R dentro do limite');
  }

  if (!hasFace) {
    return {
      hasFace: false,
      landmarkCount,
      headPass: null,
      headDeg: headOrientation,
      headNotes: ['N/A: sem rosto no frame'],
      isLookingAtScreen: false,
      resumo: 'hasFace = false',
    };
  }

  const isLooking = isLookingAtScreen({ hasFace, headOrientation, faceLandmarks });
  const resumo = isLooking
    ? 'atento: cabeça (P/Y/R)'
    : headPass === false
      ? 'não atento: cabeça (ver headNotes)'
      : 'não atento: inconsistência';

  return {
    hasFace: true,
    landmarkCount,
    headPass,
    headDeg: headOrientation,
    headNotes,
    isLookingAtScreen: isLooking,
    resumo,
  };
}

/** Atenção na tela: rosto detetado + cabeça dentro dos limites (íris não entra). */
export function isLookingAtScreen({ hasFace, headOrientation }: AttentionInput): boolean {
  if (!hasFace) return false;
  return headAnglesWithinProctoringLimits(headOrientation);
}
