/**
 * Extrai scores ARKit/MediaPipe Face Blendshapes (eyeLook*).
 * Nomes oficiais do Face Landmarker.
 */

export type GazeBlendshapeScores = {
  lookLeft: number;
  lookRight: number;
  /** max(lookLeft, lookRight) — sinal de olhar para o lado. */
  horizontal: number;
  lookUp: number;
  lookDown: number;
};

type CategoryLike = { categoryName?: string; displayName?: string; score: number };

type ClassificationsLike = {
  categories?: CategoryLike[];
};

function scoreMap(blendshapes: ClassificationsLike | null | undefined): Map<string, number> {
  const map = new Map<string, number>();
  const cats = blendshapes?.categories;
  if (cats == null) return map;
  for (const c of cats) {
    const name = c.categoryName || c.displayName;
    if (name != null && name !== '') map.set(name, c.score);
  }
  return map;
}

function avg(a: number, b: number): number {
  return (a + b) / 2;
}

/**
 * Olhar para a esquerda: olho esq. para fora + olho dir. para dentro (e vice-versa).
 */
export function extractGazeFromBlendshapes(
  blendshapes: ClassificationsLike | null | undefined
): GazeBlendshapeScores | null {
  const m = scoreMap(blendshapes);
  if (m.size === 0) return null;

  const get = (name: string) => m.get(name) ?? 0;

  const lookLeft = avg(get('eyeLookOutLeft'), get('eyeLookInRight'));
  const lookRight = avg(get('eyeLookOutRight'), get('eyeLookInLeft'));
  const lookUp = avg(get('eyeLookUpLeft'), get('eyeLookUpRight'));
  const lookDown = avg(get('eyeLookDownLeft'), get('eyeLookDownRight'));

  return {
    lookLeft,
    lookRight,
    horizontal: Math.max(lookLeft, lookRight),
    lookUp,
    lookDown,
  };
}
