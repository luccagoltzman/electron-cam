/** Tempo contínuo (após o streak abaixo) sem “atento” para 1 ocorrência. */
export const INATTENTION_THRESHOLD_MS = 55_000;

/** Exibir nos modais (sincronizar com `INATTENTION_THRESHOLD_MS`). */
export const INATTENTION_THRESHOLD_SECONDS = Math.round(INATTENTION_THRESHOLD_MS / 1000);

/**
 * Com rosto **ainda não** detetado (perda de track / piscar / glitch WebGL-ML), não contar
 * de imediato como inatenção. Após N frames consecutivos sem `hasFace` é que a regra
 * aplica (evita strike por intermitência do detector).
 */
export const NO_FACE_GRACE_FRAMES = 50;

/** 3ª ocorrência = desclassificação (1º e 2º são avisos). */
export const MAX_STRIKES_BEFORE_DISQUALIFICATION = 3;

/**
 * Frames consecutivos “não atento” (na cadência do loop ~30/s) **antes** de começar a
 * contar o tempo. Evita cair num strike por 1–2 frames de jitter na matriz da cabeça.
 */
export const INATTENTION_MIN_BAD_FRAMES = 25;

/**
 * Proctoring: **só orientação da cabeça** (pitch / yaw / roll da matriz facial).
 * Ajusta consoante distância e posição do ecrã.
 */
export const HEAD_SOFT_MAX_ABS_YAW = 72;
export const HEAD_SOFT_MAX_ABS_PITCH = 75;
export const HEAD_SOFT_MAX_ABS_ROLL = 72;

/** Captura de diagnóstico: duração e intervalo mínimo entre amostras no log. */
export const PROCTORING_CAPTURE_DURATION_MS = 10_000;
export const PROCTORING_CAPTURE_MIN_INTERVAL_MS = 100;
