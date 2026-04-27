import { useCallback, useEffect, useRef, useState } from 'react';
import {
  INATTENTION_MIN_BAD_FRAMES,
  INATTENTION_THRESHOLD_MS,
  MAX_STRIKES_BEFORE_DISQUALIFICATION,
  NO_FACE_GRACE_FRAMES,
} from '../config/proctoring';
import {
  getAttentionDebugSnapshot,
  isLookingAtScreen,
  proctoringDebugEnabled,
} from '../lib/attentionHeuristic';
import type { ProctoringFrameSample } from '../types';

export type ProctoringWarning = 1 | 2;

export function useInattentionStrikes() {
  const [strikeCount, setStrikeCount] = useState(0);
  const [disqualified, setDisqualified] = useState(false);
  const [openWarning, setOpenWarning] = useState<ProctoringWarning | null>(null);

  const inattStartRef = useRef<number | null>(null);
  const badStreakRef = useRef(0);
  const noFaceStreakRef = useRef(0);
  const disqualifiedRef = useRef(false);
  const lastProctoringDebugLogRef = useRef(0);
  const PROCTORING_DEBUG_LOG_MS = 1500;
  useEffect(() => {
    disqualifiedRef.current = disqualified;
  }, [disqualified]);

  const processFrame = useCallback((sample: ProctoringFrameSample) => {
    if (disqualifiedRef.current) return;

    const { isSessionActive, now } = sample;
    if (!isSessionActive) {
      inattStartRef.current = null;
      badStreakRef.current = 0;
      noFaceStreakRef.current = 0;
      return;
    }

    if (sample.hasFace) {
      noFaceStreakRef.current = 0;
    } else {
      noFaceStreakRef.current += 1;
    }
    // Sem rosto detetado: no início dá “carência” (glitch / piscar); não é o mesmo
    // que ter rosto e íris fora do limite.
    if (!sample.hasFace && noFaceStreakRef.current <= NO_FACE_GRACE_FRAMES) {
      return;
    }

    const isAttentive = isLookingAtScreen({
      hasFace: sample.hasFace,
      headOrientation: sample.headOrientation,
      faceLandmarks: sample.faceLandmarks,
    });

    if (!isAttentive && proctoringDebugEnabled()) {
      if (now - lastProctoringDebugLogRef.current >= PROCTORING_DEBUG_LOG_MS) {
        lastProctoringDebugLogRef.current = now;
        const debug = getAttentionDebugSnapshot({
          hasFace: sample.hasFace,
          headOrientation: sample.headOrientation,
          faceLandmarks: sample.faceLandmarks,
        });
        // eslint-disable-next-line no-console -- diagnóstico local (flag proctoringDebug)
        console.log('[proctoring] não atento', debug.resumo, debug);
      }
    }

    if (isAttentive) {
      inattStartRef.current = null;
      badStreakRef.current = 0;
      return;
    }

    badStreakRef.current += 1;
    if (badStreakRef.current < INATTENTION_MIN_BAD_FRAMES) {
      return;
    }

    if (inattStartRef.current == null) {
      inattStartRef.current = now;
    }

    const elapsed = now - inattStartRef.current;
    if (elapsed < INATTENTION_THRESHOLD_MS) return;

    inattStartRef.current = now;

    setStrikeCount((current) => {
      const next = current + 1;
      if (next >= MAX_STRIKES_BEFORE_DISQUALIFICATION) {
        setDisqualified(true);
        setOpenWarning(null);
        return next;
      }
      if (next === 1) setOpenWarning(1);
      if (next === 2) setOpenWarning(2);
      return next;
    });
  }, []);

  const acknowledgeWarning = useCallback(() => {
    setOpenWarning(null);
  }, []);

  return {
    strikeCount,
    disqualified,
    openWarning,
    acknowledgeWarning,
    processFrame,
  };
}
