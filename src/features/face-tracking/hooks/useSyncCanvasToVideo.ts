import { useLayoutEffect } from 'react';

/**
 * Garante que o canvas interno tenha a mesma resolução do quadro de vídeo.
 */
export function useSyncCanvasToVideo(
  video: HTMLVideoElement | null,
  canvas: HTMLCanvasElement | null
) {
  useLayoutEffect(() => {
    if (video == null || canvas == null) return;
    const sync = () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w > 0 && h > 0) {
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
      }
    };
    video.addEventListener('loadeddata', sync);
    video.addEventListener('loadedmetadata', sync);
    video.addEventListener('canplay', sync);
    window.addEventListener('resize', sync);
    sync();
    return () => {
      video.removeEventListener('loadeddata', sync);
      video.removeEventListener('loadedmetadata', sync);
      video.removeEventListener('canplay', sync);
      window.removeEventListener('resize', sync);
    };
  }, [video, canvas]);
}
