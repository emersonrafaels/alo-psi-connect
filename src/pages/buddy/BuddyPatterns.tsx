import React, { useState } from "react";
import { BuddyLayout } from "@/components/buddy/BuddyLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLatestBuddyInsight } from "@/hooks/useBuddy";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PERIODS = [7, 15, 30] as const;

export default function BuddyPatterns() {
  const [period, setPeriod] = useState<7 | 15 | 30>(30);
  const { data: insight, isLoading, regenerate } = useLatestBuddyInsight(period);
  const { toast } = useToast();

  const metrics = [
    { label: "Bem-estar geral", value: insight?.wellbeing_score, unit: "/10" },
    { label: "Estabilidade emocional", value: insight?.emotional_stability, unit: "/10" },
    { label: "Qualidade do sono", value: insight?.sleep_quality, unit: "/10" },
    { label: "Consistência de hábitos", value: insight?.habit_consistency, unit: "/10" },
  ];

  return (
    <BuddyLayout
      title="Padrões que o Buddy percebeu"
      description="Um panorama dos seus hábitos, emoções e bem-estar ao longo do período escolhido."
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <Button key={p} size="sm" variant={period === p ? "default" : "outline"} onClick={() => setPeriod(p)}>
              Últimos {p} dias
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => regenerate.mutate(undefined, {
          onSuccess: () => toast({ title: "Padrões atualizados" }),
          onError: (e: any) => toast({ title: "Erro", description: e?.message, variant: "destructive" }),
        })} disabled={regenerate.isPending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${regenerate.isPending ? "animate-spin" : ""}`} /> Recalcular
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="border-primary/20">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
              {isLoading ? <Skeleton className="h-10 w-24" /> : (
                <p className="text-3xl font-bold text-primary">
                  {m.value !== null && m.value !== undefined ? Number(m.value).toFixed(1) : "—"}
                  <span className="text-base text-muted-foreground ml-1">{m.unit}</span>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>O que te ajuda</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(insight?.strengths ?? []).slice(0, 4).map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </div>
            ))}
            {!insight && <p className="text-muted-foreground">Sem dados ainda.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>O que te drena</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(insight?.attention_points ?? []).map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
              </div>
            ))}
            {!insight && <p className="text-muted-foreground">Sem dados ainda.</p>}
          </CardContent>
        </Card>
      </div>
    </BuddyLayout>
  );
}
