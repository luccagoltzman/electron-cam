import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { L_IRIS_L, L_IRIS_R, L_NOSE } from './mediapipeConfig';

const COLORS = {
  nose: 'rgba(255, 200, 80, 0.95)',
  irisL: 'rgba(80, 200, 255, 0.95)',
  irisR: 'rgba(80, 255, 150, 0.95)',
  line: 'rgba(200, 220, 255, 0.35)',
} as const;

export function drawEyesNoseLine(
  ctx: CanvasRenderingContext2D,
  face: NormalizedLandmark[] | undefined,
  width: number,
  height: number
): void {
  if (face == null || face.length < L_IRIS_R + 1) return;

  const toXY = (lm: NormalizedLandmark) => [lm.x * width, lm.y * height] as const;

  const drawPoint = (idx: number, color: string) => {
    const [x, y] = toXY(face[idx]!);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  drawPoint(L_NOSE, COLORS.nose);
  drawPoint(L_IRIS_L, COLORS.irisL);
  drawPoint(L_IRIS_R, COLORS.irisR);

  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1.5;
  const [nx, ny] = toXY(face[L_NOSE]!);
  const [lx, ly] = toXY(face[L_IRIS_L]!);
  const [rx, ry] = toXY(face[L_IRIS_R]!);
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.lineTo(nx, ny);
  ctx.lineTo(rx, ry);
  ctx.stroke();
}
