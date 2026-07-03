import React, { useState } from "react";
import { BuddyLayout } from "@/components/buddy/BuddyLayout";
import { BuddyMascot } from "@/components/buddy/BuddyMascot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLatestBuddyInsight } from "@/hooks/useBuddy";
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BookHeart,
  Gauge,
  Brain,
  Sparkles,
  Users,
  Activity,
  Quote,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BuddyKnows() {
  const { data: insight, isLoading, regenerate } = useLatestBuddyInsight(30);
  const { toast } = useToast();

  const handleRegen = async () => {
    try {
      await regenerate.mutateAsync();
      toast({ title: "Atualizei o que percebi sobre você" });
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message, variant: "destructive" });
    }
  };

  const topics = insight?.map_topics ?? [];

  const metrics = [
    { label: "Bem-estar", value: insight?.wellbeing_score, icon: Sparkles },
    { label: "Estabilidade", value: insight?.emotional_stability, icon: Activity },
    { label: "Sono", value: insight?.sleep_quality, icon: Brain },
    { label: "Consistência", value: insight?.habit_consistency, icon: Gauge },
  ];

  return (
    <BuddyLayout
      title="Como o Buddy te conhece"
      description="Aqui você vê o mapa do que o Buddy entende sobre você — construído a partir de tudo que compartilha na Rede Bem-Estar."
    >
      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {metrics.map((m) => {
          const val = typeof m.value === "number" ? Math.round(m.value) : null;
          return (
            <Card
              key={m.label}
              className="relative overflow-hidden border-primary/10 bg-gradient-to-br from-card to-primary/5"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {m.label}
                  </span>
                  <m.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold text-foreground">
                    {val ?? "—"}
                  </span>
                  {val !== null && (
                    <span className="text-xs text-muted-foreground mb-1">/100</span>
                  )}
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
                    style={{ width: `${val ?? 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-primary/20 overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Sparkles className="h-5 w-5 text-primary shrink-0" />
                <span className="truncate">Seu mapa de conhecimento</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Os temas que mais aparecem em suas interações.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRegen}
              disabled={regenerate.isPending}
              className="rounded-full self-start sm:self-auto"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${regenerate.isPending ? "animate-spin" : ""}`}
              />{" "}
              Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-80" />
            ) : topics.length ? (
              <KnowledgeMap topics={topics} />
            ) : (
              <div className="text-center text-muted-foreground py-16">
                Ainda não tenho dados suficientes. Registre algumas emoções ou preencha
                seu retrato para eu começar.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-card to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookHeart className="h-5 w-5 text-primary" />
              Fontes das percepções
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SourcesList sources={insight?.sources ?? null} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="relative overflow-hidden border-l-4 border-l-emerald-500">
          <CardHeader className="flex-row items-center gap-2">
            <div className="rounded-full bg-emerald-500/10 p-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle>Fortalezas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insight?.strengths?.length ? (
              insight.strengths.map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3 hover:bg-emerald-500/10 transition-colors"
                >
                  <p className="font-medium text-sm text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-amber-500">
          <CardHeader className="flex-row items-center gap-2">
            <div className="rounded-full bg-amber-500/10 p-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle>Pontos de atenção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insight?.attention_points?.length ? (
              insight.attention_points.map((a, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3 flex items-start justify-between gap-3 hover:bg-amber-500/10 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                  </div>
                  {a.severity && (
                    <Badge variant={severityVariant(a.severity)} className="shrink-0">
                      {labelSeverity(a.severity)}
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="border-primary/20 overflow-hidden bg-gradient-to-br from-primary/5 via-card to-accent/10">
          <CardContent className="p-6 relative">
            <Quote className="absolute top-4 right-4 h-16 w-16 text-primary/10" />
            <BuddyMascot
              message={
                insight?.narrative ??
                "Ainda estou aprendendo sobre você. Assim que houver mais dados, vou te contar o que percebi."
              }
              size="md"
            />
          </CardContent>
        </Card>
      </div>
    </BuddyLayout>
  );
}

function labelSeverity(s: string) {
  const map: Record<string, string> = {
    high: "Alta",
    medium: "Média",
    low: "Baixa",
    alta: "Alta",
    media: "Média",
    média: "Média",
    baixa: "Baixa",
  };
  return map[s.toLowerCase()] ?? s;
}

function severityVariant(s: string): "destructive" | "secondary" | "outline" {
  const key = s.toLowerCase();
  if (key === "high" || key === "alta") return "destructive";
  if (key === "medium" || key === "media" || key === "média") return "secondary";
  return "outline";
}

function labelSource(k: string) {
  const map: Record<string, string> = {
    diario: "Diário emocional",
    escalas: "Escalas",
    iseu: "ISEU",
    praticas: "Práticas",
    encontros: "Encontros",
    analises: "Análises da IA",
  };
  return map[k] ?? k;
}

function sourceIcon(k: string) {
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
    diario: BookHeart,
    escalas: Gauge,
    iseu: Brain,
    praticas: Sparkles,
    encontros: Users,
    analises: Activity,
  };
  return map[k] ?? BookHeart;
}

function SourcesList({ sources }: { sources: Record<string, number> | null }) {
  if (!sources || !Object.keys(sources).length) {
    return <p className="text-sm text-muted-foreground">Ainda sem dados.</p>;
  }
  const entries = Object.entries(sources);
  const total = entries.reduce((sum, [, v]) => sum + (Number(v) || 0), 0) || 1;
  return (
    <div className="space-y-3">
      {entries.map(([k, v]) => {
        const Icon = sourceIcon(k);
        const val = Number(v) || 0;
        const pct = Math.round((val / total) * 100);
        return (
          <div key={k}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm text-foreground">{labelSource(k)}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold text-foreground">{val}</span>
                <span className="text-xs text-muted-foreground">({pct}%)</span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/50 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KnowledgeMap({ topics }: { topics: { id: string; label: string; weight: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  const baseRadius = 150;
  const visible = topics.slice(0, 8);

  return (
    <div className="flex justify-center py-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="max-w-full h-auto"
      >
        <defs>
          <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
          </radialGradient>
          <radialGradient id="nodeGrad" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Anéis concêntricos */}
        {[0.4, 0.7, 1].map((r, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={baseRadius * r}
            fill="none"
            stroke="hsl(var(--primary) / 0.12)"
            strokeDasharray="3 6"
          />
        ))}

        {/* Halo pulsante */}
        <circle
          cx={cx}
          cy={cy}
          r={54}
          fill="hsl(var(--primary) / 0.15)"
          className="animate-pulse"
        />
        <circle
          cx={cx}
          cy={cy}
          r={42}
          fill="url(#coreGrad)"
          filter="url(#glow)"
        />
        <text
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          className="fill-primary-foreground text-sm font-bold"
          style={{ fill: "hsl(var(--primary-foreground))" }}
        >
          Você
        </text>

        {/* Nós orbitais */}
        {visible.map((t, i) => {
          const angle = (2 * Math.PI * i) / visible.length - Math.PI / 2;
          const weight = Math.min(1, Math.max(0.2, t.weight || 0.5));
          const r = baseRadius * (0.55 + 0.45 * weight);
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          const nodeR = 16 + weight * 14;
          const isHover = hovered === i;

          return (
            <g
              key={t.id ?? i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all"
              style={{ transformOrigin: `${x}px ${y}px` }}
            >
              <line
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="hsl(var(--primary))"
                strokeOpacity={isHover ? 0.7 : 0.25 + weight * 0.3}
                strokeWidth={isHover ? 2 : 1 + weight}
              />
              <circle
                cx={x}
                cy={y}
                r={nodeR + 6}
                fill="hsl(var(--primary) / 0.15)"
                opacity={isHover ? 1 : 0}
                className="transition-opacity"
              />
              <circle
                cx={x}
                cy={y}
                r={nodeR}
                fill="url(#nodeGrad)"
                filter={isHover ? "url(#glow)" : undefined}
                className="transition-all"
              />
              {/* Label chip */}
              <g transform={`translate(${x}, ${y + nodeR + 18})`}>
                <rect
                  x={-getTextWidth(t.label) / 2 - 8}
                  y={-11}
                  width={getTextWidth(t.label) + 16}
                  height={22}
                  rx={11}
                  fill="hsl(var(--card))"
                  stroke="hsl(var(--primary) / 0.2)"
                />
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  className="fill-foreground text-[11px] font-medium"
                  style={{ fill: "hsl(var(--foreground))" }}
                >
                  {t.label}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function getTextWidth(text: string) {
  // aproximação: ~6.5px por caractere para fonte 11px
  return Math.max(40, text.length * 6.5);
}
