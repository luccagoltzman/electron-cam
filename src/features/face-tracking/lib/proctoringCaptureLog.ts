import { headAnglesWithinProctoringLimits, isLookingAtScreen } from './attentionHeuristic';
import type { ProctoringFrameSample } from '../types';

export type ProctoringCaptureEntry = {
  /** ms desde a primeira amostra da sequência */
  tOffsetMs: number;
  hasFace: boolean;
  pitch: number | null;
  yaw: number | null;
  roll: number | null;
  headOK: boolean | null;
  attentive: boolean;
};

const mode = { proctoring: 'head_pose_only' as const };

/**
 * Uma amostra compacta para exportar (JSON) — só cabeça (P/Y/R).
 */
export function buildProctoringCaptureEntry(
  sample: ProctoringFrameSample,
  t0: number
): ProctoringCaptureEntry {
  const h = sample.headOrientation;
  const headOK = headAnglesWithinProctoringLimits(h);
  return {
    tOffsetMs: Math.round(sample.now - t0),
    hasFace: sample.hasFace,
    pitch: h?.pitch ?? null,
    yaw: h?.yaw ?? null,
    roll: h?.roll ?? null,
    headOK: sample.hasFace ? headOK : null,
    attentive: isLookingAtScreen({
      hasFace: sample.hasFace,
      headOrientation: sample.headOrientation,
      faceLandmarks: sample.faceLandmarks,
    }),
  };
}

export function proctoringCaptureLogMeta() {
  return { ...mode, generatedAt: new Date().toISOString() };
}
