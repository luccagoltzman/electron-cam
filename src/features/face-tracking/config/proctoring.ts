/** Tempo contínuo sem olhar para a tela → alerta de possível pesca. */
export const INATTENTION_THRESHOLD_MS = 15_000;

export const INATTENTION_THRESHOLD_SECONDS = Math.round(INATTENTION_THRESHOLD_MS / 1000);

/** Sem rosto: carência (~1,5 s a 30 fps) antes de contar. */
export const NO_FACE_GRACE_FRAMES = 45;

export const MAX_STRIKES_BEFORE_DISQUALIFICATION = 3;

/** Frames “não atento” antes de iniciar o cronômetro (~0,5 s). */
export const INATTENTION_MIN_BAD_FRAMES = 15;

/**
 * Blendshapes MediaPipe (0–1): olhar horizontal forte.
 * Webcam no topo do monitor: olhar um pouco para baixo é normal — NÃO usamos eyeLookDown.
 */
export const EYE_LOOK_HORIZONTAL_MAX = 0.55;

/**
 * Cabeça: só yaw forte (virar o rosto). Pitch generoso — olhar para o ecrã
 * costuma ter pitch ≠ 0 com a câmara acima do monitor.
 */
export const HEAD_SOFT_MAX_ABS_YAW = 40;
export const HEAD_SOFT_MAX_ABS_PITCH = 55;
export const HEAD_SOFT_MAX_ABS_ROLL = 45;

export const PROCTORING_CAPTURE_DURATION_MS = 10_000;
export const PROCTORING_CAPTURE_MIN_INTERVAL_MS = 100;
