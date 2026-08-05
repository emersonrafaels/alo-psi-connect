import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Info, Lightbulb, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';
import { useAllowedBuddyStudents, useStudentBuddyData } from '@/hooks/useInstitutionBuddyAccess';
import { useAnonymizationConfig, anonymizeStudentName } from '@/hooks/useAnonymizationConfig';

interface Props {
  institutionId: string;
}

const severityLabel = (s?: string) => {
  switch ((s ?? '').toLowerCase()) {
    case 'high':
    case 'alto':
      return { label: 'Alta atenção', variant: 'destructive' as const };
    case 'medium':
    case 'medio':
    case 'médio':
      return { label: 'Atenção moderada', variant: 'default' as const };
    default:
      return { label: 'Baixa atenção', variant: 'secondary' as const };
  }
};

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value == null ? 'N/D' : Math.round(value)}</span>
      </div>
      <Progress value={value ?? 0} className="h-2" />
    </div>
  );
}

export function StudentBuddyPanel({ institutionId }: Props) {
  const { students, canView, isLoading } = useAllowedBuddyStudents(institutionId);
  const { isAnonymized } = useAnonymizationConfig(institutionId);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!selected && students.length > 0) setSelected(students[0].patient_id);
  }, [students, selected]);

  const { data, isLoading: loadingData } = useStudentBuddyData(selected);

  const displayName = (patientId: string) => {
    const idx = students.findIndex((s) => s.patient_id === patientId);
    const student = students[idx];
    return isAnonymized ? anonymizeStudentName(Math.max(idx, 0)) : student?.nome ?? 'Aluno';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            Você ainda não tem liberação para visualizar o Buddy dos alunos.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Solicite a liberação à equipe da Rede Bem-Estar.
          </p>
        </CardContent>
      </Card>
    );
  }

  const insight = data?.insight;
  const portrait = data?.portrait;

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Visualização somente leitura, liberada aluno por aluno. Use estas informações para orientar o
          acolhimento — nunca para avaliação acadêmica.
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-3 flex-wrap">
        <Brain className="h-5 w-5 text-primary shrink-0" />
        <Select value={selected ?? ''} onValueChange={setSelected}>
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Selecione um aluno..." />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.patient_id} value={s.patient_id}>
                {displayName(s.patient_id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{students.length} aluno(s) liberado(s)</Badge>
      </div>

      {loadingData ? (
        <Skeleton className="h-64 w-full" />
      ) : !insight && !portrait ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Este aluno ainda não possui dados do Buddy gerados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Como o Buddy entende {selected ? displayName(selected) : 'este aluno'}
              </CardTitle>
              {insight?.period_start && insight?.period_end && (
                <CardDescription>
                  Período analisado: {new Date(insight.period_start).toLocaleDateString('pt-BR')} a{' '}
                  {new Date(insight.period_end).toLocaleDateString('pt-BR')}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              {insight?.narrative && (
                <p className="text-sm leading-relaxed text-muted-foreground">{insight.narrative}</p>
              )}

              {(insight?.strengths ?? []).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Forças percebidas</h4>
                  {(insight!.strengths as any[]).map((s, i) => (
                    <div key={i} className="p-3 rounded-md bg-muted/50">
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {(insight?.attention_points ?? []).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <TriangleAlert className="h-4 w-4 text-amber-500" />
                    Pontos de atenção
                  </h4>
                  {(insight!.attention_points as any[]).map((p, i) => {
                    const sev = severityLabel(p.severity);
                    return (
                      <div key={i} className="p-3 rounded-md border">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{p.title}</p>
                          <Badge variant={sev.variant} className="text-[10px] shrink-0">
                            {sev.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {(insight?.recommendations ?? []).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    O que o Buddy está priorizando
                  </h4>
                  {(insight!.recommendations as any[]).map((r, i) => (
                    <div key={i} className="p-3 rounded-md bg-primary/5">
                      <p className="text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Indicadores do período</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScoreBar label="Bem-estar geral" value={insight?.wellbeing_score ?? null} />
                <ScoreBar label="Estabilidade emocional" value={insight?.emotional_stability ?? null} />
                <ScoreBar label="Qualidade do sono" value={insight?.sleep_quality ?? null} />
                <ScoreBar label="Consistência de hábitos" value={insight?.habit_consistency ?? null} />
              </CardContent>
            </Card>

            {portrait && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Retrato do aluno</CardTitle>
                  <CardDescription>Informações compartilhadas pelo próprio aluno.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {portrait.biggest_challenge && (
                    <div>
                      <p className="text-xs text-muted-foreground">Maior desafio atual</p>
                      <p>{portrait.biggest_challenge}</p>
                    </div>
                  )}
                  {portrait.support_people && (
                    <div>
                      <p className="text-xs text-muted-foreground">Rede de apoio</p>
                      <p>{portrait.support_people}</p>
                    </div>
                  )}
                  {(portrait.self_care_rituals ?? []).length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Rituais de autocuidado</p>
                      <div className="flex flex-wrap gap-1.5">
                        {portrait.self_care_rituals.map((r: string) => (
                          <Badge key={r} variant="outline" className="text-[10px]">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(portrait.hobbies ?? []).length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Interesses</p>
                      <div className="flex flex-wrap gap-1.5">
                        {portrait.hobbies.map((h: string) => (
                          <Badge key={h} variant="secondary" className="text-[10px]">
                            {h}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
