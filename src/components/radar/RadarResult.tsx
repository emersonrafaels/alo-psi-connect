import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadarChart } from './RadarChart';
import { MATURITY_DIMENSIONS, PAINS } from '@/data/radarCatalog';
import { Sparkles, Target, TrendingUp, ClipboardList } from 'lucide-react';

interface Props {
  diagnostic: any;
}

export function RadarResult({ diagnostic }: Props) {
  const overall = Number(diagnostic.overall_score ?? 0);
  const strategic = diagnostic.strategic_reading ?? null;
  const recs: Array<{ title: string; description: string; horizon?: string }> = diagnostic.recommendations ?? [];
  const pains = (diagnostic.pains ?? []) as string[];

  return (
    <div className="space-y-6">
      {/* Headline + score */}
      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <Badge variant="outline" className="mb-3 border-primary/40 text-primary">
                <Sparkles className="h-3 w-3 mr-1" /> Diagnóstico Rede Bem-Estar
              </Badge>
              <h2 className="text-2xl md:text-3xl font-serif font-medium leading-tight text-foreground">
                {diagnostic.headline || 'Sua instituição está construindo um caminho consistente de cuidado.'}
              </h2>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{overall}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Maturidade / 100</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Radar de maturidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadarChart maturity={diagnostic.maturity ?? {}} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Dimensões
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MATURITY_DIMENSIONS.map(d => {
              const v = Number((diagnostic.maturity ?? {})[d.id] ?? 0);
              return (
                <div key={d.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{d.name}</span>
                    <span className="text-muted-foreground">{v}/100</span>
                  </div>
                  <Progress value={v} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {strategic && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leitura estratégica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            {typeof strategic === 'string' ? (
              <p className="text-muted-foreground">{strategic}</p>
            ) : (
              <>
                {strategic.summary && <p className="text-foreground">{strategic.summary}</p>}
                {Array.isArray(strategic.insights) && (
                  <ul className="space-y-2">
                    {strategic.insights.map((i: any, idx: number) => (
                      <li key={idx} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="h-2 w-2 mt-1.5 rounded-full bg-primary flex-shrink-0" />
                        <div>
                          {i.title && <div className="font-medium">{i.title}</div>}
                          <div className="text-muted-foreground">{i.description ?? i}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {recs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Recomendações iniciais
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {recs.map((r, i) => (
              <div key={i} className="p-4 rounded-lg border bg-gradient-to-br from-background to-muted/30">
                <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">
                  Passo {i + 1}{r.horizon ? ` · ${r.horizon}` : ''}
                </div>
                <div className="font-semibold mb-1">{r.title}</div>
                <div className="text-sm text-muted-foreground">{r.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {pains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Desafios priorizados</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {pains.map(p => {
              const pain = PAINS.find(x => x.id === p);
              const urgency = (diagnostic.priorities ?? {})[p];
              return (
                <Badge key={p} variant="secondary" className="text-sm py-1.5 px-3">
                  {pain?.title ?? p}
                  {urgency && <span className="ml-2 text-xs opacity-70">· {urgency}</span>}
                </Badge>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
