import { isLookingAtScreen } from './attentionHeuristic';
import { extractGazeFromBlendshapes } from './gazeBlendshapes';
import type { ProctoringFrameSample } from '../types';

export type ProctoringCaptureEntry = {
  /** ms desde a primeira amostra da sequência */
  tOffsetMs: number;
  hasFace: boolean;
  pitch: number | null;
  yaw: number | null;
  roll: number | null;
  eyeHorizontal: number | null;
  attentive: boolean;
};

/**
 * Uma amostra compacta para exportar (JSON).
 */
export function buildProctoringCaptureEntry(
  sample: ProctoringFrameSample,
  t0: number
): ProctoringCaptureEntry {
  const h = sample.headOrientation;
  const gaze = extractGazeFromBlendshapes(sample.faceBlendshapes);
  return {
    tOffsetMs: Math.round(sample.now - t0),
    hasFace: sample.hasFace,
    pitch: h?.pitch ?? null,
    yaw: h?.yaw ?? null,
    roll: h?.roll ?? null,
    eyeHorizontal: gaze?.horizontal ?? null,
    attentive: isLookingAtScreen({
      hasFace: sample.hasFace,
      headOrientation: sample.headOrientation,
      faceBlendshapes: sample.faceBlendshapes,
    }),
  };
}

export function proctoringCaptureLogMeta() {
  return {
    proctoring: 'mediapipe_eyeLook_horizontal_plus_head_yaw',
    generatedAt: new Date().toISOString(),
  };
}
