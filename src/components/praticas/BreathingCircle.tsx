import { useEffect, useRef, useState } from "react";

interface BreathingCircleProps {
  /** seconds for each phase */
  inspirar: number;
  segurar: number;
  expirar: number;
  paused?: boolean;
  /** called whenever phase changes; useful for label/audio sync */
  onPhaseChange?: (phase: "inspirar" | "segurar" | "expirar") => void;
}

const PHASES = ["inspirar", "segurar", "expirar"] as const;
type Phase = (typeof PHASES)[number];

export const BreathingCircle = ({
  inspirar,
  segurar,
  expirar,
  paused = false,
  onPhaseChange,
}: BreathingCircleProps) => {
  const [phase, setPhase] = useState<Phase>("inspirar");
  const [secondsLeft, setSecondsLeft] = useState(inspirar);
  const phaseRef = useRef<Phase>("inspirar");
  const remainingRef = useRef<number>(inspirar);

  useEffect(() => {
    if (paused) return;
    const tick = setInterval(() => {
      remainingRef.current -= 0.1;
      if (remainingRef.current <= 0) {
        const idx = PHASES.indexOf(phaseRef.current);
        let next: Phase = PHASES[(idx + 1) % PHASES.length];
        let dur = next === "inspirar" ? inspirar : next === "segurar" ? segurar : expirar;
        // skip zero-duration phases (e.g. segurar=0)
        let safety = 0;
        while (dur <= 0 && safety < 3) {
          const i2 = PHASES.indexOf(next);
          next = PHASES[(i2 + 1) % PHASES.length];
          dur = next === "inspirar" ? inspirar : next === "segurar" ? segurar : expirar;
          safety++;
        }
        phaseRef.current = next;
        remainingRef.current = dur;
        setPhase(next);
        onPhaseChange?.(next);
      }
      setSecondsLeft(Math.max(0, Math.ceil(remainingRef.current)));
    }, 100);
    return () => clearInterval(tick);
  }, [paused, inspirar, segurar, expirar, onPhaseChange]);

  const scale = phase === "inspirar" ? 1 : phase === "segurar" ? 1 : 0.55;
  const transitionDuration =
    phase === "inspirar" ? inspirar : phase === "segurar" ? segurar : expirar;

  const label =
    phase === "inspirar" ? "Inspire" : phase === "segurar" ? "Segure" : "Expire";

  return (
    <div className="relative flex items-center justify-center w-72 h-72 sm:w-96 sm:h-96">
      <div
        aria-hidden
        className="absolute inset-0 rounded-full bg-primary/15 blur-2xl"
        style={{
          transform: `scale(${scale})`,
          transition: `transform ${transitionDuration}s ease-in-out`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-6 rounded-full bg-primary/25"
        style={{
          transform: `scale(${scale})`,
          transition: `transform ${transitionDuration}s ease-in-out`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-12 rounded-full bg-primary/40"
        style={{
          transform: `scale(${scale})`,
          transition: `transform ${transitionDuration}s ease-in-out`,
        }}
      />
      <div className="relative z-10 flex flex-col items-center text-primary-foreground">
        <p className="font-serif text-3xl sm:text-4xl tracking-wide">{label}</p>
        <p className="text-sm opacity-80 mt-2">{secondsLeft}s</p>
      </div>
    </div>
  );
};
