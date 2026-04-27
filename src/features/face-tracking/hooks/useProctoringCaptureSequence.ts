import { useCallback, useRef, useState } from 'react';
import {
  PROCTORING_CAPTURE_DURATION_MS,
  PROCTORING_CAPTURE_MIN_INTERVAL_MS,
} from '../config/proctoring';
import { buildProctoringCaptureEntry, proctoringCaptureLogMeta } from '../lib/proctoringCaptureLog';
import type { ProctoringFrameSample } from '../types';

export function useProctoringCaptureSequence() {
  const [status, setStatus] = useState<'idle' | 'recording' | 'done'>('idle');
  const [exportJson, setExportJson] = useState<string | null>(null);
  const recordingRef = useRef(false);
  const bufferRef = useRef<ReturnType<typeof buildProctoringCaptureEntry>[]>([]);
  const t0Ref = useRef(0);
  const lastPushRef = useRef(0);
  const endAtRef = useRef(0);

  const recordSample = useCallback((s: ProctoringFrameSample) => {
    if (!recordingRef.current) return;
    if (!s.isSessionActive) return;
    const now = s.now;
    if (now >= endAtRef.current) {
      recordingRef.current = false;
      const payload = {
        ...proctoringCaptureLogMeta(),
        durationTargetMs: PROCTORING_CAPTURE_DURATION_MS,
        sampleCount: bufferRef.current.length,
        samples: bufferRef.current,
      };
      const json = JSON.stringify(payload, null, 2);
      setExportJson(json);
      setStatus('done');
      console.log(
        '[proctoring-capture] sequência concluída — ver payload no estado ou descarregar JSON',
        payload
      );
      return;
    }
    if (now - lastPushRef.current < PROCTORING_CAPTURE_MIN_INTERVAL_MS) return;
    lastPushRef.current = now;
    if (bufferRef.current.length === 0) t0Ref.current = now;
    bufferRef.current.push(buildProctoringCaptureEntry(s, t0Ref.current));
  }, []);

  const startCapture = useCallback(() => {
    bufferRef.current = [];
    lastPushRef.current = 0;
    t0Ref.current = 0;
    setExportJson(null);
    setStatus('recording');
    endAtRef.current = performance.now() + PROCTORING_CAPTURE_DURATION_MS;
    recordingRef.current = true;
  }, []);

  const resetCapture = useCallback(() => {
    recordingRef.current = false;
    setStatus('idle');
    setExportJson(null);
  }, []);

  const downloadCapture = useCallback(() => {
    if (exportJson == null) return;
    const a = document.createElement('a');
    const blob = new Blob([exportJson], { type: 'application/json' });
    a.href = URL.createObjectURL(blob);
    a.download = `proctoring-capture-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [exportJson]);

  return { status, startCapture, resetCapture, recordSample, exportJson, downloadCapture };
}
