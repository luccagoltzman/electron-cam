/**
 * Mínimos evitam tracks “fantasma” 0×0; ideais aproximam 720p em boas câmeras.
 */
export const DEFAULT_USER_MEDIA: MediaStreamConstraints = {
  video: {
    facingMode: 'user',
    width: { ideal: 1280, min: 320 },
    height: { ideal: 720, min: 240 },
  },
  audio: false,
};
