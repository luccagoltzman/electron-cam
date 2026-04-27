const HAVE_CURRENT = 2; // HTMLMediaElement.HAVE_CURRENT_DATA

/**
 * Tamanho mínimo seguro para o bloco de imagem a entrar no graph (reduz
 * cantos de ROI colapsado no detector, mais comum com quadros 1–4 px de altura
 * nalguns dispositivos).
 */
const MIN_MEDIAPIPE_DIM = 64;

/**
 * Verdadeiro quando o vídeo tem frame decodificado e dimensões ≥ mínimo.
 */
export function isVideoFrameReadyForMl(video: HTMLVideoElement): boolean {
  if (video.readyState < HAVE_CURRENT) return false;
  if (typeof video.currentTime === 'number' && video.currentTime < 0) return false;
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!Number.isFinite(w) || !Number.isFinite(h)) return false;
  if (w < MIN_MEDIAPIPE_DIM || h < MIN_MEDIAPIPE_DIM) return false;
  return true;
}
