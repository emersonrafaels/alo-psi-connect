import { useState } from "react";
import { Check, ChevronDown, Loader2, RefreshCw, Save, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import buddyHeart from "@/assets/buddy/buddy-arms.png";
import { getEmotionNode, getEmotionPath, getFamilyOf } from "../../config/emotion-taxonomy";
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
export const SessionSummary = ({
  state,
  saving,
  saved,
  saveError,
  onSave,
  onRestart,
}: {
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

  const strip = [
    { label: "Emoções registradas", value: String(state.emotions.length) },
    {
      label: "Intensidade mais alta",
      value: state.emotions.length
        ? String(Math.max(...state.emotions.map((item) => item.intensityBefore)))
        : "—",
    },
    {
      label: "Prática",
      value: practice
        ? state.learning.completed
          ? "Concluída"
          : "Conhecida"
        : "Sem prática",
    },
    {
      label: "Próximo passo",
      value: state.action.next ? "Definido" : "Sem ação definida",
    },
  ];

  return (
    <>
      <Card className="border-border/70 shadow-sm">
        <CardContent className="space-y-6 p-5 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {V5_COPY.record.eyebrow}
              </p>
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Você criou um retrato do seu momento</h2>
              <p className="max-w-3xl text-sm text-muted-foreground">
                {V5_COPY.record.description}
              </p>
              <p className="rounded-2xl border border-border/70 bg-muted/25 p-4 text-xs leading-relaxed text-muted-foreground">
                {V5_COPY.record.occurrenceNote}
              </p>
            </div>
            <img
              src={buddyHeart}
              alt="Buddy, o companheiro da Rede Bem-Estar"
              loading="lazy"
              className="mx-auto max-h-44 w-auto object-contain"
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4"><div><span className="text-xs text-muted-foreground">Tempo desta jornada</span><strong className="block text-xl text-foreground">{elapsedMinutes} min</strong></div><small className="max-w-md text-right text-xs text-muted-foreground">O tempo foi registrado automaticamente, sem cronômetro durante a experiência.</small></div>

          <dl className="grid gap-3 sm:grid-cols-4">
            {strip.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border/70 bg-muted/25 p-4"
              >
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
                <dd className="mt-1 text-lg font-semibold text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>

          <details className="group rounded-2xl border border-border/70 p-5" open>
            <summary className="flex cursor-pointer list-none items-center justify-between"><span><strong className="block text-sm">Rever meu registro</strong><small className="text-muted-foreground">Emoções, contexto, prática e próximo passo</small></span><ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary>
          <div className="mt-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Emoções registradas</h3>
            <ul className="grid gap-2 sm:grid-cols-3">
              {state.emotions.map((item) => {
                const node = getEmotionNode(item.emotionId);
                const family = getFamilyOf(item.emotionId);
                return (
                  <li
                    key={item.emotionId}
                    className="rounded-2xl border border-border/70 bg-card p-3"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: family?.color ?? "hsl(var(--primary))" }}
                      />
                      <span className="text-sm font-semibold text-foreground">
                        {node?.label ?? item.emotionId}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                        {getEmotionPath(item.emotionId).map((part) => part.label).join(" › ")} ·{" "}
                      Antes: {item.intensityBefore} · {INTENSITY_LABELS[item.intensityBefore]}
                      {item.intensityAfter != null && (
                        <> · Depois da pausa: {item.intensityAfter}</>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {comprehension.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-border/70 p-5">
              <h3 className="text-sm font-semibold text-foreground">Panorama do momento</h3>
              <dl className="grid gap-3 sm:grid-cols-2">
                {comprehension.map((key) => (
                  <div key={key}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {dimensionLabels[key]}
                    </dt>
                    <dd className="text-sm text-foreground">{state.comprehension[key]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {(practice || state.learning.skipped) && (
            <div className="space-y-2 rounded-2xl border border-border/70 p-5">
              <h3 className="text-sm font-semibold text-foreground">Recurso desta jornada</h3>
              {practice ? (
                <p className="text-sm text-muted-foreground">
                  {practice.title}
                  {state.learning.durationMinutes ? ` · ${state.learning.durationMinutes} min` : ""}
                  {state.learning.completed ? " · concluída" : " · não concluída"}
                  {state.learning.utility != null &&
                    ` · ${USEFULNESS_LABELS[state.learning.utility]}`}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Você seguiu sem praticar. Isso também é uma escolha válida.
                </p>
              )}
            </div>
          )}

          {(state.action.direct || state.action.influence || state.action.none) && (
            <div className="grid gap-3 rounded-2xl border border-border/70 p-5 sm:grid-cols-3">
              {V5_COPY.act.columns.map((column) => {
                const text = state.action[column.key as "direct" | "influence" | "none"];
                if (!text) return null;
                return (
                  <div key={column.key}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {column.title}
                    </p>
                    <p className="text-sm text-foreground">{text}</p>
                  </div>
                );
              })}
            </div>
          )}

          {(state.action.next || state.action.status) && (
            <div className="space-y-2 rounded-2xl border border-primary/25 bg-primary/5 p-5">
              <h3 className="text-sm font-semibold text-foreground">{V5_COPY.act.stepTitle}</h3>
              {state.action.next ? (
                <p className="text-sm text-foreground">{state.action.next}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Sem ação definida neste registro.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {state.action.when && (
                  <Badge variant="secondary" className="rounded-full text-xs font-normal">
                    {
                      V5_COPY.act.whenOptions.find((option) => option.id === state.action.when)
                        ?.label
                    }
                  </Badge>
                )}
                {state.action.status && state.action.status !== "defined" && (
                  <Badge variant="secondary" className="rounded-full text-xs font-normal">
                    {
                      V5_COPY.act.statusOptions.find((option) => option.id === state.action.status)
                        ?.label
                    }
                  </Badge>
                )}
              </div>
            </div>
          )}
          {state.comprehension.bodyLayers.length > 0 && <div className="space-y-3 rounded-2xl border border-border/70 p-5"><h3 className="text-sm font-semibold">Seu Mapa Corporal de hoje</h3><p className="text-xs text-muted-foreground">Esta visualização usa somente o que você marcou neste check-in.</p><div className="flex flex-wrap gap-2">{state.comprehension.bodyLayers.map((layer) => <span key={layer.id} className="rounded-full border border-border px-3 py-1.5 text-xs"><i className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: layer.color }}/>{layer.label} · {layer.zoneIds.length} regiões · intensidade {layer.intensity}</span>)}</div></div>}
          </details>

          <section className="rounded-2xl border border-border/70 bg-muted/20 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-primary">Fora desta jornada</p><h3 className="mt-1 text-lg font-semibold">Conheça-se melhor</h3><p className="text-sm text-muted-foreground">Experiências complementares de autoconhecimento, separadas deste check-in.</p></div><Badge variant="secondary">Prévia · acesso do estudante</Badge></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-card p-4"><strong>Sua conexão emocional</strong><p className="mt-1 text-xs text-muted-foreground">Trait Meta-Mood Scale – TMMS-24</p></div><div className="rounded-xl bg-card p-4"><strong>Suas competências emocionais</strong><p className="mt-1 text-xs text-muted-foreground">Schutte Self-Report Emotional Intelligence Test – SSEIT</p></div></div><p className="mt-4 text-xs text-muted-foreground"><strong className="text-foreground">Ferramentas de aprofundamento:</strong> CBI-S e DERS-36 ficam fora da descoberta espontânea e podem ser disponibilizadas no ambiente profissional quando houver indicação adequada.</p></section>

          {saveError && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{saveError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={onSave} disabled={saving || saved}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : saved ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saved ? "Registro salvo" : V5_COPY.record.save}
            </Button>
            <Button variant="outline" onClick={() => setSupportOpen(true)}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              {V5_COPY.record.support}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/buddy/jornada">
                <Sparkles className="mr-2 h-4 w-4" />
                {V5_COPY.record.openLandscape}
              </Link>
            </Button>
            <Button variant="ghost" onClick={onRestart}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {V5_COPY.record.again}
            </Button>
          </div>
        </CardContent>
      </Card>

      <SupportPathsDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </>
  );
};
