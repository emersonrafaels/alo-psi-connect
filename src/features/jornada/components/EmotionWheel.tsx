import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { EMOTION_FAMILIES, getEmotionNode } from "../config/emotion-taxonomy";
import type { EmotionNode } from "../domain/types";
import { inkOn, muteColor, ringTones, shade } from "../utils/wheelColors";

const SIZE = 640;
const C = SIZE / 2;

const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);

const point = (r: number, deg: number) => {
  const a = toRad(deg);
  return `${C + r * Math.cos(a)},${C + r * Math.sin(a)}`;
};

/** Setor de anel (donut slice). */
const sector = (rInner: number, rOuter: number, start: number, end: number) => {
  const large = end - start > 180 ? 1 : 0;
  if (end - start >= 359.999) {
    return [
      `M ${C - rOuter},${C}`,
      `A ${rOuter} ${rOuter} 0 1 1 ${C + rOuter},${C}`,
      `A ${rOuter} ${rOuter} 0 1 1 ${C - rOuter},${C}`,
      `M ${C - rInner},${C}`,
      `A ${rInner} ${rInner} 0 1 0 ${C + rInner},${C}`,
      `A ${rInner} ${rInner} 0 1 0 ${C - rInner},${C}`,
      "Z",
    ].join(" ");
  }
  return [
    `M ${point(rInner, start)}`,
    `L ${point(rOuter, start)}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${point(rOuter, end)}`,
    `L ${point(rInner, end)}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${point(rInner, start)}`,
    "Z",
  ].join(" ");
};

const midPoint = (r: number, start: number, end: number) => {
  const a = toRad((start + end) / 2);
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a), deg: (start + end) / 2 };
};

/** Divide um texto longo em duas linhas equilibradas. */
const wrap = (label: string, maxChars: number) => {
  if (label.length <= maxChars) return [label];
  const words = label.split(" ");
  if (words.length === 1) return [label];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
};

export interface EmotionWheelProps {
  familyId: string | null;
  level2Id: string | null;
  onSelectFamily: (familyId: string) => void;
  onSelectLevel2: (emotionId: string) => void;
  onSelectLevel3: (emotionId: string) => void;
  onBackLevel: () => void;
  className?: string;
}

/**
 * Roda das Emoções em anéis concêntricos.
 * Sem família escolhida: um único anel com as 6 famílias.
 * Com família escolhida: núcleo da família + anel de nível 2 + anel de nível 3.
 */
export const EmotionWheel = ({
  familyId,
  level2Id,
  onSelectFamily,
  onSelectLevel2,
  onSelectLevel3,
  onBackLevel,
  className,
}: EmotionWheelProps) => {
  const family = useMemo(
    () => EMOTION_FAMILIES.find((f) => f.id === familyId) ?? null,
    [familyId]
  );
  const level2Node = getEmotionNode(level2Id);
  const sliceRefs = useRef<Record<string, SVGPathElement | null>>({});
  const prevFamily = useRef<string | null>(null);

  // Ao abrir uma família, foca a primeira fatia de nível 2 (navegação por teclado).
  useEffect(() => {
    if (family && prevFamily.current !== family.id) {
      const first = family.children?.[0];
      if (first) sliceRefs.current[first.id]?.focus?.();
    }
    prevFamily.current = family?.id ?? null;
  }, [family]);

  const handleKeys = (
    event: React.KeyboardEvent,
    siblings: EmotionNode[],
    index: number,
    onSelect: () => void
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onBackLevel();
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const next = siblings[(index + delta + siblings.length) % siblings.length];
      sliceRefs.current[next.id]?.focus?.();
    }
  };

  const sliceClass =
    "cursor-pointer outline-none transition-[fill,filter] duration-300 hover:brightness-105 focus-visible:brightness-110";

  // ---------- nível 1 (famílias) ----------
  if (!family) {
    const step = 360 / EMOTION_FAMILIES.length;
    return (
      <div className={cn("relative w-full", className)}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full"
          role="group"
          aria-label="Roda das Emoções: escolha a família emocional mais próxima"
        >
          {EMOTION_FAMILIES.map((item, index) => {
            const start = index * step;
            const end = start + step;
            const label = midPoint(212, start, end);
            const tone = shade(item.color, -4, 4);
            return (
              <g key={item.id}>
                <path
                  ref={(el) => (sliceRefs.current[item.id] = el)}
                  d={sector(112, 302, start, end)}
                  fill={tone}
                  stroke="hsl(var(--background))"
                  strokeWidth={3}
                  tabIndex={0}
                  role="button"
                  aria-label={`Família ${item.label}`}
                  className={sliceClass}
                  onClick={() => onSelectFamily(item.id)}
                  onKeyDown={(e) =>
                    handleKeys(e, EMOTION_FAMILIES as EmotionNode[], index, () =>
                      onSelectFamily(item.id)
                    )
                  }
                />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none text-[23px] font-bold"
                  fill={inkOn(tone)}
                >
                  {item.label}
                </text>
              </g>
            );
          })}
          <circle cx={C} cy={C} r={106} fill="hsl(var(--card))" />
        </svg>

        <div className="pointer-events-none absolute left-1/2 top-1/2 w-[32%] -translate-x-1/2 -translate-y-1/2 space-y-1 text-center">
          <p className="text-lg font-semibold leading-tight text-foreground">Como você está?</p>
          <p className="text-xs leading-snug text-muted-foreground">
            Toque na família mais próxima do que você sente agora
          </p>
        </div>
      </div>
    );
  }

  // ---------- níveis 2 e 3 ----------
  const level2List = family.children ?? [];
  const step2 = 360 / Math.max(level2List.length, 1);
  const tones = ringTones(family.color);
  

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full"
        role="group"
        aria-label={`Roda das Emoções: família ${family.label}. Escolha a palavra mais próxima.`}
      >
        {/* anel da família — clique volta para as famílias */}
        <path
          d={sector(94, 138, 0, 360)}
          fill={tones.family}
          tabIndex={0}
          role="button"
          aria-label={`Família ${family.label}. Voltar para escolher outra família`}
          className={sliceClass}
          onClick={onBackLevel}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
              e.preventDefault();
              onBackLevel();
            }
          }}
        />

        {level2List.map((node, index) => {
          const start = index * step2;
          const end = start + step2;
          const active = level2Id === node.id;
          const label = midPoint(186, start, end);
          const lines = wrap(node.label, 11);
          const children = node.children ?? [];
          const step3 = (end - start) / Math.max(children.length, 1);
          const fill2 = active
            ? shade(tones.level2, -8, 6)
            : level2Id
              ? muteColor(tones.level2, 42)
              : tones.level2;
          const ink2 = inkOn(fill2);

          return (
            <g key={node.id}>
              <path
                ref={(el) => (sliceRefs.current[node.id] = el)}
                d={sector(140, 230, start, end)}
                fill={fill2}
                stroke="hsl(var(--background))"
                strokeWidth={2.5}
                tabIndex={0}
                role="button"
                aria-pressed={active}
                aria-label={`${node.label}, nível 2 de ${family.label}`}
                className={sliceClass}
                onClick={() => onSelectLevel2(node.id)}
                onKeyDown={(e) =>
                  handleKeys(e, level2List, index, () => onSelectLevel2(node.id))
                }
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cn(
                  "pointer-events-none select-none font-bold",
                  lines.length > 1
                    ? "text-[15px]"
                    : node.label.length > 11
                      ? "text-[13px]"
                      : node.label.length > 8
                        ? "text-[15px]"
                        : "text-[18px]"
                )}
                fill={ink2}
              >
                {lines.map((line, i) => (
                  <tspan key={line} x={label.x} dy={i === 0 ? (lines.length > 1 ? -10 : 0) : 19}>
                    {line}
                  </tspan>
                ))}
              </text>

              {children.map((child, childIndex) => {
                const cStart = start + childIndex * step3;
                const cEnd = cStart + step3;
                const cLabel = midPoint(272, cStart, cEnd);
                const flip = cLabel.deg > 180;
                const rotation = flip ? cLabel.deg + 90 : cLabel.deg - 90;
                const fill3 = active ? tones.level3 : muteColor(tones.level3, 55);
                const ink3 = inkOn(fill3);
                const cLines = wrap(child.label, 12);
                return (
                  <g key={child.id}>
                    <path
                      ref={(el) => (sliceRefs.current[child.id] = el)}
                      d={sector(234, 306, cStart, cEnd)}
                      fill={fill3}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                      tabIndex={0}
                      role="button"
                      aria-label={`${child.label}, nível 3 de ${node.label}`}
                      className={sliceClass}
                      onClick={() => onSelectLevel3(child.id)}
                      onKeyDown={(e) =>
                        handleKeys(e, children, childIndex, () => onSelectLevel3(child.id))
                      }
                    />
                    <text
                      x={cLabel.x}
                      y={cLabel.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${rotation} ${cLabel.x} ${cLabel.y})`}
                      className={cn(
                        "pointer-events-none select-none font-semibold",
                        child.label.length > 10 ? "text-[11px]" : "text-[13px]"
                      )}
                      fill={ink3}
                    >
                      {cLines.map((line, i) => (
                        <tspan
                          key={line}
                          x={cLabel.x}
                          dy={i === 0 ? (cLines.length > 1 ? -7 : 0) : 14}
                        >
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        <circle cx={C} cy={C} r={90} fill="hsl(var(--card))" />
      </svg>

      <div className="absolute left-1/2 top-1/2 w-[26%] -translate-x-1/2 -translate-y-1/2 space-y-1 text-center">
        <span
          className="mx-auto flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest"
          style={{ color: tones.level2 }}
        >
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: tones.level2 }}
          />
          {family.label}
        </span>
        <p className="text-base font-semibold leading-tight text-foreground">
          {level2Node ? level2Node.label : "Escolha uma palavra"}
        </p>
        <button
          type="button"
          onClick={onBackLevel}
          className="text-[11px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          {level2Node ? "voltar" : "trocar família"}
        </button>
      </div>
    </div>
  );
};
