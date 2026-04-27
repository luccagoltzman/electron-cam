import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { useEffect, useRef, useState } from 'react';
import {
  FACE_LANDMARKER_MODEL_URL,
  getVisionTasksWasmBaseUrl,
  MEDIAPIPE_VISION_WASM,
} from '../lib/mediapipeConfig';

type Phase = 'idle' | 'loading' | 'ready' | 'error';

const landmarkerOptions = (delegate: 'GPU' | 'CPU', modelAssetBuffer: Uint8Array) =>
  ({
    baseOptions: {
      modelAssetBuffer,
      delegate,
    } as const,
    runningMode: 'IMAGE' as const,
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: true,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
  }) as const;

function isElectronClient(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    (globalThis as { appInfo?: { isElectron?: boolean } }).appInfo?.isElectron === true
  );
}

async function buildLandmarker(
  wasmBaseUrl: string,
  modelAssetBuffer: Uint8Array
): Promise<FaceLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(wasmBaseUrl);
  if (isElectronClient()) {
    return FaceLandmarker.createFromOptions(fileset, landmarkerOptions('CPU', modelAssetBuffer));
  }
  try {
    return await FaceLandmarker.createFromOptions(fileset, landmarkerOptions('GPU', modelAssetBuffer));
  } catch {
    return FaceLandmarker.createFromOptions(fileset, landmarkerOptions('CPU', modelAssetBuffer));
  }
}

/**
 * Carrega o `.task` com `fetch` e o runtime WASM. Se o WASM local falhar
 * (p.ex. URL errata → "both async and sync fetching of the wasm failed"),
 * repete com a CDN.
 */
export function useFaceLandmarkerModel() {
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const instanceRef = useRef<FaceLandmarker | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    setError(null);

    void (async () => {
      try {
        const modelResp = await fetch(FACE_LANDMARKER_MODEL_URL);
        if (!modelResp.ok) {
          throw new Error(`Modelo: HTTP ${modelResp.status}`);
        }
        const modelAssetBuffer = new Uint8Array(await modelResp.arrayBuffer());
        if (cancelled) return;

        const localWasm = getVisionTasksWasmBaseUrl();
        let model: FaceLandmarker;
        try {
          model = await buildLandmarker(localWasm, modelAssetBuffer);
        } catch (e) {
          if (import.meta.env.DEV) {
            console.warn('[MediaPipe] WASM em', localWasm, 'falhou; a tentar CDN.');
          } else {
            console.warn('[MediaPipe] WASM local falhou; a tentar CDN (jsDelivr).', e);
          }
          model = await buildLandmarker(MEDIAPIPE_VISION_WASM, modelAssetBuffer);
        }
        if (cancelled) {
          void model.close();
          return;
        }
        instanceRef.current = model;
        setLandmarker(model);
        setPhase('ready');
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setPhase('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      const m = instanceRef.current;
      instanceRef.current = null;
      if (m != null) void m.close();
      setLandmarker(null);
      setPhase('idle');
    };
  }, []);

  return { landmarker, error, phase };
}
