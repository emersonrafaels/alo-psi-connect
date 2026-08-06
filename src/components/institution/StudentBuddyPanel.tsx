import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Brain,
  ClipboardList,
  Clock,
  Info,
  Lightbulb,
  Search,
  ShieldCheck,
  Sparkles,
  StickyNote,
  TriangleAlert,
} from 'lucide-react';
import {
  useAllowedBuddyStudents,
  useStudentBuddyData,
  type AllowedBuddyStudent,
  type BuddyAttentionLevel,
} from '@/hooks/useInstitutionBuddyAccess';
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

const attentionMeta: Record<BuddyAttentionLevel, { label: string; dot: string }> = {
  alto: { label: 'Alta atenção', dot: 'bg-destructive' },
  moderado: { label: 'Atenção moderada', dot: 'bg-amber-500' },
  baixo: { label: 'Estável', dot: 'bg-emerald-500' },
  'sem-dados': { label: 'Sem dados', dot: 'bg-muted-foreground/40' },
};

const goToTab = (tab: string) => {
  window.dispatchEvent(new CustomEvent('institution:navigate-tab', { detail: { tab } }));
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
  const [term, setTerm] = useState('');

  useEffect(() => {
    if (!selected && students.length > 0) setSelected(students[0].patient_id);
  }, [students, selected]);

  const { data, isLoading: loadingData } = useStudentBuddyData(selected);

  const displayName = (patientId: string) => {
    const idx = students.findIndex((s) => s.patient_id === patientId);
    const student = students[idx];
    return isAnonymized ? anonymizeStudentName(Math.max(idx, 0)) : student?.nome ?? 'Aluno';
  };

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return students;
    return students.filter((s, idx) => {
      const name = isAnonymized ? anonymizeStudentName(idx) : s.nome ?? '';
      return name.toLowerCase().includes(t);
    });
  }, [students, term, isAnonymized]);

  const attentionCount = students.filter((s) => s.attention === 'alto').length;
  const selectedStudent: AllowedBuddyStudent | undefined = students.find(
    (s) => s.patient_id === selected
  );

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
  const attentionPoints: any[] = (insight?.attention_points as any[]) ?? [];
  const recommendations: any[] = (insight?.recommendations as any[]) ?? [];
  const nextActions = [...attentionPoints.slice(0, 2), ...recommendations.slice(0, 2)].slice(0, 3);

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Visualização somente leitura, liberada aluno por aluno. Use estas informações para orientar o
          acolhimento — nunca para avaliação acadêmica.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Lista de alunos */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Alunos liberados
            </CardTitle>
            <CardDescription>
              {students.length} aluno(s) · {attentionCount} em alta atenção
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno..."
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum aluno encontrado.
              </p>
            ) : (
              <div className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
                {filtered.map((s) => {
                  const meta = attentionMeta[s.attention];
                  const isActive = s.patient_id === selected;
                  const name = displayName(s.patient_id);
                  return (
                    <button
                      key={s.patient_id}
                      type="button"
                      onClick={() => setSelected(s.patient_id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary/10 border border-primary/30 shadow-sm'
                          : 'hover:bg-muted/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${meta.dot}`} />
                        <span className="text-sm font-medium truncate flex-1" title={name}>
                          {name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 pl-5 flex-wrap">
                        <span className="text-[11px] text-muted-foreground">{meta.label}</span>
                        {s.is_stale && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            Sem dados recentes
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {loadingData ? (
            <Skeleton className="h-64 w-full" />
          ) : !insight && !portrait ? (
            <Card>
              <CardContent className="py-12 text-center space-y-2">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">
                  Este aluno ainda não possui dados do Buddy gerados.
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  O Buddy é construído a partir dos registros do próprio aluno: diário emocional,
                  escalas, práticas e participação em encontros. Assim que houver registros
                  suficientes, o retrato e os insights aparecem aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Ações acionáveis */}
              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    O que fazer agora
                  </CardTitle>
                  <CardDescription>
                    Sugestões de acolhimento com base no que o Buddy observou.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {nextActions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum ponto crítico no período. Mantenha o acompanhamento de rotina.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {nextActions.map((a, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                          <span>
                            <span className="font-medium">{a.title}</span>
                            {a.description && (
                              <span className="text-muted-foreground"> — {a.description}</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => goToTab('notes')}>
                      <StickyNote className="h-3.5 w-3.5 mr-1.5" />
                      Registrar nota de acompanhamento
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => goToTab('triage')}>
                      <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                      Abrir triagem
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Como o Buddy entende {selected ? displayName(selected) : 'este aluno'}
                    </CardTitle>
                    <CardDescription className="space-y-0.5">
                      {insight?.period_start && insight?.period_end && (
                        <span className="block">
                          Período analisado:{' '}
                          {new Date(insight.period_start).toLocaleDateString('pt-BR')} a{' '}
                          {new Date(insight.period_end).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {selectedStudent?.last_insight_at && (
                        <span className="block">
                          Última atualização do Buddy:{' '}
                          {new Date(selectedStudent.last_insight_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {selectedStudent?.granted_at && (
                        <span className="block">
                          Acesso liberado em{' '}
                          {new Date(selectedStudent.granted_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {insight?.narrative && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {insight.narrative}
                      </p>
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

                    {attentionPoints.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <TriangleAlert className="h-4 w-4 text-amber-500" />
                          Pontos de atenção
                        </h4>
                        {attentionPoints.map((p, i) => {
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

                    {recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-primary" />
                          O que o Buddy está priorizando
                        </h4>
                        {recommendations.map((r, i) => (
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
                      <ScoreBar
                        label="Estabilidade emocional"
                        value={insight?.emotional_stability ?? null}
                      />
                      <ScoreBar label="Qualidade do sono" value={insight?.sleep_quality ?? null} />
                      <ScoreBar
                        label="Consistência de hábitos"
                        value={insight?.habit_consistency ?? null}
                      />
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
