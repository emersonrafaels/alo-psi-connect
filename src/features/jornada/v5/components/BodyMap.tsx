import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { getEmotionNode, getFamilyOf } from "../../config/emotion-taxonomy";
import type { BodyMapLayer, PickedEmotion } from "../types";
import type { Intensity } from "../../domain/types";

const SENSATIONS = ["Tensão", "Aperto", "Calor", "Frio", "Peso", "Agitação", "Leveza", "Expansão"];
const COLORS = ["#6a25ad", "#ef4f9b", "#16b8c4", "#e5b43d", "#5aa47d", "#718fda", "#d85fb4", "#ef7a66"];

type Side = "front" | "back";
type Zone = { id: string; label: string; side: Side; shape: "ellipse" | "path"; values: number[] | string };

const ZONES: Zone[] = [
  { id: "head", label: "Cabeça", side: "front", shape: "ellipse", values: [110, 42, 27, 31] },
  { id: "throat", label: "Garganta", side: "front", shape: "ellipse", values: [110, 81, 18, 14] },
  { id: "chest", label: "Peito", side: "front", shape: "ellipse", values: [110, 127, 43, 40] },
  { id: "abdomen", label: "Abdômen", side: "front", shape: "ellipse", values: [110, 194, 35, 38] },
  { id: "arms_front", label: "Braços", side: "front", shape: "path", values: "M66 105C48 110 43 133 40 166l-8 73c-1 12 19 14 22 2l15-72 12-51Z M154 105c18 5 23 28 26 61l8 73c1 12-19 14-22 2l-15-72-12-51Z" },
  { id: "hands_front", label: "Mãos", side: "front", shape: "path", values: "M31 237c-9 5-10 27 3 31 11 3 20-9 19-23Z M189 237c9 5 10 27-3 31-11 3-20-9-19-23Z" },
  { id: "legs_front", label: "Pernas", side: "front", shape: "path", values: "M76 225l7 160c1 13 23 13 25 0l2-145 2 145c2 13 24 13 25 0l7-160Z" },
  { id: "feet_front", label: "Pés", side: "front", shape: "path", values: "M82 382c-12 2-25 9-23 18 2 8 43 8 48 1l1-15Z M138 382c12 2 25 9 23 18-2 8-43 8-48 1l-1-15Z" },
  { id: "head_back", label: "Cabeça", side: "back", shape: "ellipse", values: [110, 42, 27, 31] },
  { id: "neck_back", label: "Nuca", side: "back", shape: "ellipse", values: [110, 81, 18, 14] },
  { id: "upper_back", label: "Costas altas", side: "back", shape: "ellipse", values: [110, 129, 43, 42] },
  { id: "lower_back", label: "Lombar", side: "back", shape: "ellipse", values: [110, 194, 35, 36] },
  { id: "arms_back", label: "Braços", side: "back", shape: "path", values: "M66 105C48 110 43 133 40 166l-8 73c-1 12 19 14 22 2l15-72 12-51Z M154 105c18 5 23 28 26 61l8 73c1 12-19 14-22 2l-15-72-12-51Z" },
  { id: "hands_back", label: "Mãos", side: "back", shape: "path", values: "M31 237c-9 5-10 27 3 31 11 3 20-9 19-23Z M189 237c9 5 10 27-3 31-11 3-20-9-19-23Z" },
  { id: "legs_back", label: "Pernas", side: "back", shape: "path", values: "M76 225l7 160c1 13 23 13 25 0l2-145 2 145c2 13 24 13 25 0l7-160Z" },
  { id: "feet_back", label: "Pés", side: "back", shape: "path", values: "M82 382c-12 2-25 9-23 18 2 8 43 8 48 1l1-15Z M138 382c12 2 25 9 23 18-2 8-43 8-48 1l-1-15Z" },
];

const SILHOUETTE = "M110 11c-21 0-34 16-34 38 0 17 8 30 20 36l-6 12-29 11c-12 5-17 16-19 30L29 235c-2 16 22 20 26 4l15-75 7 69 4 151c0 18 25 19 27 2l2-142 2 142c2 17 27 16 27-2l4-151 7-69 15 75c4 16 28 12 26-4l-13-97c-2-14-7-25-19-30l-29-11-6-12c12-6 20-19 20-36 0-22-13-38-34-38Z";

export const BodyMap = ({ emotions, layers, note, onChange, onNote, onStatus }: { emotions: PickedEmotion[]; layers: BodyMapLayer[]; note: string; onChange: (layers: BodyMapLayer[]) => void; onNote: (note: string) => void; onStatus: (status: "mapped" | "no_clear_signals" | "skipped") => void }) => {
  const [activeId, setActiveId] = useState(layers[0]?.id ?? "");
  const [custom, setCustom] = useState("");
  const active = layers.find((layer) => layer.id === activeId) ?? layers[0];
  const sources = useMemo(() => emotions.map((item) => ({ id: item.emotionId, label: getEmotionNode(item.emotionId)?.label ?? item.emotionId, color: getFamilyOf(item.emotionId)?.color ?? COLORS[0], kind: "emotion" as const })), [emotions]);

  const add = (id: string, label: string, kind: "emotion" | "sensation", color?: string) => {
    const existing = layers.find((layer) => layer.sourceId === id);
    if (existing) { setActiveId(existing.id); return; }
    const next: BodyMapLayer = { id: `${id}_${Date.now()}`, sourceId: id, label, kind, color: color ?? COLORS[layers.length % COLORS.length], intensity: 3, zoneIds: [] };
    onChange([...layers, next]);
    setActiveId(next.id);
  };

  const update = (patch: Partial<BodyMapLayer>) => {
    if (!active) return;
    onChange(layers.map((layer) => layer.id === active.id ? { ...layer, ...patch } : layer));
  };

  const toggleZone = (zoneId: string) => {
    if (!active) return;
    update({ zoneIds: active.zoneIds.includes(zoneId) ? active.zoneIds.filter((id) => id !== zoneId) : [...active.zoneIds, zoneId] });
  };

  const renderZone = (zone: Zone) => {
    const selectedLayers = layers.filter((layer) => layer.zoneIds.includes(zone.id));
    const isActive = active?.zoneIds.includes(zone.id) ?? false;
    const shared = {
      role: "button",
      tabIndex: 0,
      "aria-label": `${zone.label}${isActive ? ", selecionado" : ""}`,
      onClick: () => toggleZone(zone.id),
      onKeyDown: (event: React.KeyboardEvent<SVGElement>) => (event.key === "Enter" || event.key === " ") && toggleZone(zone.id),
      className: "cursor-pointer outline-none transition-all hover:stroke-primary focus:stroke-primary",
    };
    const color = selectedLayers[0]?.color ?? "currentColor";
    const opacity = selectedLayers.length ? Math.min(.18 + (selectedLayers[0]?.intensity ?? 3) * .08, .56) : 0;
    if (zone.shape === "ellipse") {
      const [cx, cy, rx, ry] = zone.values as number[];
      return <g key={zone.id}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} fillOpacity={opacity} stroke={selectedLayers.length ? color : "currentColor"} strokeOpacity={selectedLayers.length ? .95 : .18} strokeWidth={selectedLayers.length ? 3 : 1.2} {...shared} />
        {selectedLayers.slice(1).map((layer, index) => <ellipse key={layer.id} cx={cx + (index + 1) * 5} cy={cy} rx={Math.max(8, rx - (index + 1) * 4)} ry={Math.max(8, ry - (index + 1) * 4)} fill="none" stroke={layer.color} strokeWidth="3" pointerEvents="none" />)}
      </g>;
    }
    return <path key={zone.id} d={zone.values as string} fill={color} fillOpacity={opacity} stroke={selectedLayers.length ? color : "currentColor"} strokeOpacity={selectedLayers.length ? .9 : .12} strokeWidth={selectedLayers.length ? 2.5 : 1} {...shared} />;
  };

  const figure = (side: Side) => (
    <div className="text-center">
      <span className="text-xs font-semibold text-muted-foreground">{side === "front" ? "Frente" : "Costas"}</span>
      <svg viewBox="0 0 220 415" className="mx-auto mt-2 h-[300px] w-full max-w-[180px] sm:h-[340px]" aria-label={`Mapa corporal de ${side === "front" ? "frente" : "costas"}`}>
        <path d={SILHOUETTE} className="fill-primary/5 stroke-primary/20" strokeWidth="1.5" />
        <path d="M82 91c18 13 38 13 56 0M77 164c21 10 45 10 66 0M110 95v139M80 233h60M85 387c8 6 16 6 23 0M112 387c8 6 16 6 23 0" className="fill-none stroke-primary/15" strokeWidth="1.2" pointerEvents="none" />
        {ZONES.filter((zone) => zone.side === side).map(renderZone)}
      </svg>
    </div>
  );

  const removeLayer = (layer: BodyMapLayer) => {
    const remaining = layers.filter((item) => item.id !== layer.id);
    onChange(remaining);
    if (active?.id === layer.id) setActiveId(remaining[0]?.id ?? "");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-card to-accent/20 p-4 sm:p-5">
          <div className="text-center">
            <h3 className="text-sm font-bold text-foreground sm:text-base">2. Toque nas regiões em que percebe a camada selecionada</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Você pode marcar várias áreas. Se duas camadas aparecerem no mesmo lugar, as cores ficam lado a lado na mesma região.</p>
          </div>
          {active ? (
            <div className="mt-4 grid grid-cols-2 gap-3">{figure("front")}{figure("back")}</div>
          ) : (
            <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">Escolha ao lado uma emoção ou sensação para começar o mapa.</div>
          )}
        </section>

        <aside className="h-max rounded-2xl border border-border/70 bg-card p-4 shadow-sm xl:sticky xl:top-24">
          <h3 className="font-bold text-foreground">Camadas do meu corpo agora</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Selecione uma camada para continuar marcando regiões, ajustar intensidade ou removê-la.</p>

          {layers.length > 0 && <div className="mt-4 space-y-2">{layers.map((layer) => (
            <button key={layer.id} type="button" onClick={() => setActiveId(layer.id)} className={cn("flex w-full items-center gap-2 rounded-xl border p-3 text-left transition-colors", active?.id === layer.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50")}>
              <span className="h-8 w-2 shrink-0 rounded-full" style={{ backgroundColor: layer.color }} />
              <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-foreground">{layer.label} <span className="ml-1 text-[10px] font-medium text-primary">opcional</span></strong><span className="block truncate text-[10px] text-muted-foreground">{layer.zoneIds.map((id) => ZONES.find((zone) => zone.id === id)?.label).filter(Boolean).join(" · ") || "Nenhuma região marcada"}</span></span>
              <X className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            </button>
          ))}</div>}

          <div className="mt-4 space-y-3 border-t border-border/70 pt-4">
            <p className="text-xs font-semibold text-foreground">1. O que você quer localizar?</p>
            <div className="flex flex-wrap gap-1.5">{sources.map((source) => <Button key={source.id} variant="outline" size="sm" className="h-8 rounded-full text-xs" onClick={() => add(source.id, source.label, source.kind, source.color)}>{source.label}</Button>)}{SENSATIONS.map((label) => <Button key={label} variant="outline" size="sm" className="h-8 rounded-full text-xs" onClick={() => add(label.toLowerCase(), label, "sensation")}>{label}</Button>)}</div>
            <div className="flex gap-2"><Input value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="Outra sensação" maxLength={48} className="h-9 text-xs"/><Button variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label="Adicionar sensação" onClick={() => { if (custom.trim()) { add(custom.trim().toLowerCase(), custom.trim(), "sensation"); setCustom(""); } }}><Plus className="h-4 w-4"/></Button></div>
          </div>

          {active && <div className="mt-4 border-t border-border/70 pt-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-foreground">Intensidade de {active.label}</span><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Remover ${active.label}`} onClick={() => removeLayer(active)}><Trash2 className="h-4 w-4"/></Button></div><div className="mt-2 grid grid-cols-5 gap-1">{([1,2,3,4,5] as Intensity[]).map((value) => <Button key={value} size="icon" variant={active.intensity === value ? "default" : "outline"} className="h-8 w-full" onClick={() => update({ intensity: value })}>{value}</Button>)}</div></div>}

          <Textarea value={note} onChange={(event) => onNote(event.target.value)} placeholder="Algo mais que você percebe no corpo? (opcional)" rows={3} className="mt-4 resize-none text-xs"/>
          <div className="mt-2"><VoiceInputButton currentValue={note} onChange={onNote} /></div>
          <div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => onStatus("no_clear_signals")}>Não percebo sinais claros</Button><Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => onStatus("skipped")}>Prefiro não mapear</Button><Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => { onChange([]); onNote(""); setActiveId(""); }}>Limpar mapa</Button></div>
        </aside>
      </div>

      <Accordion type="multiple" className="space-y-3">
        <AccordionItem value="origin" className="rounded-2xl border border-border/70 bg-card px-4"><AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">De onde vem esta ideia — e por que o mapa começa vazio?</AccordionTrigger><AccordionContent className="text-sm leading-relaxed text-muted-foreground">O corpo pode dar pistas sobre o que você sente, mas não existe um mapa universal. Por isso, você começa sem marcações e registra apenas o que percebe neste momento.</AccordionContent></AccordionItem>
        <AccordionItem value="purpose" className="rounded-2xl border border-border/70 bg-card px-4"><AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">Por que observar isso pode ajudar?</AccordionTrigger><AccordionContent className="text-sm leading-relaxed text-muted-foreground">Reconhecer onde uma emoção aparece pode facilitar a compreensão de necessidades, limites e formas de cuidado que fazem sentido para você.</AccordionContent></AccordionItem>
      </Accordion>
    </div>
  );
};