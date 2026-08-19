import { useEffect, useRef, useState } from "react";

/** Cronômetro base dos players: tempo real, com pausa e conclusão. */
export const usePracticeTimer = (totalSeconds: number, onComplete: () => void) => {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setElapsed((prev) => Math.min(prev + 1, totalSeconds));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running, totalSeconds]);

  useEffect(() => {
    if (elapsed >= totalSeconds && !completedRef.current) {
      completedRef.current = true;
      setRunning(false);
      onComplete();
    }
  }, [elapsed, totalSeconds, onComplete]);

  return {
    elapsed,
    remaining: Math.max(totalSeconds - elapsed, 0),
    running,
    progress: totalSeconds > 0 ? elapsed / totalSeconds : 0,
    toggle: () => setRunning((r) => !r),
  };
};

export const formatClock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
