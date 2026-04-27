/** Mesma major da dependência em package.json. */
const TASKS_VISION = '0.10.21';

/**
 * Base URL do diretório `wasm` (Vite public → raiz do site: `/wasm/`, não
 * debaixo de `/assets/`). Deve alinhar com `import.meta.env.BASE_URL` e o path
 * actual da página (incl. `index.html` na raiz) para o Emscripten conseguir
 * dar fetch ao `.wasm` (senão: "both async and sync fetching of the wasm failed").
 */
export function getVisionTasksWasmBaseUrl(): string {
  const base = import.meta.env.BASE_URL || '/';
  if (typeof window === 'undefined') {
    const u = new URL('wasm', new URL(base, 'http://localhost/'));
    return u.pathname.endsWith('/') ? u.href : `${u.href}/`;
  }
  const siteRoot = new URL(base, window.location.href);
  const u = new URL('wasm', siteRoot);
  const href = u.pathname.endsWith('/') ? u.href : `${u.href}/`;
  return href;
}

/** Fallback p/ testes; preferir `getVisionTasksWasmBaseUrl` em runtime. */
export const MEDIAPIPE_VISION_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION}/wasm`;

export const FACE_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

/** Landmarks 478+ (nariz, íris esq./dir.) */
export const L_NOSE = 1;
export const L_IRIS_L = 468;
export const L_IRIS_R = 473;
