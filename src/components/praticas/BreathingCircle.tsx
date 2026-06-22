import { useEffect, useRef, useState } from "react";

interface BreathingCircleProps {
  inspirar: number;
  segurar: number;
  expirar: number;
  paused?: boolean;
  onPhaseChange?: (phase: "inspirar" | "segurar" | "expirar") => void;
  /** Use a static visual (no scale transition / spinning ring) for users that prefer reduced motion. */
  reducedMotion?: boolean;
  /** Bigger and bolder phase label / counter for accessibility ("legendas grandes"). */
  largeLabels?: boolean;
}

const PHASES = ["inspirar", "segurar", "expirar"] as const;
type Phase = (typeof PHASES)[number];

export const BreathingCircle = ({
  inspirar,
  segurar,
  expirar,
  paused = false,
  onPhaseChange,
  reducedMotion = false,
  largeLabels = false,
}: BreathingCircleProps) => {
  const [phase, setPhase] = useState<Phase>("inspirar");
  const [secondsLeft, setSecondsLeft] = useState(inspirar);
  const phaseRef = useRef<Phase>("inspirar");
  const remainingRef = useRef<number>(inspirar);
  const firstPhaseFiredRef = useRef(false);

  // Dispara sino/feedback para a primeira fase ("Inspire") logo na montagem,
  // já que o loop principal só notifica em transições subsequentes.
  useEffect(() => {
    if (firstPhaseFiredRef.current) return;
    firstPhaseFiredRef.current = true;
    const t = setTimeout(() => onPhaseChange?.("inspirar"), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const dynamicScale = phase === "inspirar" ? 1 : phase === "segurar" ? 1 : 0.55;
  const scale = reducedMotion ? 0.85 : dynamicScale;
  const transitionDuration =
    phase === "inspirar" ? inspirar : phase === "segurar" ? segurar : expirar;
  const transition = reducedMotion
    ? "none"
    : `transform ${transitionDuration}s ease-in-out`;

  const label =
    phase === "inspirar" ? "Inspire" : phase === "segurar" ? "Segure" : "Expire";

  const labelClass = largeLabels
    ? "font-serif text-5xl sm:text-7xl tracking-wide font-semibold drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)]"
    : "font-serif text-3xl sm:text-5xl tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]";
  const counterClass = largeLabels
    ? "text-4xl sm:text-5xl font-bold tabular-nums mt-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
    : "text-2xl sm:text-3xl font-semibold tabular-nums mt-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: "min(22rem, 42vh)", height: "min(22rem, 42vh)" }}
    >
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full pratica-halo-ring"
        style={{
          animation: paused || reducedMotion ? "none" : "haloSpin 28s linear infinite",
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
        style={{ transform: `scale(${scale})`, transition }}
      />
      <div
        aria-hidden
        className="absolute inset-6 rounded-full bg-primary-foreground/15 blur-2xl"
        style={{ transform: `scale(${scale})`, transition }}
      />
      <div
        aria-hidden
        className="absolute inset-12 rounded-full bg-primary-foreground/25"
        style={{
          transform: `scale(${scale})`,
          transition,
          boxShadow: "0 0 60px hsl(var(--primary-foreground) / 0.35)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-20 rounded-full bg-primary-foreground/40 backdrop-blur-sm"
        style={{ transform: `scale(${scale})`, transition }}
      />
      <div className="relative z-10 flex flex-col items-center text-primary-foreground select-none">
        <p className={labelClass}>{label}</p>
        <p className={counterClass}>{secondsLeft}s</p>
      </div>
    </div>
  );
};
