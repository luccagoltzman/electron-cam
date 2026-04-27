import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type HeadOrientationDegrees = {
  pitch: number;
  yaw: number;
  roll: number;
};

export type FaceMetrics = {
  nose: string;
  leftIris: string;
  rightIris: string;
  headYpr: string;
};

export const EMPTY_METRICS: FaceMetrics = {
  nose: '—',
  leftIris: '—',
  rightIris: '—',
  headYpr: '—',
};

/** Amostra por frame para monitoramento de prova (proctoring). */
export type ProctoringFrameSample = {
  hasFace: boolean;
  headOrientation: HeadOrientationDegrees | null;
  faceLandmarks: NormalizedLandmark[] | null;
  now: number;
  /** Falso enquanto câmera/modelo não estão prontos — não acumula inattenção. */
  isSessionActive: boolean;
};
