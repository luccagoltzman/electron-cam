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

export type AttentionLiveStatus = {
  attentive: boolean;
  awayMs: number;
  thresholdMs: number;
};

const INITIAL_LIVE: AttentionLiveStatus = {
  attentive: true,
  awayMs: 0,
  thresholdMs: INATTENTION_THRESHOLD_MS,
};

export function useInattentionStrikes() {
  const [strikeCount, setStrikeCount] = useState(0);
  const [disqualified, setDisqualified] = useState(false);
  const [openWarning, setOpenWarning] = useState<ProctoringWarning | null>(null);
  const [live, setLive] = useState<AttentionLiveStatus>(INITIAL_LIVE);

  const inattStartRef = useRef<number | null>(null);
  const badStreakRef = useRef(0);
  const noFaceStreakRef = useRef(0);
  const disqualifiedRef = useRef(false);
  const openWarningRef = useRef<ProctoringWarning | null>(null);
  const lastProctoringDebugLogRef = useRef(0);
  const lastLiveUiAtRef = useRef(0);
  const PROCTORING_DEBUG_LOG_MS = 1500;
  const LIVE_UI_MS = 200;

  useEffect(() => {
    disqualifiedRef.current = disqualified;
  }, [disqualified]);

  useEffect(() => {
    openWarningRef.current = openWarning;
  }, [openWarning]);

  const publishLive = (attentive: boolean, awayMs: number, now: number) => {
    if (now - lastLiveUiAtRef.current < LIVE_UI_MS) return;
    lastLiveUiAtRef.current = now;
    setLive({
      attentive,
      awayMs,
      thresholdMs: INATTENTION_THRESHOLD_MS,
    });
  };

  const processFrame = useCallback((sample: ProctoringFrameSample) => {
    if (disqualifiedRef.current) return;

    const { isSessionActive, now } = sample;
    if (!isSessionActive) {
      inattStartRef.current = null;
      badStreakRef.current = 0;
      noFaceStreakRef.current = 0;
      publishLive(true, 0, now);
      return;
    }

    if (sample.hasFace) {
      noFaceStreakRef.current = 0;
    } else {
      noFaceStreakRef.current += 1;
    }

    if (!sample.hasFace && noFaceStreakRef.current <= NO_FACE_GRACE_FRAMES) {
      return;
    }

      const isAttentive = isLookingAtScreen({
        hasFace: sample.hasFace,
        headOrientation: sample.headOrientation,
        faceBlendshapes: sample.faceBlendshapes,
      });

      if (!isAttentive && proctoringDebugEnabled()) {
        if (now - lastProctoringDebugLogRef.current >= PROCTORING_DEBUG_LOG_MS) {
          lastProctoringDebugLogRef.current = now;
          const debug = getAttentionDebugSnapshot({
            hasFace: sample.hasFace,
            headOrientation: sample.headOrientation,
            faceBlendshapes: sample.faceBlendshapes,
          });
          // eslint-disable-next-line no-console -- diagnóstico local
          console.log('[proctoring] não atento', debug.resumo, debug);
        }
      }

    if (isAttentive) {
      inattStartRef.current = null;
      badStreakRef.current = 0;
      publishLive(true, 0, now);
      return;
    }

    badStreakRef.current += 1;
    if (badStreakRef.current < INATTENTION_MIN_BAD_FRAMES) {
      publishLive(false, 0, now);
      return;
    }

    if (inattStartRef.current == null) {
      inattStartRef.current = now;
    }

    const elapsed = now - inattStartRef.current;
    publishLive(false, elapsed, now);

    if (elapsed < INATTENTION_THRESHOLD_MS) return;

    // Modal aberto: não acumula outro strike até o usuário confirmar
    if (openWarningRef.current != null) {
      inattStartRef.current = now;
      return;
    }

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
    inattStartRef.current = null;
    badStreakRef.current = 0;
  }, []);

  return {
    strikeCount,
    disqualified,
    openWarning,
    acknowledgeWarning,
    processFrame,
    live,
  };
}
