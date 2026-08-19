import { EMOTION_FAMILIES } from "../config/emotion-taxonomy";
import { cn } from "@/lib/utils";

/** Roda das Emoções (desktop) — nível 1, sempre abre o nível 2. */
export const EmotionWheel = ({
  selectedFamilyId,
  onSelectFamily,
}: {
  selectedFamilyId: string | null;
  onSelectFamily: (familyId: string) => void;
}) => {
  const size = 360;
  const center = size / 2;
  const outer = 168;
  const inner = 92;
  const step = 360 / EMOTION_FAMILIES.length;

  const arc = (index: number) => {
    const start = (index * step - 90) * (Math.PI / 180);
    const end = ((index + 1) * step - 90) * (Math.PI / 180);
    const p = (r: number, a: number) => `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`;
    return [
      `M ${p(inner, start)}`,
      `L ${p(outer, start)}`,
      `A ${outer} ${outer} 0 0 1 ${p(outer, end)}`,
      `L ${p(inner, end)}`,
      `A ${inner} ${inner} 0 0 0 ${p(inner, start)}`,
      "Z",
    ].join(" ");
  };

  const labelPos = (index: number) => {
    const mid = ((index + 0.5) * step - 90) * (Math.PI / 180);
    const r = (outer + inner) / 2;
    return { x: center + r * Math.cos(mid), y: center + r * Math.sin(mid) };
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[360px]"
        role="group"
        aria-label="Roda das Emoções: escolha uma família emocional"
      >
        {EMOTION_FAMILIES.map((family, index) => {
          const selected = selectedFamilyId === family.id;
          const pos = labelPos(index);
          return (
            <g key={family.id}>
              <path
                d={arc(index)}
                fill={family.color}
                className={cn(
                  "cursor-pointer transition-[opacity,transform] duration-300 origin-center outline-none",
                  selected ? "opacity-100" : "opacity-70 hover:opacity-95"
                )}
                stroke="hsl(var(--background))"
                strokeWidth={4}
                tabIndex={0}
                role="button"
                aria-pressed={selected}
                aria-label={family.label}
                onClick={() => onSelectFamily(family.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectFamily(family.id);
                  }
                }}
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none select-none text-[13px] font-semibold"
                fill="hsl(var(--background))"
              >
                {family.label}
              </text>
            </g>
          );
        })}
        <circle cx={center} cy={center} r={inner - 6} fill="hsl(var(--card))" />
        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          className="text-[12px] font-semibold uppercase tracking-wider"
          fill="hsl(var(--muted-foreground))"
        >
          Nível 1
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          className="text-[14px] font-medium"
          fill="hsl(var(--foreground))"
        >
          Família emocional
        </text>
      </svg>
    </div>
  );
};
