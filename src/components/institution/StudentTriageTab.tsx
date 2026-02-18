import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, AlertCircle, Eye, Heart, HelpCircle, TrendingDown, TrendingUp, Minus, ChevronDown, ClipboardCheck, Activity, Brain, Zap, Moon, Info, Search, Download, Calendar } from 'lucide-react';
import { useStudentTriageData, useTriageRecords, useTriageActions, RiskLevel, StudentRiskData } from '@/hooks/useStudentTriage';
import { TriageDialog } from './TriageDialog';
import { useInstitutionNotes } from '@/hooks/useInstitutionNotes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/useDebounce';
import * as XLSX from 'xlsx';

interface StudentTriageTabProps {
  institutionId: string;
}

const riskConfig: Record<RiskLevel, { label: string; color: string; icon: typeof AlertTriangle; cardBg: string }> = {
  critical: { label: 'Crítico', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle, cardBg: 'border-red-200 dark:border-red-900/50' },
  alert: { label: 'Alerta', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertCircle, cardBg: 'border-orange-200 dark:border-orange-900/50' },
  attention: { label: 'Atenção', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Eye, cardBg: 'border-yellow-200 dark:border-yellow-900/50' },
  healthy: { label: 'Saudável', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: Heart, cardBg: 'border-green-200 dark:border-green-900/50' },
  no_data: { label: 'Sem Dados', color: 'bg-muted text-muted-foreground', icon: HelpCircle, cardBg: '' },
};

const riskLegend: Record<RiskLevel, string> = {
  critical: 'Humor médio ≤ 1.5, ansiedade ≥ 4.5 ou queda no humor > 40%',
  alert: 'Humor ≤ 2.5, ansiedade ≥ 3.5 ou energia ≤ 1.5',
  attention: 'Humor ≤ 3.0, ansiedade ≥ 3.0 ou qualidade de sono ≤ 2.0',
  healthy: 'Indicadores dentro da faixa esperada',
  no_data: 'Sem registros nos últimos 14 dias',
};

const priorityLabels: Record<string, string> = {
  urgent: '🔴 Urgente',
  high: '🟠 Alta',
  medium: '🟡 Média',
  low: '🟢 Baixa',
};

const actionLabels: Record<string, string> = {
  refer_professional: 'Encaminhar para profissional',
  schedule_talk: 'Agendar conversa',
  monitor: 'Monitorar',
  contact_family: 'Contato com família',
};

const riskOrder: RiskLevel[] = ['critical', 'alert', 'attention', 'healthy', 'no_data'];

function TrendIcon({ trend }: { trend: number | null }) {
  if (trend === null) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  if (trend <= -20) return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  if (trend >= 20) return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function StudentTriageTab({ institutionId }: StudentTriageTabProps) {
  const { data: students = [], isLoading } = useStudentTriageData(institutionId);
  const { notes: institutionNotes } = useInstitutionNotes(institutionId);
  const { data: triageRecords = [] } = useTriageRecords(institutionId);
  const { createTriage, updateTriageStatus } = useTriageActions(institutionId);

  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [triageFilter, setTriageFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentRiskData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [triagedOpen, setTriagedOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const counts = useMemo(() => {
    const c: Record<RiskLevel, number> = { critical: 0, alert: 0, attention: 0, healthy: 0, no_data: 0 };
    students.forEach(s => c[s.riskLevel]++);
    return c;
  }, [students]);

  const totalStudents = students.length;

  const filteredStudents = useMemo(() => {
    let filtered = [...students];

    if (riskFilter !== 'all') {
      filtered = filtered.filter(s => s.riskLevel === riskFilter);
    }

    if (triageFilter === 'not_triaged') {
      filtered = filtered.filter(s => !s.lastTriageStatus || s.lastTriageStatus === 'pending');
    } else if (triageFilter === 'triaged') {
      filtered = filtered.filter(s => s.lastTriageStatus && s.lastTriageStatus !== 'pending');
    }

    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      filtered = filtered.filter(s => s.studentName.toLowerCase().includes(term));
    }

    filtered.sort((a, b) => riskOrder.indexOf(a.riskLevel) - riskOrder.indexOf(b.riskLevel));
    return filtered;
  }, [students, riskFilter, triageFilter, debouncedSearch]);

  const triagedStudents = useMemo(() => {
    return triageRecords.filter(t => t.status !== 'pending');
  }, [triageRecords]);

  const patientNameMap = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach(s => map.set(s.patientId, s.studentName));
    return map;
  }, [students]);

  const handleTriage = async (data: any) => {
    await createTriage.mutateAsync(data);
  };

  const handleExport = useCallback(() => {
    const data = filteredStudents.map(s => ({
      'Nome': s.studentName,
      'Nível de Risco': riskConfig[s.riskLevel].label,
      'Humor Médio': s.avgMood ?? '—',
      'Ansiedade Média': s.avgAnxiety ?? '—',
      'Energia Média': s.avgEnergy ?? '—',
      'Sono Médio': s.avgSleep ?? '—',
      'Tendência Humor (%)': s.moodTrend ?? '—',
      'Registros': s.entryCount,
      'Triado': s.lastTriageStatus && s.lastTriageStatus !== 'pending' ? 'Sim' : 'Não',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Triagem');
    XLSX.writeFile(wb, `triagem-alunos-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  }, [filteredStudents]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Carregando dados de triagem...</p>
        </CardContent>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Nenhum aluno matriculado nesta instituição.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {riskOrder.map(level => {
            const config = riskConfig[level];
            const Icon = config.icon;
            const pct = totalStudents > 0 ? (counts[level] / totalStudents) * 100 : 0;
            return (
              <Card
                key={level}
                className={`cursor-pointer transition-all hover:shadow-md ${config.cardBg} ${riskFilter === level ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setRiskFilter(riskFilter === level ? 'all' : level)}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{counts[level]}</p>
                      <p className="text-[11px] text-muted-foreground">{config.label}</p>
                    </div>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contexto Institucional */}
        {(() => {
          const today = new Date().toISOString().split('T')[0];
          const activeTriageNotes = institutionNotes.filter(n => {
            if (!n.start_date && !n.end_date) return n.is_pinned;
            if (n.start_date && n.end_date) return n.start_date <= today && n.end_date >= today;
            if (n.start_date) return n.start_date <= today;
            if (n.end_date) return n.end_date >= today;
            return false;
          });
          if (activeTriageNotes.length === 0) return null;
          return (
            <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
              <Calendar className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                <span className="font-medium">Contexto institucional:</span>{' '}
                {activeTriageNotes.map(n => n.title).join(', ')}
                {' — '}Considere estes eventos ao avaliar os alunos.
              </AlertDescription>
            </Alert>
          );
        })()}

        {/* Risk legend */}
        <Collapsible open={legendOpen} onOpenChange={setLegendOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Info className="h-4 w-4" />
              Como funciona a classificação de risco?
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${legendOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2">
              <CardContent className="p-4 space-y-2 text-sm">
                {riskOrder.map(level => {
                  const config = riskConfig[level];
                  const Icon = config.icon;
                  return (
                    <div key={level} className="flex items-start gap-2">
                      <Badge className={`shrink-0 mt-0.5 ${config.color}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      <span className="text-muted-foreground">{riskLegend[level]}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Filters + search + export */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>

          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Nível de risco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
              <SelectItem value="alert">Alerta</SelectItem>
              <SelectItem value="attention">Atenção</SelectItem>
              <SelectItem value="healthy">Saudável</SelectItem>
              <SelectItem value="no_data">Sem Dados</SelectItem>
            </SelectContent>
          </Select>

          <Select value={triageFilter} onValueChange={setTriageFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status de triagem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="not_triaged">Não triados</SelectItem>
              <SelectItem value="triaged">Triados</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleExport} className="ml-auto">
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>

        {/* Student list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Alunos ({filteredStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredStudents.map(student => {
                const config = riskConfig[student.riskLevel];
                return (
                  <div key={student.patientId} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Badge className={`shrink-0 ${config.color}`}>{config.label}</Badge>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{student.studentName}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                Humor: {student.avgMood ?? '—'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Média de humor nos últimos 14 dias (1-5)</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1">
                                <Brain className="h-3 w-3" />
                                Ansiedade: {student.avgAnxiety ?? '—'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Média de ansiedade nos últimos 14 dias (1-5)</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                Energia: {student.avgEnergy ?? '—'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Média de energia nos últimos 14 dias (1-5)</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1">
                                <Moon className="h-3 w-3" />
                                Sono: {student.avgSleep ?? '—'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Média de qualidade do sono nos últimos 14 dias (1-5)</TooltipContent>
                          </Tooltip>
                          <TrendIcon trend={student.moodTrend} />
                          <span className="text-[10px]">{student.entryCount} registros</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {student.lastTriageStatus && student.lastTriageStatus !== 'pending' && (
                        <Badge variant="outline" className="text-[10px]">Triado</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedStudent(student);
                          setDialogOpen(true);
                        }}
                      >
                        Triar
                      </Button>
                    </div>
                  </div>
                );
              })}
              {filteredStudents.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Nenhum aluno encontrado com os filtros selecionados.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Triaged students (collapsible) */}
        {triagedStudents.length > 0 && (
          <Collapsible open={triagedOpen} onOpenChange={setTriagedOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4" />
                      Histórico de Triagens ({triagedStudents.length})
                    </CardTitle>
                    <ChevronDown className={`h-4 w-4 transition-transform ${triagedOpen ? 'rotate-180' : ''}`} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {triagedStudents.map(t => (
                      <div key={t.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 text-sm">
                        <div className="space-y-1">
                          <p className="font-medium">{patientNameMap.get(t.patient_id) || 'Aluno'}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>{format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                            <span>•</span>
                            <span>{priorityLabels[t.priority] || t.priority}</span>
                            {t.recommended_action && (
                              <>
                                <span>•</span>
                                <span>{actionLabels[t.recommended_action] || t.recommended_action}</span>
                              </>
                            )}
                          </div>
                          {t.notes && <p className="text-xs text-muted-foreground mt-1">"{t.notes}"</p>}
                        </div>
                        <div className="flex gap-1">
                          {t.status !== 'resolved' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7"
                              onClick={() => updateTriageStatus.mutate({
                                triageId: t.id,
                                status: 'resolved',
                                resolvedAt: new Date().toISOString(),
                              })}
                            >
                              Resolver
                            </Button>
                          )}
                          <Badge variant={t.status === 'resolved' ? 'secondary' : 'default'} className="text-[10px]">
                            {t.status === 'resolved' ? 'Resolvido' : t.status === 'in_progress' ? 'Em andamento' : 'Triado'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        <TriageDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          student={selectedStudent}
          onSubmit={handleTriage}
        />
      </div>
    </TooltipProvider>
  );
}
