import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import type { MutableRefObject } from 'react';
import { useEffect, useRef } from 'react';
import {
  EMPTY_METRICS,
  type FaceMetrics,
  type HeadOrientationDegrees,
  type ProctoringFrameSample,
} from '../types';
import { drawEyesNoseLine } from '../lib/canvasFaceOverlay';
import { headOrientationToHudString, matrix4ColMajorToHeadDegrees } from '../lib/headPose';
import { formatLandmark } from '../lib/landmarkFormat';
import { L_IRIS_L, L_IRIS_R, L_NOSE } from '../lib/mediapipeConfig';
import { estimateHeadPoseFromLandmarks } from '../lib/landmarkHeadEstimate';
import { isVideoFrameReadyForMl } from '../lib/videoFrameReadiness';

function faceMlDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('faceMlDebug') === '1';
  } catch {
    return false;
  }
}

export type FaceTrackingFrameOptions = {
  maxFps?: number;
  onProctoringFrame?: (sample: ProctoringFrameSample) => void;
  isSessionActiveRef?: MutableRefObject<boolean>;
};

/**
 * Caminho estável: `<video>` → canvas ML **fora do DOM** (`drawImage` + `detect(canvas)`);
 * o canvas de **overlay** só desenha linhas por cima do `<video>`.
 * O MediaPipe nunca recebe o elemento de vídeo (evita `texImage2D: no video` / ROI 0
 * com o decodificador do Electron em descompasso com o rAF).
 */
export function useFaceTrackingFrame(
  video: HTMLVideoElement | null,
  overlayCanvas: HTMLCanvasElement | null,
  landmarker: FaceLandmarker | null,
  onMetrics: (next: FaceMetrics) => void,
  options: FaceTrackingFrameOptions = {}
) {
  const { maxFps = 30, onProctoringFrame, isSessionActiveRef } = options;

  /** Suaviza P/Y/R para o proctoring (evita picos da matriz ou do fallback por landmarks). */
  const headEmaRef = useRef<HeadOrientationDegrees | null>(null);
  const HEAD_SMOOTH = 0.28;

  const onMetricsRef = useRef(onMetrics);
  onMetricsRef.current = onMetrics;
  const onProctoringRef = useRef(onProctoringFrame);
  onProctoringRef.current = onProctoringFrame;
  const sessionRef = useRef(isSessionActiveRef);
  sessionRef.current = isSessionActiveRef;

  useEffect(() => {
    if (video == null || overlayCanvas == null || landmarker == null) return;

    const mlCanvas = document.createElement('canvas');
    const mlCtx = mlCanvas.getContext('2d', { alpha: false, desynchronized: true });
    const octx = overlayCanvas.getContext('2d', { alpha: true, desynchronized: true });
    if (mlCtx == null || octx == null) return;

    const debugLog = faceMlDebugEnabled();
    const minFrameMs = 1000 / maxFps;
    let raf = 0;
    let vfcHandle: number | undefined;
    let cancelled = false;
    let lastFrameTime = 0;
    let lastDebugLogAt = 0;
    let lastSkipLogAt = 0;

    const pushEmpty = (now: number) => {
      onMetricsRef.current(EMPTY_METRICS);
      onProctoringRef.current?.({
        hasFace: false,
        headOrientation: null,
        faceLandmarks: null,
        faceBlendshapes: null,
        now,
        isSessionActive: false,
      });
    };

    const run = (now: number) => {
      if (cancelled) return;
      if (now - lastFrameTime < minFrameMs) return;
      lastFrameTime = now;

      if (!isVideoFrameReadyForMl(video)) {
        if (debugLog && now - lastSkipLogAt > 2000) {
          lastSkipLogAt = now;
          console.log('[FaceML] frame inativo p/ ML', {
            readyState: video.readyState,
            currentTime: video.currentTime,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
          });
        }
        pushEmpty(now);
        octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        return;
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (vw < 2 || vh < 2) {
        if (debugLog) console.warn('[FaceML] vídeo sem dimensões úteis', { vw, vh });
        pushEmpty(now);
        octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        return;
      }

      if (mlCanvas.width !== vw) mlCanvas.width = vw;
      if (mlCanvas.height !== vh) mlCanvas.height = vh;
      if (overlayCanvas.width !== vw) overlayCanvas.width = vw;
      if (overlayCanvas.height !== vh) overlayCanvas.height = vh;
      const w = mlCanvas.width;
      const h = mlCanvas.height;

      mlCtx.clearRect(0, 0, w, h);
      mlCtx.drawImage(video, 0, 0, w, h);
      octx.clearRect(0, 0, w, h);

      if (debugLog && now - lastDebugLogAt > 2000) {
        lastDebugLogAt = now;
        console.log('[FaceML] detect(canvas ML)', { w, h, sameOriginWasm: true });
      }

      let res: ReturnType<FaceLandmarker['detect']>;
      try {
        res = landmarker.detect(mlCanvas);
      } catch (e) {
        console.error('[FaceLandmarker]', e);
        pushEmpty(now);
        return;
      }

      const face = res.faceLandmarks?.[0];
      if (face != null) {
        drawEyesNoseLine(octx, face, w, h);
        const m = res.facialTransformationMatrixes?.[0];
        const fromMatrix =
          m != null && 'data' in m ? matrix4ColMajorToHeadDegrees(m.data) : null;
        const fromLandmarks = estimateHeadPoseFromLandmarks(face);
        let raw = fromMatrix ?? fromLandmarks;
        if (
          fromMatrix != null &&
          fromLandmarks != null &&
          (Math.abs(fromMatrix.yaw) > 82 || Math.abs(fromMatrix.pitch) > 82)
        ) {
          raw = fromLandmarks;
        }

        if (raw != null) {
          const prev = headEmaRef.current;
          if (prev == null) {
            headEmaRef.current = { ...raw };
          } else {
            const a = HEAD_SMOOTH;
            headEmaRef.current = {
              pitch: a * raw.pitch + (1 - a) * prev.pitch,
              yaw: a * raw.yaw + (1 - a) * prev.yaw,
              roll: a * raw.roll + (1 - a) * prev.roll,
            };
          }
        }

        const displayHead = fromMatrix ?? fromLandmarks;
        onMetricsRef.current({
          nose: formatLandmark(face[L_NOSE]),
          leftIris: formatLandmark(face[L_IRIS_L]),
          rightIris: formatLandmark(face[L_IRIS_R]),
          headYpr: headOrientationToHudString(displayHead),
        });
      } else {
        headEmaRef.current = null;
        onMetricsRef.current(EMPTY_METRICS);
      }

      const session = sessionRef.current?.current ?? true;
      const blend = res.faceBlendshapes?.[0] ?? null;
      onProctoringRef.current?.({
        hasFace: face != null,
        headOrientation: face != null ? headEmaRef.current : null,
        faceLandmarks: face != null ? face : null,
        faceBlendshapes: blend,
        now,
        isSessionActive: session,
      });
    };

    if (typeof video.requestVideoFrameCallback === 'function') {
      const onVfc: VideoFrameRequestCallback = () => {
        if (cancelled) return;
        vfcHandle = video.requestVideoFrameCallback!(onVfc);
        run(performance.now());
      };
      vfcHandle = video.requestVideoFrameCallback!(onVfc);
    } else {
      const loop = (t: number) => {
        if (cancelled) return;
        raf = requestAnimationFrame(loop);
        run(t);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelled = true;
      if (vfcHandle != null && typeof video.cancelVideoFrameCallback === 'function') {
        video.cancelVideoFrameCallback(vfcHandle);
      }
      cancelAnimationFrame(raf);
    };
  }, [video, overlayCanvas, landmarker, maxFps]);
}
