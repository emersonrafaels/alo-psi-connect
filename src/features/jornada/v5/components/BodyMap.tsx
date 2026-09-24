import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getEmotionNode, getFamilyOf } from "../../config/emotion-taxonomy";
import type { BodyMapLayer, PickedEmotion } from "../types";
import type { Intensity } from "../../domain/types";

const SENSATIONS = ["Tensão", "Aperto", "Calor", "Frio", "Peso", "Agitação", "Leveza", "Expansão", "Alívio", "Vazio", "Tremor", "Cansaço", "Relaxamento", "Formigamento", "Pressão", "Nó", "Dor ou desconforto", "Pulsação", "Respiração curta", "Borboletas", "Rigidez", "Arrepio"];
const COLORS = ["#6a25ad", "#ef4f9b", "#16b8c4", "#e5b43d", "#5aa47d", "#718fda", "#d85fb4", "#ef7a66"];
const ZONES = [
  { id: "head", label: "Cabeça", side: "front", x: 88, y: 10, w: 44, h: 54 }, { id: "throat", label: "Garganta", side: "front", x: 96, y: 64, w: 28, h: 25 },
  { id: "chest", label: "Peito", side: "front", x: 67, y: 88, w: 86, h: 72 }, { id: "abdomen", label: "Abdômen", side: "front", x: 75, y: 160, w: 70, h: 74 },
  { id: "arms_front", label: "Braços", side: "front", x: 34, y: 101, w: 152, h: 130 }, { id: "hands_front", label: "Mãos", side: "front", x: 27, y: 225, w: 166, h: 38 },
  { id: "legs_front", label: "Pernas", side: "front", x: 72, y: 235, w: 76, h: 145 }, { id: "feet_front", label: "Pés", side: "front", x: 62, y: 378, w: 96, h: 34 },
  { id: "neck_back", label: "Nuca", side: "back", x: 96, y: 64, w: 28, h: 25 }, { id: "upper_back", label: "Costas altas", side: "back", x: 67, y: 88, w: 86, h: 72 },
  { id: "lower_back", label: "Lombar", side: "back", x: 75, y: 160, w: 70, h: 74 }, { id: "arms_back", label: "Braços", side: "back", x: 34, y: 101, w: 152, h: 130 },
  { id: "hands_back", label: "Mãos", side: "back", x: 27, y: 225, w: 166, h: 38 }, { id: "legs_back", label: "Pernas", side: "back", x: 72, y: 235, w: 76, h: 145 },
];

export const BodyMap = ({ emotions, layers, note, onChange, onNote, onStatus }: { emotions: PickedEmotion[]; layers: BodyMapLayer[]; note: string; onChange: (layers: BodyMapLayer[]) => void; onNote: (note: string) => void; onStatus: (status: "mapped" | "no_clear_signals" | "skipped") => void }) => {
  const [activeId, setActiveId] = useState(layers[0]?.id ?? "");
  const [custom, setCustom] = useState("");
  const active = layers.find((layer) => layer.id === activeId);
  const sources = useMemo(() => emotions.map((item) => ({ id: item.emotionId, label: getEmotionNode(item.emotionId)?.label ?? item.emotionId, color: getFamilyOf(item.emotionId)?.color ?? COLORS[0], kind: "emotion" as const })), [emotions]);
  const add = (id: string, label: string, kind: "emotion" | "sensation", color?: string) => {
    const existing = layers.find((layer) => layer.sourceId === id);
    if (existing) return setActiveId(existing.id);
    const next: BodyMapLayer = { id: `${id}_${Date.now()}`, sourceId: id, label, kind, color: color ?? COLORS[layers.length % COLORS.length], intensity: 3, zoneIds: [] };
    onChange([...layers, next]); setActiveId(next.id);
  };
  const update = (patch: Partial<BodyMapLayer>) => active && onChange(layers.map((layer) => layer.id === active.id ? { ...layer, ...patch } : layer));
  const toggleZone = (zoneId: string) => {
    if (!active) return;
    update({ zoneIds: active.zoneIds.includes(zoneId) ? active.zoneIds.filter((id) => id !== zoneId) : [...active.zoneIds, zoneId] });
  };
  const figure = (side: "front" | "back") => <div className="text-center"><span className="text-xs font-semibold text-muted-foreground">{side === "front" ? "Frente" : "Costas"}</span><svg viewBox="0 0 220 430" className="mx-auto mt-2 w-full max-w-[190px]" aria-label={`Mapa corporal de ${side === "front" ? "frente" : "costas"}`}><path d="M110 12c-22 0-35 17-35 39 0 18 8 30 20 36l-7 13-37 17-18 100 22 6 22-79-5 96-8 166h34l12-145 12 145h34l-8-166-5-96 22 79 22-6-18-100-37-17-7-13c12-6 20-18 20-36 0-22-13-39-35-39Z" className="fill-muted stroke-border" strokeWidth="2"/>{ZONES.filter((zone) => zone.side === side).map((zone) => { const selected = active?.zoneIds.includes(zone.id); return <rect key={zone.id} x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="12" fill={selected ? active?.color : "transparent"} fillOpacity={selected ? .35 + (active?.intensity ?? 3) * .1 : 0} className="cursor-pointer stroke-transparent hover:stroke-primary" role="button" tabIndex={0} aria-label={`${zone.label}${selected ? ", selecionado" : ""}`} onClick={() => toggleZone(zone.id)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && toggleZone(zone.id)}/>} )}</svg></div>;
  return <div className="space-y-5 rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
    <div><h3 className="font-semibold text-foreground">Mapa Corporal do Momento</h3><p className="mt-1 text-sm text-muted-foreground">Construa seu mapa em camadas. A mesma região pode conter mais de uma experiência.</p></div>
    <div><p className="mb-2 text-sm font-semibold">1. O que você quer localizar no corpo?</p><div className="flex flex-wrap gap-2">{sources.map((source) => <Button key={source.id} variant="outline" size="sm" onClick={() => add(source.id, source.label, source.kind, source.color)}>{source.label}</Button>)}{SENSATIONS.slice(0, 8).map((label) => <Button key={label} variant="outline" size="sm" onClick={() => add(label.toLowerCase(), label, "sensation")}>{label}</Button>)}</div><div className="mt-2 flex gap-2"><Input value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="Escrever outra sensação" maxLength={48}/><Button variant="outline" size="icon" aria-label="Adicionar sensação" onClick={() => { if (custom.trim()) { add(custom.trim().toLowerCase(), custom.trim(), "sensation"); setCustom(""); } }}><Plus className="h-4 w-4"/></Button></div></div>
    {active ? <><div className="rounded-xl border border-border bg-card p-3"><div className="flex items-center justify-between gap-2"><Button variant="ghost" className="justify-start font-semibold" onClick={() => setActiveId(active.id)}><span className="h-3 w-3 rounded-full" style={{ backgroundColor: active.color }}/>{active.label}</Button><Button variant="ghost" size="icon" aria-label={`Remover ${active.label}`} onClick={() => { onChange(layers.filter((layer) => layer.id !== active.id)); setActiveId(""); }}><Trash2 className="h-4 w-4"/></Button></div><div className="mt-3 flex items-center gap-2"><span className="text-xs text-muted-foreground">Intensidade</span>{([1,2,3,4,5] as Intensity[]).map((value) => <Button key={value} size="icon" variant={active.intensity === value ? "default" : "outline"} className="h-8 w-8" onClick={() => update({ intensity: value })}>{value}</Button>)}</div></div><div><p className="mb-2 text-sm font-semibold">2. Toque nas regiões em que percebe esta camada</p><div className="grid grid-cols-2 gap-2 rounded-xl bg-card p-3">{figure("front")}{figure("back")}</div></div></> : <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Escolha uma emoção ou sensação para começar o mapa.</p>}
    {layers.length > 0 && <div className="flex flex-wrap gap-2">{layers.map((layer) => <Button key={layer.id} variant="outline" size="sm" onClick={() => setActiveId(layer.id)} className={cn("rounded-full", activeId === layer.id && "border-primary bg-primary/10")}><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: layer.color }}/>{layer.label} · {layer.zoneIds.length}</Button>)}</div>}
    <Textarea value={note} onChange={(event) => onNote(event.target.value)} placeholder="Algo mais que você percebe no corpo? (opcional)" rows={3}/>
    <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => onStatus("no_clear_signals")}>Não percebo sinais claros</Button><Button variant="outline" size="sm" onClick={() => onStatus("skipped")}>Prefiro não mapear</Button><Button variant="ghost" size="sm" onClick={() => { onChange([]); onNote(""); }}>Limpar mapa</Button></div>
  </div>;
};