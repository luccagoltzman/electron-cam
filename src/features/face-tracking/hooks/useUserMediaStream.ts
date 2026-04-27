import { useEffect, useRef, useState } from 'react';

/**
 * Anexa um `MediaStream` ao `<video>` e libera na desmontagem.
 * Passe `constraints` estável (ex.: constante de módulo) ou `useMemo` no pai.
 */
export function useUserMediaStream(
  video: HTMLVideoElement | null,
  constraints: MediaStreamConstraints
) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const constraintsRef = useRef(constraints);
  constraintsRef.current = constraints;

  useEffect(() => {
    if (video == null) return;
    let stream: MediaStream | undefined;
    let cancelled = false;
    setError(null);
    setReady(false);
    const c = constraintsRef.current;

    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia(c);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
        }
      }
    })();

    return () => {
      cancelled = true;
      if (stream != null) stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
      setReady(false);
    };
  }, [video]);

  return { ready, error };
}
