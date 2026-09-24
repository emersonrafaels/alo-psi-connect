import { useState } from "react";
import { Check, ChevronDown, Clock3, Gauge, Heart, Loader2, RefreshCw, Save, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import buddyHeart from "@/assets/buddy/buddy-arms.png";
import { getEmotionLabel, getFamilyOf } from "../../config/emotion-taxonomy";
import { INTENSITY_LABELS, USEFULNESS_LABELS } from "../../config/perceived-change-options";
import { getPractice } from "../../config/practices";
import { V5_COPY } from "../copy";
import { SupportPathsDialog } from "./SupportPathsDialog";
import type { V5State } from "../types";

const dimensionLabels: Record<string, string> = {
  situation: "Situação ou fonte de estresse",
  body: "Corpo",
  behavior: "Comportamento e impulso",
  thoughts: "Pensamentos e diálogo interno",
};

/** Resumo do registro concluído, com salvamento na Minha Jornada. */
export const SessionSummary = ({ state, saving, saved, saveError, onSave, onRestart }: {
  state: V5State;
  saving: boolean;
  saved: boolean;
  saveError: string | null;
  onSave: () => void;
  onRestart: () => void;
}) => {
  const [supportOpen, setSupportOpen] = useState(false);
  const practice = getPractice(state.learning.practiceId ?? "");
  const comprehension = (["situation", "body", "behavior", "thoughts"] as const).filter(
    (key) => !!state.comprehension[key]
  );
  const elapsedMinutes = Math.max(1, Math.round(((state.completedAt ? new Date(state.completedAt).getTime() : Date.now()) - new Date(state.startedAt).getTime()) / 60000));
  const peakIntensity = state.emotions.length
    ? Math.max(...state.emotions.map((item) => item.intensityBefore))
    : null;

  const metrics = [
    { label: "Tempo da jornada", value: `${elapsedMinutes} min`, icon: Clock3 },
    { label: "Emoções registradas", value: String(state.emotions.length), icon: Heart },
    { label: "Intensidade mais alta", value: peakIntensity == null ? "—" : `${peakIntensity}/5`, icon: Gauge },
    { label: "Próximo passo", value: state.action.next ? "Definido" : "Sem ação", icon: Check },
  ];

  return (
    <>
      <article className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-[var(--shadow-elegant)]">
        <section className="relative overflow-hidden border-b border-border/70 bg-primary px-5 py-8 text-primary-foreground sm:px-10 sm:py-10">
          <div className="relative z-10 grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_180px]">
            <div className="space-y-4">
              <Badge className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/10">
                {V5_COPY.record.eyebrow}
              </Badge>
              <h2 className="max-w-2xl text-2xl font-bold leading-tight sm:text-4xl">
                Você criou um retrato do seu momento
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
                {V5_COPY.record.description}
              </p>
              <p className="max-w-2xl border-l-2 border-primary-foreground/30 pl-4 text-xs leading-relaxed text-primary-foreground/70">
                {V5_COPY.record.occurrenceNote}
              </p>
            </div>
            <div className="mx-auto grid h-36 w-36 place-items-center rounded-full bg-primary-foreground/10 sm:h-40 sm:w-40">
              <img src={buddyHeart} alt="Buddy, o companheiro da Rede Bem-Estar" loading="lazy" className="max-h-36 w-auto object-contain" />
            </div>
          </div>
        </section>

        <section className="space-y-8 px-5 py-7 sm:px-10 sm:py-10">
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon }) => (
              <div key={label} className="min-w-0 rounded-lg border border-border/70 bg-muted/35 p-4 transition-colors hover:bg-primary/5">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
                  <Icon aria-hidden className="h-4 w-4" />
                </div>
                <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                <dd className="mt-1 break-words text-xl font-bold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>

          <details className="group" open>
            <summary className="flex cursor-pointer list-none items-center justify-between border-b border-border pb-4">
              <span>
                <strong className="block text-lg text-foreground">Rever meu registro</strong>
                <small className="text-muted-foreground">Emoções, contexto, prática e próximo passo</small>
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                <span className="hidden sm:inline">Detalhes</span>
                <ChevronDown aria-hidden className="h-4 w-4 transition-transform group-open:rotate-180" />
              </span>
            </summary>

            <div className="space-y-8 pt-7">
              <section aria-labelledby="registered-emotions-title">
                <h3 id="registered-emotions-title" className="mb-4 text-xs font-bold uppercase text-muted-foreground">Emoções registradas</h3>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {state.emotions.map((item, index) => {
                    const family = getFamilyOf(item.emotionId);
                    return (
                      <li key={item.emotionId} className="relative overflow-hidden rounded-lg border border-border/70 bg-background p-5 shadow-sm">
                        <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: family?.color ?? "hsl(var(--primary))" }} />
                        <p className="text-xs font-semibold text-muted-foreground">Emoção {index + 1}</p>
                        <p className="mt-2 text-lg font-bold text-foreground">{getEmotionLabel(item.emotionId)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Antes: {item.intensityBefore}/5 · {INTENSITY_LABELS[item.intensityBefore]}
                        </p>
                        {item.intensityAfter != null && (
                          <p className="mt-1 text-xs font-medium text-primary">Depois da pausa: {item.intensityAfter}/5</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>

              <div className="grid gap-8 border-y border-border/70 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
                <section>
                  <p className="text-xs font-bold uppercase text-primary">Panorama do momento</p>
                  {comprehension.length > 0 ? (
                    <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                      {comprehension.map((key) => (
                        <div key={key}>
                          <dt className="text-xs font-semibold uppercase text-muted-foreground">{dimensionLabels[key]}</dt>
                          <dd className="mt-1 text-sm leading-relaxed text-foreground">{state.comprehension[key]}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">Nenhuma observação registrada nesta etapa.</p>
                  )}
                </section>

                <section className="rounded-lg border border-primary/20 bg-primary/5 p-5">
                  <p className="text-xs font-bold uppercase text-primary">Meu menor próximo passo possível</p>
                  <p className="mt-3 text-lg font-bold text-foreground">{state.action.next || "Sem ação definida neste registro."}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {state.action.when && <Badge variant="secondary">{V5_COPY.act.whenOptions.find((option) => option.id === state.action.when)?.label}</Badge>}
                    {state.action.status && state.action.status !== "defined" && <Badge variant="secondary">{V5_COPY.act.statusOptions.find((option) => option.id === state.action.status)?.label}</Badge>}
                  </div>
                </section>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {(practice || state.learning.skipped) && (
                  <section>
                    <h3 className="text-xs font-bold uppercase text-muted-foreground">Recurso desta jornada</h3>
                    <p className="mt-2 text-base font-semibold text-foreground">{practice?.title ?? "Sem prática nesta jornada"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {practice ? `${state.learning.durationMinutes ? `${state.learning.durationMinutes} min · ` : ""}${state.learning.completed ? "Concluída" : "Não concluída"}${state.learning.utility != null ? ` · ${USEFULNESS_LABELS[state.learning.utility]}` : ""}` : "Você seguiu sem praticar. Isso também é uma escolha válida."}
                    </p>
                  </section>
                )}

                {state.comprehension.bodyLayers.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase text-muted-foreground">Seu Mapa Corporal de hoje</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Somente o que você marcou neste check-in.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {state.comprehension.bodyLayers.map((layer) => (
                        <span key={layer.id} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground">
                          <i aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: layer.color }} />
                          {layer.label} · {layer.zoneIds.length} regiões · intensidade {layer.intensity}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </details>
        </section>
      </article>

      <section className="mt-6 rounded-lg border border-border/70 bg-muted/30 p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Fora desta jornada</p>
            <h3 className="mt-1 text-2xl font-bold text-foreground">Conheça-se melhor</h3>
            <p className="mt-1 text-sm text-muted-foreground">Experiências complementares de autoconhecimento, separadas deste check-in.</p>
          </div>
          <Badge variant="secondary">Prévia · acesso do estudante</Badge>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-card p-5"><strong className="text-foreground">Sua conexão emocional</strong><p className="mt-1 text-xs text-muted-foreground">Trait Meta-Mood Scale – TMMS-24</p></div>
          <div className="rounded-lg border border-border/70 bg-card p-5"><strong className="text-foreground">Suas competências emocionais</strong><p className="mt-1 text-xs text-muted-foreground">Schutte Self-Report Emotional Intelligence Test – SSEIT</p></div>
        </div>
      </section>

      {saveError && <Alert variant="destructive" className="mt-6"><AlertDescription className="text-sm">{saveError}</AlertDescription></Alert>}

      <div className="mt-6 flex flex-wrap gap-2 rounded-lg border border-border/70 bg-card p-4 shadow-sm">
        <Button onClick={onSave} disabled={saving || saved}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          {saved ? "Registro salvo" : V5_COPY.record.save}
        </Button>
        <Button variant="outline" onClick={() => setSupportOpen(true)}><ShieldCheck className="mr-2 h-4 w-4" />{V5_COPY.record.support}</Button>
        <Button variant="outline" asChild><Link to="/buddy/jornada"><Sparkles className="mr-2 h-4 w-4" />{V5_COPY.record.openLandscape}</Link></Button>
        <Button variant="ghost" onClick={onRestart}><RefreshCw className="mr-2 h-4 w-4" />{V5_COPY.record.again}</Button>
      </div>

      <SupportPathsDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </>
  );
};
