import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { EMOTION_FAMILIES, getEmotionNode } from "../config/emotion-taxonomy";
import { getFamilyEmoji } from "../config/family-emojis";
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

const clampNum = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Tamanho de fonte derivado do espaço real do arco (corda no raio do rótulo)
 * e da espessura do anel, em vez de contagem bruta de caracteres.
 * Fatias estreitas leem melhor com o texto no sentido radial.
 */
const fitFont = (
  label: string,
  radius: number,
  arcDeg: number,
  ringWidth: number,
  bounds: { min: number; max: number },
  preferRadial = false
) => {
  const radial = preferRadial || arcDeg < 55;
  const chord = 2 * radius * Math.sin((arcDeg * Math.PI) / 360);
  const available = radial ? ringWidth - 18 : Math.min(chord * 0.9, ringWidth * 1.4);
  const single = available / Math.max(label.length, 1) / 0.58;
  const lines = single < bounds.min ? wrap(label, Math.ceil(label.length / 2)) : [label];
  const longest = Math.max(...lines.map((l) => l.length));
  return {
    radial,
    lines,
    size: Math.round(clampNum(available / Math.max(longest, 1) / 0.58, bounds.min, bounds.max)),
  };
};



export interface EmotionWheelProps {
  familyId: string | null;
  level2Id: string | null;
  level3Id?: string | null;
  onSelectFamily: (familyId: string) => void;
  onSelectLevel2: (emotionId: string) => void;
  onSelectLevel3: (emotionId: string) => void;
  onBackLevel: () => void;
  className?: string;
}

/**
 * Roda das Emoções em anéis concêntricos.
 * Sem família escolhida: um único anel com as 6 famílias.
 * Com família escolhida: núcleo da família + anel de nível 2 + anel de nível 3
 * (este último focado apenas na fatia de nível 2 selecionada).
 */
export const EmotionWheel = ({
  familyId,
  level2Id,
  level3Id = null,
  onSelectFamily,
  onSelectLevel2,
  onSelectLevel3,
  onBackLevel,
  className,
}: EmotionWheelProps) => {
  const reducedMotion = usePrefersReducedMotion();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const buzz = useCallback(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.(8);
      } catch {
        /* silencioso */
      }
    }
  }, []);

  const family = useMemo(
    () => EMOTION_FAMILIES.find((f) => f.id === familyId) ?? null,
    [familyId]
  );
  const level2Node = getEmotionNode(level2Id);
  const level3Node = getEmotionNode(level3Id);
  const sliceRefs = useRef<Record<string, SVGPathElement | null>>({});
  const keyboardNav = useRef(false);
  const prevFamily = useRef<string | null>(null);

  const registerSlice = useCallback(
    (id: string) => (el: SVGPathElement | null) => {
      sliceRefs.current[id] = el;
    },
    []
  );

  // Foco só é movido quando a navegação veio do teclado (evita scroll-jump no clique).
  useEffect(() => {
    if (family && prevFamily.current !== family.id && keyboardNav.current) {
      const first = family.children?.[0];
      if (first) sliceRefs.current[first.id]?.focus?.();
    }
    prevFamily.current = family?.id ?? null;
  }, [family]);

  const focusSibling = (siblings: EmotionNode[], index: number, delta: number) => {
    const next = siblings[(index + delta + siblings.length) % siblings.length];
    keyboardNav.current = true;
    sliceRefs.current[next.id]?.focus?.();
  };

  const handleKeys = (
    event: React.KeyboardEvent,
    siblings: EmotionNode[],
    index: number,
    onSelect: () => void,
    neighbors?: { up?: string | null; down?: string | null }
  ) => {
    const focusId = (id?: string | null) => {
      if (!id) return;
      keyboardNav.current = true;
      sliceRefs.current[id]?.focus?.();
    };

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        keyboardNav.current = true;
        onSelect();
        return;
      case "Escape":
        event.preventDefault();
        onBackLevel();
        return;
      case "ArrowRight":
        event.preventDefault();
        focusSibling(siblings, index, 1);
        return;
      case "ArrowLeft":
        event.preventDefault();
        focusSibling(siblings, index, -1);
        return;
      case "ArrowUp":
        event.preventDefault();
        focusId(neighbors?.up);
        return;
      case "ArrowDown":
        event.preventDefault();
        focusId(neighbors?.down);
        return;
      case "Home":
        event.preventDefault();
        focusId(siblings[0]?.id);
        return;
      case "End":
        event.preventDefault();
        focusId(siblings[siblings.length - 1]?.id);
        return;
      default:
    }
  };

  const sliceClass = cn(
    "cursor-pointer outline-none hover:brightness-105 focus-visible:brightness-110",
    !reducedMotion && "transition-[fill,d,opacity] duration-300"
  );

  const liveMessage = family
    ? [family.label, level2Node?.label, level3Node?.label].filter(Boolean).join(" · ")
    : "Nenhuma família selecionada";

  // ---------- nível 1 (famílias) ----------
  const familyRing = useMemo(() => {
    const step = 360 / EMOTION_FAMILIES.length;
    return EMOTION_FAMILIES.map((item, index) => {
      const start = index * step;
      const end = start + step;
      const tone = shade(item.color, -4, 4);
      return {
        item,
        index,
        path: sector(112, 302, start, end),
        emoji: midPoint(246, start, end),
        label: midPoint(196, start, end),
        tone,
        ink: inkOn(tone),
        font: fitFont(item.label, 196, step, 170, { min: 16, max: 24 }),
      };
    });
  }, []);

  const hoveredNode = getEmotionNode(hoveredId);
  const hoveredFamily = EMOTION_FAMILIES.find((f) => f.id === hoveredId) ?? null;

  if (!family) {
    return (
      <div className={cn("relative w-full", className)}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full overflow-visible"
          role="group"
          aria-label="Roda das Emoções: escolha a família emocional mais próxima"
        >
          <defs>
            <radialGradient id="wheel-halo" cx="50%" cy="50%" r="50%">
              <stop offset="55%" stopColor="hsl(var(--primary))" stopOpacity="0.16" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={C} cy={C} r={318} fill="url(#wheel-halo)" />
          {familyRing.map(({ item, index, path, label, emoji, tone, ink, font }) => (
            <g
              key={item.id}
              className={cn(!reducedMotion && "animate-scale-in")}
              style={!reducedMotion ? { animationDelay: `${index * 45}ms` } : undefined}
            >
              <path
                ref={registerSlice(item.id)}
                d={path}
                fill={tone}
                stroke="hsl(var(--background))"
                strokeWidth={2.5}
                tabIndex={0}
                role="button"
                aria-label={`Família ${item.label}`}
                className={sliceClass}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId((prev) => (prev === item.id ? null : prev))}
                onFocus={() => setHoveredId(item.id)}
                onBlur={() => setHoveredId((prev) => (prev === item.id ? null : prev))}
                onClick={() => {
                  buzz();
                  onSelectFamily(item.id);
                }}
                onKeyDown={(e) =>
                  handleKeys(e, EMOTION_FAMILIES as EmotionNode[], index, () =>
                    onSelectFamily(item.id)
                  )
                }
              />
              <text
                x={emoji.x}
                y={emoji.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={34}
                className="pointer-events-none select-none"
              >
                {getFamilyEmoji(item.id)}
              </text>
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={font.size}
                className="pointer-events-none select-none font-bold"
                fill={ink}
              >
                {item.label}
              </text>
            </g>
          ))}
          <circle cx={C} cy={C} r={106} fill="hsl(var(--card))" />
        </svg>

        <div className="pointer-events-none absolute left-1/2 top-1/2 w-[32%] -translate-x-1/2 -translate-y-1/2 space-y-1 text-center">
          {hoveredFamily ? (
            <div className={cn(!reducedMotion && "animate-fade-in")}>
              <p className="text-3xl leading-none" aria-hidden>
                {getFamilyEmoji(hoveredFamily.id)}
              </p>
              <p
                className="mt-1 text-xl font-bold leading-tight"
                style={{ color: hoveredFamily.color }}
              >
                {hoveredFamily.label}
              </p>
            </div>
          ) : (
            <>
              <p
                className={cn(
                  "text-lg font-semibold leading-tight text-foreground",
                  !reducedMotion && "pulse"
                )}
              >
                Como você está?
              </p>
              <p className="text-xs leading-snug text-muted-foreground">
                Toque na família mais próxima do que você sente agora
              </p>
            </>
          )}
        </div>

        <p className="sr-only" aria-live="polite">
          {liveMessage}
        </p>
      </div>
    );
  }


  // ---------- níveis 2 e 3 ----------
  const level2List = family.children ?? [];
  const tones = ringTones(family.color);
  const step2 = 360 / Math.max(level2List.length, 1);

  const selectedIndex = level2List.findIndex((node) => node.id === level2Id);
  const selected = selectedIndex >= 0 ? level2List[selectedIndex] : null;
  const selectedChildren = selected?.children ?? [];

  // O anel externo aparece só para a fatia escolhida, num arco largo e legível.
  const outerArc = selected ? Math.max(step2, 120) : 0;
  const outerStart = selected
    ? selectedIndex * step2 + step2 / 2 - outerArc / 2
    : 0;
  const step3 = outerArc / Math.max(selectedChildren.length, 1);
  const neutralOuter = muteColor(tones.level3, 72);

  // Tipografia uniforme por anel: usa o menor tamanho que serve a todos os rótulos.
  const ringFont2 = level2List.map((node) =>
    fitFont(node.label, 186, step2, 90, { min: 12, max: 18 })
  );
  const size2 = Math.min(...ringFont2.map((f) => f.size));
  const ringFont3 = selectedChildren.map((child) =>
    fitFont(child.label, 270, step3, 78, { min: 12, max: 17 }, true)
  );
  const size3 = selectedChildren.length ? Math.min(...ringFont3.map((f) => f.size)) : 14;


  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full overflow-visible"
        role="group"
        aria-label={`Roda das Emoções: família ${family.label}. Escolha a palavra mais próxima.`}
      >
        <defs>
          <radialGradient id="wheel-halo-family" cx="50%" cy="50%" r="50%">
            <stop offset="52%" stopColor={family.color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={family.color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={C} cy={C} r={322} fill="url(#wheel-halo-family)" />

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

        {/* faixa neutra do anel externo enquanto não há palavra escolhida */}
        {!selected && (
          <>
            <path
              d={sector(234, 300, 0, 360)}
              fill={neutralOuter}
              className="pointer-events-none"
            />
            <text
              x={C}
              y={38}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={15}
              className="pointer-events-none select-none font-semibold uppercase tracking-widest"
              fill={inkOn(neutralOuter)}
            >
              escolha uma palavra
            </text>
          </>
        )}

        {/* fatias do nível 2 (todas as formas primeiro, rótulos depois) */}
        {level2List.map((node, index) => {
          const start = index * step2;
          const active = level2Id === node.id;
          const fill2 = active
            ? shade(tones.level2, -8, 6)
            : level2Id
              ? muteColor(tones.level2, 42)
              : tones.level2;
          return (
            <path
              key={node.id}
              ref={registerSlice(node.id)}
              d={sector(140, 230, start, start + step2)}
              fill={fill2}
              stroke="hsl(var(--background))"
              strokeWidth={2}
              tabIndex={0}
              role="button"
              aria-pressed={active}
              aria-label={`${node.label}, nível 2 de ${family.label}`}
              className={sliceClass}
              onClick={() => onSelectLevel2(node.id)}
              onKeyDown={(e) =>
                handleKeys(e, level2List, index, () => onSelectLevel2(node.id), {
                  down: active ? selectedChildren[0]?.id : null,
                })
              }
            />
          );
        })}

        {/* anel externo focado na fatia escolhida */}
        {selected &&
          selectedChildren.map((child, childIndex) => {
            const cStart = outerStart + childIndex * step3;
            const fill3 = level3Id === child.id ? shade(tones.level3, -12, 8) : tones.level3;
            return (
              <path
                key={child.id}
                ref={registerSlice(child.id)}
                d={sector(234, 306, cStart, cStart + step3)}
                fill={fill3}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                tabIndex={0}
                role="button"
                aria-pressed={level3Id === child.id}
                aria-label={`${child.label}, nível 3 de ${selected.label}`}
                className={sliceClass}
                onClick={() => onSelectLevel3(child.id)}
                onKeyDown={(e) =>
                  handleKeys(e, selectedChildren, childIndex, () => onSelectLevel3(child.id), {
                    up: selected.id,
                  })
                }
              />
            );
          })}

        {/* rótulos do nível 2 */}
        {level2List.map((node, index) => {
          const start = index * step2;
          const active = level2Id === node.id;
          const label = midPoint(186, start, start + step2);
          const fill2 = active
            ? shade(tones.level2, -8, 6)
            : level2Id
              ? muteColor(tones.level2, 42)
              : tones.level2;
          const font2 = { lines: ringFont2[index].lines, size: size2 };
          const mid2 = start + step2 / 2;
          const rot2 = ringFont2[index].radial
            ? `rotate(${mid2 > 180 ? mid2 + 90 : mid2 - 90}, ${label.x}, ${label.y})`
            : undefined;
          return (
            <text
              key={`${node.id}-label`}
              x={label.x}
              y={label.y}
              transform={rot2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={font2.size}
              className="pointer-events-none select-none font-bold"
              fill={inkOn(fill2)}
            >

              {font2.lines.map((line, i) => (
                <tspan
                  key={line}
                  x={label.x}
                  dy={
                    i === 0 ? (font2.lines.length > 1 ? -font2.size * 0.55 : 0) : font2.size * 1.1
                  }
                >
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}

        {/* rótulos do nível 3 */}
        {selected &&
          selectedChildren.map((child, childIndex) => {
            const cStart = outerStart + childIndex * step3;
            const cLabel = midPoint(270, cStart, cStart + step3);
            const fill3 = level3Id === child.id ? shade(tones.level3, -12, 8) : tones.level3;
            const font3 = { lines: ringFont3[childIndex].lines, size: size3 };
            const mid3 = cStart + step3 / 2;
            const rot3 = ringFont3[childIndex].radial
              ? `rotate(${mid3 > 180 ? mid3 + 90 : mid3 - 90}, ${cLabel.x}, ${cLabel.y})`
              : undefined;
            return (
              <text
                key={`${child.id}-label`}
                x={cLabel.x}
                y={cLabel.y}
                transform={rot3}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={font3.size}
                className="pointer-events-none select-none font-semibold"
                fill={inkOn(fill3)}
              >

                {font3.lines.map((line, i) => (
                  <tspan
                    key={line}
                    x={cLabel.x}
                    dy={
                      i === 0 ? (font3.lines.length > 1 ? -font3.size * 0.55 : 0) : font3.size * 1.1
                    }
                  >
                    {line}
                  </tspan>
                ))}
              </text>
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
        {level3Node && (
          <p className="text-xs font-medium leading-tight text-muted-foreground">
            {level3Node.label}
          </p>
        )}
        <button
          type="button"
          onClick={onBackLevel}
          className="text-[11px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          {level2Node ? "voltar" : "trocar família"}
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>
    </div>
  );
};
