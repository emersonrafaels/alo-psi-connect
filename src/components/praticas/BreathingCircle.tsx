import { useEffect, useRef, useState } from "react";

interface BreathingCircleProps {
  inspirar: number;
  segurar: number;
  expirar: number;
  paused?: boolean;
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
    <div className="relative flex items-center justify-center w-72 h-72 sm:w-[26rem] sm:h-[26rem]">
      {/* Rotating SVG rings */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full pratica-halo-ring"
        style={{
          animation: paused ? "none" : "haloSpin 28s linear infinite",
        }}
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle
          cx="100"
          cy="100"
          r="92"
          stroke="hsl(var(--primary-foreground) / 0.35)"
          strokeWidth="0.6"
          strokeDasharray="2 6"
        />
        <circle
          cx="100"
          cy="100"
          r="78"
          stroke="hsl(var(--primary-foreground) / 0.25)"
          strokeWidth="0.4"
          strokeDasharray="1 4"
        />
      </svg>

      {/* Soft outer glow */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full bg-primary-foreground/20 blur-3xl pratica-halo mix-blend-screen"
        style={{
          transform: `scale(${scale})`,
          transition: `transform ${transitionDuration}s ease-in-out`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-6 rounded-full bg-primary-foreground/15 blur-2xl"
        style={{
          transform: `scale(${scale})`,
          transition: `transform ${transitionDuration}s ease-in-out`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-12 rounded-full bg-primary-foreground/25"
        style={{
          transform: `scale(${scale})`,
          transition: `transform ${transitionDuration}s ease-in-out`,
          boxShadow: "0 0 60px hsl(var(--primary-foreground) / 0.35)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-20 rounded-full bg-primary-foreground/40 backdrop-blur-sm"
        style={{
          transform: `scale(${scale})`,
          transition: `transform ${transitionDuration}s ease-in-out`,
        }}
      />
      <div className="relative z-10 flex flex-col items-center text-primary-foreground select-none">
        <p className="font-serif text-3xl sm:text-5xl tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
          {label}
        </p>
        <p className="text-sm sm:text-base opacity-80 mt-2">{secondsLeft}s</p>
      </div>
    </div>
  );
};
