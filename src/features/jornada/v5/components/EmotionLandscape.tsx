import { useMemo, useState } from "react";
import { BarChart3, ChevronDown, LineChart, MapPinned } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EMOTION_FAMILIES, getEmotionLabel, getFamilyOf } from "../../config/emotion-taxonomy";
import { BODY_REGION_OPTIONS, getBodyRegionLabel, getBodyZone } from "../bodyRegions";
import type { BodyMapLayer, PickedEmotion } from "../types";
import type { JourneyEmotionHistoryRow, LandscapeBubble } from "../useV5Signals";
import { BodySilhouette } from "./BodySilhouette";

type EmotionLandscapeProps = {
  bubbles: LandscapeBubble[];
  todayIds: string[];
  todayEmotions?: PickedEmotion[];
  bodyLayers?: BodyMapLayer[];
  history?: JourneyEmotionHistoryRow[];
  isLoading?: boolean;
};

const occurrenceLabel = (count: number) => `${count} registro${count === 1 ? "" : "s"}`;
const clampIntensity = (value: number | null | undefined) => Math.max(1, Math.min(5, Math.round(value ?? 3)));

const formatShortDate = (date: string | null | undefined) => {
  if (!date) return "Registro";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Registro";
  return parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

const linePoints = (
  selected: LandscapeBubble | undefined,
  today: PickedEmotion | undefined,
  history: JourneyEmotionHistoryRow[]
) => {
  const selectedId = selected?.emotion_id ?? today?.emotionId;
  const historical = selectedId
    ? history
        .filter((row) => row.emotion_id === selectedId)
        .slice(-7)
        .map((row) => ({ y: clampIntensity(row.intensity_before), label: formatShortDate(row.created_at) }))
    : [];
  const current = today ? [{ y: clampIntensity(today.intensityBefore), label: "Hoje" }] : [];
  const source = [...historical, ...current];

  if (source.length === 0) {
    const fallback = clampIntensity(selected?.avg_intensity);
    return [
      { x: 0, y: fallback, label: "Média" },
      { x: 100, y: fallback, label: "Atual" },
    ];
  }

  if (source.length === 1) return [{ x: 50, ...source[0] }];
  return source.map((point, index) => ({
    ...point,
    x: (index / (source.length - 1)) * 100,
  }));
};

export const EmotionLandscape = ({
  bubbles,
  todayIds,
  todayEmotions = [],
  bodyLayers = [],
  history = [],
  isLoading,
}: EmotionLandscapeProps) => {
  const [tab, setTab] = useState<"emotion" | "body">("emotion");
  const [selectedEmotionId, setSelectedEmotionId] = useState(todayIds[0] ?? bubbles[0]?.emotion_id ?? "");

  const items = useMemo(() => {
    const map = new Map<string, LandscapeBubble>();
    for (const bubble of bubbles) map.set(bubble.emotion_id, bubble);
    for (const current of todayEmotions) {
      const existing = map.get(current.emotionId);
      if (existing) {
        map.set(current.emotionId, {
          ...existing,
          occurrences: Math.max(existing.occurrences, 1),
          avg_intensity: existing.avg_intensity ?? current.intensityBefore,
          label: getEmotionLabel(current.emotionId),
        });
      } else {
        map.set(current.emotionId, {
          emotion_id: current.emotionId,
          family_id: current.familyId,
          occurrences: 1,
          avg_intensity: current.intensityBefore,
          last_at: null,
          label: getEmotionLabel(current.emotionId),
        });
      }
    }
    return [...map.values()].sort((a, b) => b.occurrences - a.occurrences).slice(0, 18);
  }, [bubbles, todayEmotions]);

  const max = Math.max(1, ...items.map((item) => item.occurrences));
  const familyCounts = EMOTION_FAMILIES.map((family) => {
    const familyItems = items.filter((item) => item.family_id === family.id);
    const count = familyItems.reduce((sum, item) => sum + item.occurrences, 0);
    const avg = familyItems.length
      ? familyItems.reduce((sum, item) => sum + (item.avg_intensity ?? 0), 0) / familyItems.length
      : null;
    return { family, count, avg };
  }).filter((item) => item.count > 0);
  const familyMax = Math.max(1, ...familyCounts.map((item) => item.count));

  const selected = items.find((item) => item.emotion_id === selectedEmotionId) ?? items[0];
  const selectedToday = todayEmotions.find((item) => item.emotionId === (selected?.emotion_id ?? selectedEmotionId));
  const points = linePoints(selected, selectedToday, history);
  const path = points.map((point, index) => {
    const x = 32 + point.x * 4.2;
    const y = 178 - (point.y - 1) * 34;
    return `${index === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");
  const areaPath = `${path} L452,178 L32,178 Z`;

  const bodyRegionRows = useMemo(() => {
    const regionMap = new Map<string, { id: string; label: string; count: number; intensityTotal: number }>();
    for (const layer of bodyLayers) {
      const ids = [...layer.zoneIds, ...(layer.movedRegionId ? [layer.movedRegionId] : [])];
      for (const id of ids) {
        const zone = getBodyZone(id);
        if (!zone) continue;
        const key = zone.label;
        const current = regionMap.get(key) ?? { id: key, label: zone.label, count: 0, intensityTotal: 0 };
        current.count += 1;
        current.intensityTotal += layer.intensity;
        regionMap.set(key, current);
      }
    }
    return [...regionMap.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  }, [bodyLayers]);
  const bodyMax = Math.max(1, ...bodyRegionRows.map((item) => item.count));
  const highlightedBodyLayers = bodyLayers.map((layer) =>
    layer.movedRegionId && !layer.zoneIds.includes(layer.movedRegionId)
      ? { ...layer, zoneIds: [...layer.zoneIds, layer.movedRegionId] }
      : layer
  );
  const bodyPatterns = bodyLayers
    .flatMap((layer) => {
      const zones = layer.zoneIds.slice(0, 2).map((id) => getBodyRegionLabel(id)).filter(Boolean);
      const moved = layer.movedRegionId ? getBodyRegionLabel(layer.movedRegionId) : null;
      return [...zones, moved ? `mudou para ${moved}` : null].filter(Boolean).map((label) => ({ layer, label }));
    })
    .slice(0, 5);

  return (
    <details className="group" open>
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-sm">
        <span>
          <strong className="block text-base text-foreground">Explorar minha Paisagem Emocional</strong>
          <small className="text-muted-foreground">Frequência, intensidade e sinais corporais ao longo dos registros</small>
        </span>
        <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
      </summary>

      <Card className="mt-3 border-border/70">
        <CardContent className="space-y-6 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Sua Paisagem Emocional</h3>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Uma leitura longitudinal dos registros que você escolheu fazer. Frequência e intensidade permanecem como medidas separadas.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Bolha: tamanho = frequência</Badge>
              <Badge variant="outline">Número = intensidade típica</Badge>
              <Badge variant="outline">Cor = família emocional</Badge>
            </div>
          </div>

          <div className="flex gap-2" role="tablist">
            <Button variant={tab === "emotion" ? "default" : "outline"} size="sm" onClick={() => setTab("emotion")}>
              Emoções
            </Button>
            <Button variant={tab === "body" ? "default" : "outline"} size="sm" onClick={() => setTab("body")}>
              Corpo
            </Button>
          </div>

          {tab === "emotion" ? (
            <div className="space-y-7">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando sua paisagem…</p>
              ) : items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Sua Paisagem começa a se formar com este registro.</p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-card to-teal/10 p-4">
                    <div className="flex min-h-[220px] flex-wrap items-center justify-center gap-4">
                      {items.map((item) => {
                        const family = getFamilyOf(item.emotion_id);
                        const size = 58 + item.occurrences / max * 56;
                        return (
                          <button
                            key={item.emotion_id}
                            type="button"
                            onClick={() => setSelectedEmotionId(item.emotion_id)}
                            className={cn(
                              "grid shrink-0 place-items-center rounded-full border-2 p-2 text-center shadow-sm transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring",
                              todayIds.includes(item.emotion_id) || selected?.emotion_id === item.emotion_id
                                ? "border-foreground"
                                : "border-background"
                            )}
                            style={{ width: size, height: size, backgroundColor: family?.color, opacity: 0.56 + (item.avg_intensity ?? 3) / 12 }}
                            title={`${item.occurrences} ocorrência(s)`}
                          >
                            <strong className="max-w-[88px] text-[11px] leading-tight text-primary-foreground">{item.label}</strong>
                            <span className="text-[10px] font-semibold text-primary-foreground">
                              {occurrenceLabel(item.occurrences)} · int. típica {item.avg_intensity?.toFixed(0) ?? "—"}/5
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary">Em destaque: emoções de hoje</Badge>
                      <Badge variant="secondary">Clique em uma bolha para abrir o histórico</Badge>
                    </div>
                  </div>

                  <aside className="rounded-2xl border border-border/70 bg-card p-5">
                    <h4 className="text-base font-bold text-foreground">Uma leitura do que você registrou</h4>
                    <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
                      <li>• {todayEmotions.length || todayIds.length} emoção(ões) registrada(s) hoje.</li>
                      <li>• Foco de hoje: {getEmotionLabel(todayIds[0])}{selectedToday ? ` · intensidade ${selectedToday.intensityBefore}/5` : ""}.</li>
                      <li>• Estes dados descrevem registros voluntários; não representam diagnóstico.</li>
                    </ul>
                  </aside>
                </div>
              )}

              {items.length > 0 && (
                <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-teal/10 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h4 className="flex items-center gap-2 text-base font-bold text-foreground">
                        <LineChart className="h-4 w-4 text-primary" />
                        Intensidade de “{selected?.label ?? getEmotionLabel(selectedEmotionId)}” nos registros recentes
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">A linha usa registros salvos quando existem e inclui o check-in atual antes do salvamento.</p>
                    </div>
                    <div className="w-full sm:w-48">
                      <label className="text-xs font-bold uppercase text-muted-foreground" htmlFor="landscape-emotion-select">Emoção</label>
                      <Select value={selected?.emotion_id ?? selectedEmotionId} onValueChange={setSelectedEmotionId}>
                        <SelectTrigger id="landscape-emotion-select" className="mt-1 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((item) => (
                            <SelectItem key={item.emotion_id} value={item.emotion_id}>{item.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <svg viewBox="0 0 500 220" className="mt-4 h-56 w-full" aria-label="Linha de intensidade emocional">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <g key={value}>
                        <line x1="32" x2="452" y1={178 - (value - 1) * 34} y2={178 - (value - 1) * 34} className="stroke-border" strokeDasharray="4 6" />
                        <text x="16" y={183 - (value - 1) * 34} className="fill-muted-foreground text-[10px]">{value}</text>
                      </g>
                    ))}
                    <path d={areaPath} className="fill-primary/10" />
                    <path d={path} className="fill-none stroke-primary" strokeWidth="4" strokeLinecap="round" />
                    {points.map((point, index) => {
                      const x = 32 + point.x * 4.2;
                      const y = 178 - (point.y - 1) * 34;
                      return (
                        <g key={`${point.label}-${index}`}>
                          <circle cx={x} cy={y} r="6" className="fill-card stroke-primary" strokeWidth="4" />
                          <text x={x - 12} y={y - 12} className="fill-foreground text-[11px] font-bold">{point.y}/5</text>
                          <text x={x - 14} y="205" className="fill-muted-foreground text-[10px]">{point.label}</text>
                        </g>
                      );
                    })}
                  </svg>
                </section>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-border/70 p-4">
                  <h4 className="flex items-center gap-2 font-semibold text-foreground">
                    <BarChart3 className="h-4 w-4 text-primary" />Frequência por família emocional
                  </h4>
                  <div className="mt-4 space-y-3">
                    {familyCounts.length ? familyCounts.map(({ family, count, avg }) => (
                      <div key={family.id}>
                        <div className="mb-1 flex justify-between gap-3 text-xs">
                          <span><strong className="text-foreground">{family.label}</strong><br/><span className="text-muted-foreground">intensidade típica {avg?.toFixed(0) ?? "—"}/5</span></span>
                          <span className="font-semibold text-foreground">{occurrenceLabel(count)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div className="h-full rounded-full" style={{ width: `${(count / familyMax) * 100}%`, backgroundColor: family.color }} />
                        </div>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">Sem histórico de famílias ainda.</p>}
                  </div>
                </section>

                <section className="rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-foreground">Emoções deste check-in</h4>
                    <Badge variant="outline">Hoje</Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {todayEmotions.length ? todayEmotions.map((item, index) => {
                      const family = getFamilyOf(item.emotionId);
                      return (
                        <div key={item.emotionId}>
                          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                            <span><strong className="text-foreground">{getEmotionLabel(item.emotionId)}</strong><br/><span className="text-xs text-muted-foreground">{index + 1}ª emoção percebida</span></span>
                            <span className="font-bold text-foreground">{item.intensityBefore}/5</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${item.intensityBefore * 20}%`, backgroundColor: family?.color }} /></div>
                        </div>
                      );
                    }) : todayIds.map((id) => <div key={id} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-primary"/><span className="text-sm">{getEmotionLabel(id)}</span><Badge variant="secondary" className="ml-auto">Hoje</Badge></div>)}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="space-y-7">
              {bodyLayers.length ? (
                <>
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-card to-teal/10 p-5">
                      <div className="grid grid-cols-2 gap-4">
                        <BodySilhouette side="front" layers={highlightedBodyLayers} heightClassName="h-[300px]" />
                        <BodySilhouette side="back" layers={highlightedBodyLayers} heightClassName="h-[300px]" />
                      </div>
                    </div>
                    <aside className="rounded-2xl border border-border/70 bg-card p-5">
                      <h4 className="text-base font-bold text-foreground">Padrões que vêm aparecendo</h4>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        No corpo, frequência e intensidade continuam separadas: a recorrência da região aparece sem transformar isso em diagnóstico.
                      </p>
                      <ul className="mt-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
                        {bodyPatterns.map(({ layer, label }, index) => (
                          <li key={`${layer.id}-${label}-${index}`}>
                            • <strong className="text-foreground">{layer.label}</strong> · {label}: intensidade típica {layer.intensity}/5
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {bodyLayers.slice(0, 4).map((layer) => <Badge key={layer.id} variant="secondary">{layer.label}</Badge>)}
                      </div>
                    </aside>
                  </div>

                  <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-teal/10 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="flex items-center gap-2 text-base font-bold text-foreground">
                          <MapPinned className="h-4 w-4 text-primary" />
                          Regiões corporais mais recorrentes
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">A barra representa frequência. A intensidade típica permanece apresentada separadamente ao lado.</p>
                      </div>
                      <Badge variant="outline">Frequência corporal</Badge>
                    </div>
                    <div className="mt-5 space-y-4">
                      {bodyRegionRows.length ? bodyRegionRows.map((row) => (
                        <div key={row.id} className="grid gap-2 sm:grid-cols-[110px_minmax(0,1fr)_88px] sm:items-center">
                          <div className="text-xs">
                            <strong className="block text-foreground">{row.label}</strong>
                            <span className="text-muted-foreground">intensidade típica {Math.round(row.intensityTotal / row.count)}/5</span>
                          </div>
                          <div className="h-3 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-teal" style={{ width: `${(row.count / bodyMax) * 100}%` }} />
                          </div>
                          <div className="text-xs font-bold text-foreground">{occurrenceLabel(row.count)}</div>
                        </div>
                      )) : <p className="text-sm text-muted-foreground">As regiões aparecerão depois que você marcar o corpo nesta jornada.</p>}
                    </div>
                    <p className="mt-5 text-xs text-muted-foreground">Uma mesma região pode reunir sensações diferentes; a relação sensação + região é preservada no histórico detalhado.</p>
                  </section>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <h4 className="font-semibold text-foreground">Histórico corporal</h4>
                  <p className="mt-2 text-sm text-muted-foreground">As regiões e sensações começam a aparecer aqui depois que você registra o Mapa Corporal.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {BODY_REGION_OPTIONS.slice(0, 6).map((region) => <Badge key={region.id} variant="secondary">{region.label}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </details>
  );
};
