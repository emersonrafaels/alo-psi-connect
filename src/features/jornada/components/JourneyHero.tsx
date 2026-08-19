import { Link } from "react-router-dom";
import { ArrowRight, BookHeart, Flame, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BuddyMascot } from "@/components/buddy/BuddyMascot";
import { cn } from "@/lib/utils";
import { getPractice } from "../config/practices";
import type { JourneyHistoryInsight, MoodMomentum } from "../hooks/useJourneySignals";

interface JourneyHeroProps {
  basePath: string;
  history: JourneyHistoryInsight;
  mood: MoodMomentum;
  onStart?: () => void;
  startLabel?: string;
}

const Signal = ({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm">
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {icon}
      {label}
    </div>
    <p className="mt-2 text-lg font-semibold leading-tight text-foreground">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export const JourneyHero = ({
  basePath,
  history,
  mood,
  onStart,
  startLabel = "Começar agora",
}: JourneyHeroProps) => {
  const bestPractice = getPractice(history.bestPracticeId);

  const buddyMessage = history.total
    ? history.topEmotionLabel
      ? `Você já fez ${history.total} ${history.total === 1 ? "jornada" : "jornadas"}. A palavra que mais aparece é “${history.topEmotionLabel}”. Quer começar por aí?`
      : `Você já fez ${history.total} ${history.total === 1 ? "jornada" : "jornadas"}. Vamos ver como você está agora?`
    : "Nomear o que você sente já muda o que você sente. Escolha uma palavra e eu cuido do resto.";

  const moodValue =
    mood.avgMood != null ? `${mood.avgMood.toString().replace(".", ",")}/5` : "Sem registros";
  const moodHint =
    mood.trend === "up"
      ? "Em melhora nos últimos 7 dias"
      : mood.trend === "down"
        ? "Em queda nos últimos 7 dias"
        : mood.avgMood != null
          ? "Estável nos últimos 7 dias"
          : "Registre no diário para ver aqui";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full text-xs">
              <Sparkles className="mr-1 h-3 w-3" /> Novo
            </Badge>
            <Link
              to={`${basePath}/praticas`}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Voltar para Práticas
            </Link>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
              Como você está{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                agora
              </span>
              ?
            </h1>
            <p className="max-w-xl text-base text-muted-foreground">
              Nomeie a emoção na Roda, diga o quanto ela está presente e receba uma prática curta
              escolhida pela curadoria para esse estado exato.
            </p>
          </div>

          {onStart && (
            <Button size="lg" className="rounded-full px-6" onClick={onStart}>
              {startLabel} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Signal
              icon={<BookHeart className="h-3.5 w-3.5" />}
              label="Seu diário"
              value={moodValue}
              hint={moodHint}
            />
            <Signal
              icon={<Flame className="h-3.5 w-3.5" />}
              label="Suas jornadas"
              value={history.total ? `${history.total} registradas` : "Primeira vez"}
              hint={
                history.topEmotionLabel
                  ? `Mais frequente: ${history.topEmotionLabel}`
                  : "Seu histórico aparece aqui"
              }
            />
            <Signal
              icon={
                history.avgRelief != null && history.avgRelief < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5" />
                )
              }
              label="O que te ajuda"
              value={bestPractice?.title ?? "A descobrir"}
              hint={
                history.avgRelief != null
                  ? `Alívio médio de ${history.avgRelief.toString().replace(".", ",")} ponto(s)`
                  : "Depois da primeira prática você vê aqui"
              }
            />
          </div>
        </div>

        <div className={cn("flex justify-center lg:justify-end")}>
          <BuddyMascot size="lg" stack message={buddyMessage} animated className="max-w-xs" />
        </div>
      </div>
    </section>
  );
};
