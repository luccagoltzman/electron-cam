import { useMemo, useRef, useState } from 'react';
import { AppHeader, MetricRow, Panel, StatusLine } from '@shared/components';
import { ProctoringModals } from './components/ProctoringModals/ProctoringModals';
import {
  EYE_LOOK_HORIZONTAL_MAX,
  HEAD_SOFT_MAX_ABS_YAW,
  INATTENTION_THRESHOLD_MS,
  PROCTORING_CAPTURE_DURATION_MS,
} from './config/proctoring';
import { DEFAULT_USER_MEDIA } from './config/defaultMedia';
import { useFaceLandmarkerModel } from './hooks/useFaceLandmarkerModel';
import { useFaceTrackingFrame } from './hooks/useFaceTrackingFrame';
import { useInattentionStrikes } from './hooks/useInattentionStrikes';
import { useProctoringCaptureSequence } from './hooks/useProctoringCaptureSequence';
import { useUserMediaStream } from './hooks/useUserMediaStream';
import { EMPTY_METRICS, type FaceMetrics } from './types';
import styles from './FaceTrackingView.module.css';

function useStatusLine(
  camError: Error | null,
  camReady: boolean,
  lmError: Error | null,
  phase: 'idle' | 'loading' | 'ready' | 'error',
  disqualified: boolean
) {
  return useMemo(() => {
    if (disqualified) return { text: 'Sessão encerrada (desclassificação).', err: true };
    if (camError != null) return { text: `Câmera: ${camError.message}`, err: true };
    if (lmError != null) return { text: `Modelo: ${lmError.message}`, err: true };
    if (phase === 'loading') {
      return {
        text: 'Carregando modelo (na primeira execução pode demorar)…',
        err: false,
      };
    }
    if (!camReady) return { text: 'Abrindo câmera…', err: false };
    return {
      text: 'Prova/atividade: olhe para a tela. Mais de 15 s sem olhar gera alerta de possível pesca.',
      err: false,
    };
  }, [camError, camReady, lmError, phase, disqualified]);
}

export function FaceTrackingView() {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [metrics, setMetrics] = useState<FaceMetrics>(EMPTY_METRICS);

  const { landmarker, error: lmError, phase } = useFaceLandmarkerModel();
  const { ready: camReady, error: camError } = useUserMediaStream(video, DEFAULT_USER_MEDIA);
  const { strikeCount, disqualified, openWarning, acknowledgeWarning, processFrame, live } =
    useInattentionStrikes();
  const {
    status: captureStatus,
    startCapture,
    resetCapture,
    recordSample,
    downloadCapture,
  } = useProctoringCaptureSequence();

  const sessionRef = useRef(false);
  sessionRef.current = camReady && phase === 'ready' && !disqualified;

  useFaceTrackingFrame(video, canvas, landmarker, setMetrics, {
    maxFps: 30,
    onProctoringFrame: (sample) => {
      recordSample(sample);
      processFrame(sample);
    },
    isSessionActiveRef: sessionRef,
  });

  const { text: line, err } = useStatusLine(camError, camReady, lmError, phase, disqualified);

  return (
    <div className={styles.app}>
      <AppHeader title="Rastreamento (MediaPipe) — prova/ativa">
        <StatusLine text={line} tone={err ? 'error' : 'default'} />
      </AppHeader>
      <div className={styles.stage}>
        <div
          className={`${styles.videoShell} ${disqualified ? styles.videoOff : ''}`.trim()}
          aria-hidden={disqualified}
        >
          <video ref={setVideo} className={styles.video} playsInline muted />
          <canvas ref={setCanvas} className={styles.overlay} />
        </div>
        <div className={styles.sideCol}>
          <Panel title="Dados" className={styles.hud}>
            <MetricRow label="Nariz (pose)" value={metrics.nose} />
            <MetricRow label="Olho esq. (íris)" value={metrics.leftIris} />
            <MetricRow label="Olho dir. (íris)" value={metrics.rightIris} />
            <MetricRow label="Cabeça (P/Y/R°)" value={metrics.headYpr} />
          </Panel>
          <Panel title="Proctoring" className={styles.hud}>
            <MetricRow
              label="Status"
              value={
                live.attentive
                  ? 'Atento (olhando para a tela)'
                  : live.awayMs > 0
                    ? `Sem olhar — ${(live.awayMs / 1000).toFixed(1)}s / ${live.thresholdMs / 1000}s`
                    : 'Sem olhar (estabilizando…)'
              }
            />
            <MetricRow
              label="Critério"
              value="MediaPipe eyeLook* (olhar lateral) + yaw da cabeça — olhar para baixo no ecrã é OK"
            />
            <MetricRow
              label="Limites: olhar lateral / |yaw|°"
              value={`${EYE_LOOK_HORIZONTAL_MAX} / ${HEAD_SOFT_MAX_ABS_YAW}`}
            />
            <MetricRow
              label="Alerta de possível pesca"
              value={`após ${INATTENTION_THRESHOLD_MS / 1000} s sem olhar para a tela`}
            />
            <MetricRow label="Ocorrências" value={String(strikeCount)} />
            <div className={styles.captureRow}>
              <p className={styles.captureHint}>
                Grava {PROCTORING_CAPTURE_DURATION_MS / 1000} s a ~10 amostras/s (cabeça vs
                atento) para análise ou partilha do JSON.
              </p>
              <div className={styles.captureActions}>
                <button
                  type="button"
                  className={styles.captureBtn}
                  onClick={startCapture}
                  disabled={captureStatus === 'recording' || !camReady || phase !== 'ready' || disqualified}
                >
                  {captureStatus === 'recording' ? 'A gravar…' : 'Iniciar captura de log'}
                </button>
                {captureStatus === 'done' && (
                  <>
                    <button type="button" className={styles.captureBtn} onClick={downloadCapture}>
                      Descarregar JSON
                    </button>
                    <button type="button" className={styles.captureBtn} onClick={resetCapture}>
                      Limpar
                    </button>
                  </>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <ProctoringModals
        openWarning={disqualified ? null : openWarning}
        onAcknowledgeWarning={acknowledgeWarning}
        disqualified={disqualified}
        strikeCount={strikeCount}
      />
    </div>
  );
}
