import { useEffect, useRef, useState } from "react";

export type BreathingPhase =
  | "inspirar"
  | "inspirar_curta"
  | "segurar"
  | "expirar"
  | "segurar_pos_expirar";

interface BreathingCircleProps {
  inspirar: number;
  segurar: number;
  expirar: number;
  /** Pausa após expirar (box breathing). 0 = ignorada. */
  segurarPosExpirar?: number;
  /** Segunda inspiração curta (suspiro fisiológico). 0 = ignorada. */
  inspirarCurta?: number;
  paused?: boolean;
  onPhaseChange?: (phase: BreathingPhase) => void;
  reducedMotion?: boolean;
  largeLabels?: boolean;
}

const ALL_PHASES: BreathingPhase[] = [
  "inspirar",
  "inspirar_curta",
  "segurar",
  "expirar",
  "segurar_pos_expirar",
];

const LABEL: Record<BreathingPhase, string> = {
  inspirar: "Inspire",
  inspirar_curta: "Inspire +",
  segurar: "Segure",
  expirar: "Expire",
  segurar_pos_expirar: "Pause",
};

// Escala visual por fase. Inspirar(es) expandem; expirar contrai; segurar mantém.
const PHASE_SCALE: Record<BreathingPhase, number> = {
  inspirar: 1,
  inspirar_curta: 1.05,
  segurar: 1,
  expirar: 0.55,
  segurar_pos_expirar: 0.55,
};

export const BreathingCircle = ({
  inspirar,
  segurar,
  expirar,
  segurarPosExpirar = 0,
  inspirarCurta = 0,
  paused = false,
  onPhaseChange,
  reducedMotion = false,
  largeLabels = false,
}: BreathingCircleProps) => {
  const durations: Record<BreathingPhase, number> = {
    inspirar,
    inspirar_curta: inspirarCurta,
    segurar,
    expirar,
    segurar_pos_expirar: segurarPosExpirar,
  };
  const activePhases = ALL_PHASES.filter((p) => (durations[p] ?? 0) > 0);
  const initialPhase: BreathingPhase = activePhases[0] ?? "inspirar";

  const [phase, setPhase] = useState<BreathingPhase>(initialPhase);
  const [secondsLeft, setSecondsLeft] = useState(durations[initialPhase] || 1);
  const phaseRef = useRef<BreathingPhase>(initialPhase);
  const remainingRef = useRef<number>(durations[initialPhase] || 1);
  const firstPhaseFiredRef = useRef(false);

  useEffect(() => {
    if (paused) return;
    if (!firstPhaseFiredRef.current) {
      firstPhaseFiredRef.current = true;
      setTimeout(() => onPhaseChange?.(initialPhase), 200);
    }
    const tick = setInterval(() => {
      remainingRef.current -= 0.1;
      if (remainingRef.current <= 0) {
        const idx = activePhases.indexOf(phaseRef.current);
        const next = activePhases[(idx + 1) % activePhases.length];
        const dur = durations[next] || 1;
        phaseRef.current = next;
        remainingRef.current = dur;
        setPhase(next);
        onPhaseChange?.(next);
      }
      setSecondsLeft(Math.max(0, Math.ceil(remainingRef.current)));
    }, 100);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, inspirar, segurar, expirar, segurarPosExpirar, inspirarCurta, onPhaseChange]);

  const dynamicScale = PHASE_SCALE[phase] ?? 1;
  const scale = reducedMotion ? 0.85 : dynamicScale;
  const transitionDuration = durations[phase] || 1;
  const transition = reducedMotion
    ? "none"
    : `transform ${transitionDuration}s ease-in-out`;

  const label = LABEL[phase];

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
        <circle cx="100" cy="100" r="92" stroke="hsl(var(--primary-foreground) / 0.35)" strokeWidth="0.6" strokeDasharray="2 6" />
        <circle cx="100" cy="100" r="78" stroke="hsl(var(--primary-foreground) / 0.25)" strokeWidth="0.4" strokeDasharray="1 4" />
      </svg>

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
