import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { EMOTION_FAMILIES, getEmotionNode } from "../../config/emotion-taxonomy";

const SIZE = 820;
const CENTER = SIZE / 2;
const polar = (radius: number, angle: number) => {
  const radians = (angle - 90) * Math.PI / 180;
  return { x: CENTER + radius * Math.cos(radians), y: CENTER + radius * Math.sin(radians) };
};
const slice = (inner: number, outer: number, start: number, end: number) => {
  const a = polar(outer, start); const b = polar(outer, end); const c = polar(inner, end); const d = polar(inner, start);
  return `M${a.x},${a.y} A${outer},${outer} 0 0 1 ${b.x},${b.y} L${c.x},${c.y} A${inner},${inner} 0 0 0 ${d.x},${d.y} Z`;
};

export const EmotionWheelV11 = ({ familyId, level2Id, level3Id, onSelectFamily, onSelectLevel2, onSelectLevel3 }: {
  familyId: string | null; level2Id: string | null; level3Id?: string | null;
  onSelectFamily: (id: string) => void; onSelectLevel2: (id: string) => void; onSelectLevel3: (id: string) => void;
}) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const selectedIds = [familyId, level2Id, level3Id].filter(Boolean);
  const label = getEmotionNode(hovered)?.label ?? getEmotionNode(level3Id)?.label ?? getEmotionNode(level2Id)?.label ?? getEmotionNode(familyId)?.label;
  const sectors = useMemo(() => EMOTION_FAMILIES.map((family, familyIndex) => {
    const familyStart = familyIndex * 60;
    const level2 = family.children.flatMap((node, index) => {
      const start = familyStart + index * 30;
      return [{ node, start, end: start + 30 }, ...(node.children ?? []).map((child, childIndex) => ({ node: child, start: start + childIndex * 15, end: start + (childIndex + 1) * 15 }))];
    });
    return { family, familyStart, level2 };
  }), []);
  const text = (name: string, radius: number, start: number, end: number, size: number) => {
    const p = polar(radius, (start + end) / 2);
    const words = name.length > 11 ? [name.slice(0, Math.ceil(name.length / 2)), name.slice(Math.ceil(name.length / 2))] : [name];
    return <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={size} fontWeight="700" className="pointer-events-none fill-foreground">{words.map((word, index) => <tspan key={word} x={p.x} dy={index ? 12 : words.length > 1 ? -5 : 0}>{word}</tspan>)}</text>;
  };
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[760px]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full drop-shadow-xl" role="group" aria-label="Roda das emoções interativa">
        {sectors.map(({ family, familyStart, level2 }) => {
          const activeFamily = !familyId || familyId === family.id;
          return <g key={family.id} className={cn("transition-opacity", !activeFamily && "opacity-30")}>
            <path d={slice(56, 158, familyStart, familyStart + 60)} fill={family.color} stroke="hsl(var(--background))" strokeWidth="4" role="button" tabIndex={0} aria-label={`Família ${family.label}`} onClick={() => onSelectFamily(family.id)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && onSelectFamily(family.id)} onMouseEnter={() => setHovered(family.id)} onMouseLeave={() => setHovered(null)} className="cursor-pointer outline-none transition-[filter] hover:brightness-105 focus-visible:brightness-110" />
            {text(family.label, 108, familyStart, familyStart + 60, 17)}
            {level2.filter((item) => item.node.level === 2).map(({ node, start, end }) => <g key={node.id} >
              <path d={slice(162, 275, start, end)} fill={family.color} fillOpacity=".72" stroke="hsl(var(--background))" strokeWidth="3" role="button" tabIndex={0} aria-label={`${family.label}, ${node.label}`} onClick={() => onSelectLevel2(node.id)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && onSelectLevel2(node.id)} onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)} className="cursor-pointer outline-none hover:brightness-105" />
              {text(node.label, 218, start, end, 13)}
            </g>)}
            {level2.filter((item) => item.node.level === 3).map(({ node, start, end }) => <g key={node.id} >
              <path d={slice(279, 394, start, end)} fill={family.color} fillOpacity=".42" stroke="hsl(var(--background))" strokeWidth="2" role="button" tabIndex={0} aria-label={`Selecionar ${node.label}`} onClick={() => onSelectLevel3(node.id)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && onSelectLevel3(node.id)} onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)} className={cn("cursor-pointer outline-none hover:brightness-105", selectedIds.includes(node.id) && "brightness-110")} />
              {text(node.label, 334, start, end, 11)}
            </g>)}
          </g>;
        })}
        <circle cx={CENTER} cy={CENTER} r="51" className="fill-card" />
        <text x={CENTER} y={CENTER - 7} textAnchor="middle" className="fill-foreground text-[17px] font-bold">{label ?? "Como você"}</text>
        <text x={CENTER} y={CENTER + 15} textAnchor="middle" className="fill-muted-foreground text-[13px]">{label ? "está presente" : "está agora?"}</text>
      </svg>
    </div>
  );
};