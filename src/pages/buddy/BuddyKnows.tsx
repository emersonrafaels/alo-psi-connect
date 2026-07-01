import React from "react";
import { BuddyLayout } from "@/components/buddy/BuddyLayout";
import { BuddyMascot } from "@/components/buddy/BuddyMascot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLatestBuddyInsight } from "@/hooks/useBuddy";
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BuddyKnows() {
  const { data: insight, isLoading, regenerate } = useLatestBuddyInsight(30);
  const { toast } = useToast();

  const handleRegen = async () => {
    try { await regenerate.mutateAsync(); toast({ title: "Atualizei o que percebi sobre você" }); }
    catch (e: any) { toast({ title: "Erro", description: e?.message, variant: "destructive" }); }
  };

  const topics = insight?.map_topics ?? [];

  return (
    <BuddyLayout
      title="Como o Buddy te conhece"
      description="Aqui você vê o mapa do que o Buddy entende sobre você — construído a partir de tudo que compartilha na Rede Bem-Estar."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-primary/20">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Seu mapa de conhecimento</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Os temas que mais aparecem em suas interações.</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleRegen} disabled={regenerate.isPending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${regenerate.isPending ? "animate-spin" : ""}`} /> Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : topics.length ? (
              <KnowledgeMap topics={topics} />
            ) : (
              <div className="text-center text-muted-foreground py-12">
                Ainda não tenho dados suficientes. Registre algumas emoções ou preencha seu retrato para eu começar.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader><CardTitle>Fontes das percepções</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {insight?.sources ? (
              Object.entries(insight.sources).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border/50 pb-2 last:border-none">
                  <span className="capitalize text-muted-foreground">{labelSource(k)}</span>
                  <span className="font-semibold">{v as number}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Ainda sem dados.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <CardTitle>Fortalezas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insight?.strengths?.length ? insight.strengths.map((s, i) => (
              <div key={i}>
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">Sem dados ainda.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>Pontos de atenção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insight?.attention_points?.length ? insight.attention_points.map((a, i) => (
              <div key={i} className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
                {a.severity && <Badge variant={a.severity === "high" ? "destructive" : "secondary"}>{a.severity}</Badge>}
              </div>
            )) : <p className="text-sm text-muted-foreground">Sem dados ainda.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <BuddyMascot
              message={insight?.narrative ?? "Ainda estou aprendendo sobre você. Assim que houver mais dados, vou te contar o que percebi."}
              size="md"
            />
          </CardContent>
        </Card>
      </div>
    </BuddyLayout>
  );
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

function KnowledgeMap({ topics }: { topics: { id: string; label: string; weight: number }[] }) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 120;
  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="hsl(var(--primary) / 0.15)" strokeDasharray="4 4" />
        <circle cx={cx} cy={cy} r={40} fill="hsl(var(--primary) / 0.15)" />
        <text x={cx} y={cy + 4} textAnchor="middle" className="fill-primary text-sm font-semibold">Você</text>
        {topics.slice(0, 8).map((t, i, arr) => {
          const angle = (2 * Math.PI * i) / arr.length - Math.PI / 2;
          const r = radius * (0.6 + 0.4 * Math.min(1, Math.max(0, t.weight)));
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          return (
            <g key={t.id ?? i}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="hsl(var(--primary) / 0.3)" strokeWidth={1} />
              <circle cx={x} cy={y} r={22} fill="hsl(var(--primary) / 0.9)" />
              <text x={x} y={y + 40} textAnchor="middle" className="fill-foreground text-xs">{t.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
