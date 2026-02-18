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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AlertTriangle, AlertCircle, Eye, Heart, HelpCircle, TrendingDown, TrendingUp, Minus, ChevronDown, ClipboardCheck, Activity, Brain, Zap, Moon, Info, Search, Download, Calendar, Clock, CheckCircle2, RotateCcw, Play } from 'lucide-react';
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

const riskConfig: Record<RiskLevel, { label: string; color: string; icon: typeof AlertTriangle; cardBg: string; progressColor: string }> = {
  critical: { label: 'Crítico', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle, cardBg: 'border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20', progressColor: '[&>div]:bg-red-500' },
  alert: { label: 'Alerta', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertCircle, cardBg: 'border-orange-200 dark:border-orange-900/50 bg-orange-50/40 dark:bg-orange-950/20', progressColor: '[&>div]:bg-orange-500' },
  attention: { label: 'Atenção', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Eye, cardBg: 'border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/30 dark:bg-yellow-950/20', progressColor: '[&>div]:bg-yellow-500' },
  healthy: { label: 'Saudável', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: Heart, cardBg: 'border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/20', progressColor: '[&>div]:bg-green-500' },
  no_data: { label: 'Sem Dados', color: 'bg-muted text-muted-foreground', icon: HelpCircle, cardBg: 'bg-muted/30', progressColor: '[&>div]:bg-muted-foreground/40' },
};

const riskLegend: Record<RiskLevel, string> = {
  critical: 'Humor médio ≤ 1.5, ansiedade ≥ 4.5 ou queda no humor > 40%',
  alert: 'Humor ≤ 2.5, ansiedade ≥ 3.5 ou energia ≤ 1.5',
  attention: 'Humor ≤ 3.0, ansiedade ≥ 3.0 ou qualidade de sono ≤ 2.0',
  healthy: 'Indicadores dentro da faixa esperada',
  no_data: 'Sem registros nos últimos 14 dias',
};

const riskTooltips: Record<RiskLevel, { title: string; description: string }> = {
  critical: {
    title: '🔴 Nível Crítico',
    description: 'Alunos com humor muito baixo (≤1.5), ansiedade muito alta (≥4.5) ou queda brusca no humor (>40%). Necessitam atenção imediata.',
  },
  alert: {
    title: '🟠 Nível Alerta',
    description: 'Alunos com humor baixo (≤2.5), ansiedade elevada (≥3.5) ou energia muito baixa. Recomenda-se acompanhamento.',
  },
  attention: {
    title: '🟡 Nível Atenção',
    description: 'Alunos com indicadores moderadamente preocupantes. Vale monitorar de perto.',
  },
  healthy: {
    title: '🟢 Nível Saudável',
    description: 'Alunos com todos os indicadores dentro da faixa esperada.',
  },
  no_data: {
    title: '⚪ Sem Dados',
    description: 'Alunos que não registraram diários emocionais nos últimos 14 dias.',
  },
};

const metricTooltips = {
  mood: { title: '😊 Humor', description: 'Como o aluno avaliou seu humor (1=muito mal, 5=muito bem). Abaixo de 3 merece atenção.' },
  anxiety: { title: '😰 Ansiedade', description: 'Nível de ansiedade reportado (1=tranquilo, 5=muito ansioso). Acima de 3.5 é preocupante.' },
  energy: { title: '⚡ Energia', description: 'Nível de energia do aluno (1=sem energia, 5=muita energia). Valores baixos podem indicar cansaço.' },
  sleep: { title: '🌙 Sono', description: 'Qualidade do sono (1=péssimo, 5=ótimo). Sono ruim afeta humor e concentração.' },
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

// Elegant tooltip component
function MetricTooltip({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="w-[280px] p-0 border-border/60 shadow-lg"
      >
        <div className="px-3 py-2 border-b border-border/40 bg-muted/50 rounded-t-md">
          <p className="font-semibold text-xs">{title}</p>
        </div>
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Small metric bar (1-5 scale)
function MetricBar({ value, invert }: { value: number | null; invert?: boolean }) {
  if (value === null) return null;
  const pct = ((value - 1) / 4) * 100;
  const effectivePct = invert ? 100 - pct : pct;
  const color = effectivePct >= 60 ? 'bg-green-500' : effectivePct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function TrendIcon({ trend }: { trend: number | null }) {
  if (trend === null) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  if (trend <= -20) return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  if (trend >= 20) return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function TrendBadge({ trend }: { trend: number | null }) {
  if (trend === null) return null;
  const isNegative = trend < 0;
  const isSignificant = Math.abs(trend) >= 20;
  if (!isSignificant) return (
    <span className="text-[10px] text-muted-foreground">{trend > 0 ? '+' : ''}{trend}%</span>
  );
  return (
    <MetricTooltip title="📈 Tendência" description="Variação percentual do humor entre a primeira e segunda semana. Vermelho=piora, verde=melhora.">
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium cursor-help ${
        isNegative
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      }`}>
        {isNegative ? <TrendingDown className="h-2.5 w-2.5" /> : <TrendingUp className="h-2.5 w-2.5" />}
        {trend > 0 ? '+' : ''}{trend}%
      </span>
    </MetricTooltip>
  );
}

function MoodSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const width = 100;
  const height = 32;
  const max = 5;
  const min = 1;
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ');
  const lastVal = data[data.length - 1];
  const color = lastVal <= 2 ? 'var(--color-destructive, #ef4444)' : lastVal <= 3 ? '#eab308' : '#22c55e';

  return (
    <MetricTooltip title="📊 Evolução do Humor" description="Mini-gráfico mostrando a evolução do humor nos últimos 14 dias. Verde=bom, amarelo=moderado, vermelho=preocupante.">
      <svg width={width} height={height} className="shrink-0 cursor-help">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </MetricTooltip>
  );
}

function FollowUpIndicator({ date }: { date: string }) {
  const followUp = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((followUp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = diff < 0;
  const isNear = diff >= 0 && diff <= 3;

  return (
    <MetricTooltip title="📅 Acompanhamento" description="Data limite para acompanhamento. Vermelho=vencido, amarelo=próximo do prazo.">
      <span className={`flex items-center gap-1 text-[10px] cursor-help ${isOverdue ? 'text-red-500 font-medium' : isNear ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}`}>
        <Clock className="h-3 w-3" />
        {format(followUp, "dd/MM", { locale: ptBR })}
        {isOverdue && ' (vencido)'}
      </span>
    </MetricTooltip>
  );
}

export function StudentTriageTab({ institutionId }: StudentTriageTabProps) {
  const { data: students = [], isLoading } = useStudentTriageData(institutionId);
  const { notes: institutionNotes } = useInstitutionNotes(institutionId);
  const { data: triageRecords = [] } = useTriageRecords(institutionId);
  const { createTriage, updateTriageStatus } = useTriageActions(institutionId);

  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentRiskData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('para_triar');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const counts = useMemo(() => {
    const c: Record<RiskLevel, number> = { critical: 0, alert: 0, attention: 0, healthy: 0, no_data: 0 };
    students.forEach(s => c[s.riskLevel]++);
    return c;
  }, [students]);

  const totalStudents = students.length;

  // Students not yet triaged or pending
  const pendingStudents = useMemo(() => {
    let filtered = students.filter(s => !s.lastTriageStatus || s.lastTriageStatus === 'pending');
    if (riskFilter !== 'all') filtered = filtered.filter(s => s.riskLevel === riskFilter);
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      filtered = filtered.filter(s => s.studentName.toLowerCase().includes(term));
    }
    filtered.sort((a, b) => riskOrder.indexOf(a.riskLevel) - riskOrder.indexOf(b.riskLevel));
    return filtered;
  }, [students, riskFilter, debouncedSearch]);

  // Triage records by status
  const inProgressTriages = useMemo(() => {
    return triageRecords.filter(t => t.status === 'triaged' || t.status === 'in_progress');
  }, [triageRecords]);

  const resolvedTriages = useMemo(() => {
    return triageRecords.filter(t => t.status === 'resolved');
  }, [triageRecords]);

  const allTriages = useMemo(() => {
    return [...triageRecords].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [triageRecords]);

  // Count of critical pending students
  const criticalPendingCount = useMemo(() => {
    return students.filter(s => s.riskLevel === 'critical' && (!s.lastTriageStatus || s.lastTriageStatus === 'pending')).length;
  }, [students]);

  const patientNameMap = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach(s => map.set(s.patientId, s.studentName));
    return map;
  }, [students]);

  const selectedStudentHistory = useMemo(() => {
    if (!selectedStudent) return [];
    return triageRecords.filter(t => t.patient_id === selectedStudent.patientId);
  }, [selectedStudent, triageRecords]);

  const handleTriage = async (data: any) => {
    await createTriage.mutateAsync(data);
  };

  const handleExport = useCallback(() => {
    const exportStudents = activeTab === 'para_triar' ? pendingStudents : students.filter(s => {
      if (riskFilter !== 'all') return s.riskLevel === riskFilter;
      return true;
    });
    const data = exportStudents.map(s => ({
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
  }, [activeTab, pendingStudents, students, riskFilter]);

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
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Summary cards — redesigned */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {riskOrder.map(level => {
            const config = riskConfig[level];
            const Icon = config.icon;
            const count = counts[level];
            const pct = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
            const tooltip = riskTooltips[level];
            const isSelected = riskFilter === level;

            return (
              <MetricTooltip key={level} title={tooltip.title} description={tooltip.description}>
                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${config.cardBg} ${isSelected ? 'ring-2 ring-primary shadow-md scale-[1.02]' : ''}`}
                  onClick={() => setRiskFilter(isSelected ? 'all' : level)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-2.5 rounded-xl ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold tracking-tight">{count}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{config.label}</p>
                    </div>
                    <Progress value={pct} className={`h-1.5 ${config.progressColor}`} />
                  </CardContent>
                </Card>
              </MetricTooltip>
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

          <Button variant="outline" size="sm" onClick={handleExport} className="ml-auto">
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>

        {/* Sub-tabs for triage workflow */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap">
            <TabsTrigger value="para_triar" className="gap-2 data-[state=active]:bg-background">
              Para Triar
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0 h-5 ${
                  criticalPendingCount > 0
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    : ''
                }`}
              >
                {pendingStudents.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="em_andamento" className="gap-2 data-[state=active]:bg-background">
              Em Andamento
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
                {inProgressTriages.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="concluidos" className="gap-2 data-[state=active]:bg-background">
              Concluídos
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                {resolvedTriages.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="todos" className="gap-2 data-[state=active]:bg-background">
              Todos
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                {allTriages.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Para Triar */}
          <TabsContent value="para_triar">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Alunos para Triar
                  <Badge variant="secondary" className="ml-2 text-xs font-normal">{pendingStudents.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {pendingStudents.map(student => {
                    const config = riskConfig[student.riskLevel];
                    const isCritical = student.riskLevel === 'critical';

                    return (
                      <div key={student.patientId} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Badge className={`shrink-0 ${config.color}`}>{config.label}</Badge>
                            <p className="font-medium text-sm truncate">{student.studentName}</p>
                            <TrendBadge trend={student.moodTrend} />
                            <MetricTooltip title="📝 Registros" description="Quantidade de diários emocionais preenchidos nos últimos 14 dias.">
                              <Badge variant="outline" className="text-[10px] cursor-help font-normal">
                                {student.entryCount} reg.
                              </Badge>
                            </MetricTooltip>
                          </div>
                          <Button
                            size="sm"
                            variant={isCritical ? 'destructive' : 'outline'}
                            onClick={() => { setSelectedStudent(student); setDialogOpen(true); }}
                          >
                            Triar
                          </Button>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 flex-1">
                            <MetricTooltip title={metricTooltips.mood.title} description={metricTooltips.mood.description}>
                              <div className="space-y-1 cursor-help">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-1 text-muted-foreground"><Activity className="h-3 w-3" />Humor</span>
                                  <span className="font-medium">{student.avgMood?.toFixed(1) ?? '—'}</span>
                                </div>
                                <MetricBar value={student.avgMood} />
                              </div>
                            </MetricTooltip>
                            <MetricTooltip title={metricTooltips.anxiety.title} description={metricTooltips.anxiety.description}>
                              <div className="space-y-1 cursor-help">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-1 text-muted-foreground"><Brain className="h-3 w-3" />Ansiedade</span>
                                  <span className="font-medium">{student.avgAnxiety?.toFixed(1) ?? '—'}</span>
                                </div>
                                <MetricBar value={student.avgAnxiety} invert />
                              </div>
                            </MetricTooltip>
                            <MetricTooltip title={metricTooltips.energy.title} description={metricTooltips.energy.description}>
                              <div className="space-y-1 cursor-help">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-1 text-muted-foreground"><Zap className="h-3 w-3" />Energia</span>
                                  <span className="font-medium">{student.avgEnergy?.toFixed(1) ?? '—'}</span>
                                </div>
                                <MetricBar value={student.avgEnergy} />
                              </div>
                            </MetricTooltip>
                            <MetricTooltip title={metricTooltips.sleep.title} description={metricTooltips.sleep.description}>
                              <div className="space-y-1 cursor-help">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-1 text-muted-foreground"><Moon className="h-3 w-3" />Sono</span>
                                  <span className="font-medium">{student.avgSleep?.toFixed(1) ?? '—'}</span>
                                </div>
                                <MetricBar value={student.avgSleep} />
                              </div>
                            </MetricTooltip>
                          </div>
                          <MoodSparkline data={student.moodHistory} />
                        </div>
                      </div>
                    );
                  })}
                  {pendingStudents.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500/60" />
                      Todos os alunos foram triados! 🎉
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Em Andamento */}
          <TabsContent value="em_andamento">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Triagens em Andamento
                  <Badge variant="secondary" className="text-xs font-normal">{inProgressTriages.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {inProgressTriages.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Nenhuma triagem em andamento.
                  </div>
                ) : (
                  <div className="divide-y">
                    {inProgressTriages.map(t => {
                      const priorityBorder = t.priority === 'urgent' ? 'border-l-red-500' :
                        t.priority === 'high' ? 'border-l-orange-500' :
                        t.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500';

                      return (
                        <div key={t.id} className={`p-4 border-l-4 ${priorityBorder} hover:bg-muted/30 transition-colors`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm">{patientNameMap.get(t.patient_id) || 'Aluno'}</p>
                                <Badge className="text-[10px]">{priorityLabels[t.priority] || t.priority}</Badge>
                                <Badge variant={t.status === 'in_progress' ? 'default' : 'secondary'} className="text-[10px]">
                                  {t.status === 'in_progress' ? 'Em andamento' : 'Triado'}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span>{format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                                {t.recommended_action && <span>{actionLabels[t.recommended_action] || t.recommended_action}</span>}
                                {t.triaged_by_name && <span>por {t.triaged_by_name}</span>}
                              </div>
                              {t.notes && <p className="text-xs text-muted-foreground italic">"{t.notes}"</p>}
                              {t.follow_up_date && <FollowUpIndicator date={t.follow_up_date} />}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {t.status === 'triaged' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-8"
                                  onClick={() => updateTriageStatus.mutate({ triageId: t.id, status: 'in_progress' })}
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Em andamento
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="default"
                                className="text-xs h-8"
                                onClick={() => updateTriageStatus.mutate({ triageId: t.id, status: 'resolved', resolvedAt: new Date().toISOString() })}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Resolver
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Concluídos */}
          <TabsContent value="concluidos">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Triagens Concluídas
                  <Badge variant="secondary" className="text-xs font-normal">{resolvedTriages.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {resolvedTriages.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Nenhuma triagem concluída ainda.
                  </div>
                ) : (
                  <div className="divide-y">
                    {resolvedTriages.map(t => (
                      <div key={t.id} className="p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{patientNameMap.get(t.patient_id) || 'Aluno'}</p>
                              <Badge variant="secondary" className="text-[10px]">{priorityLabels[t.priority] || t.priority}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>Triado em {format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                              {t.resolved_at && <span>Resolvido em {format(new Date(t.resolved_at), "dd/MM/yyyy", { locale: ptBR })}</span>}
                              {t.triaged_by_name && <span>por {t.triaged_by_name}</span>}
                            </div>
                            {t.notes && <p className="text-xs text-muted-foreground italic truncate">"{t.notes}"</p>}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7"
                            onClick={() => updateTriageStatus.mutate({ triageId: t.id, status: 'triaged' })}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reabrir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Todos */}
          <TabsContent value="todos">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Histórico Completo
                  <Badge variant="secondary" className="text-xs font-normal">{allTriages.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {allTriages.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Nenhuma triagem registrada ainda.
                  </div>
                ) : (
                  <div className="divide-y">
                    {allTriages.map(t => {
                      const priorityBorder = t.priority === 'urgent' ? 'border-l-red-500' :
                        t.priority === 'high' ? 'border-l-orange-500' :
                        t.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500';
                      const statusLabel = t.status === 'resolved' ? 'Resolvido' : t.status === 'in_progress' ? 'Em andamento' : 'Triado';
                      const statusVariant = t.status === 'resolved' ? 'secondary' as const : 'default' as const;

                      return (
                        <div key={t.id} className={`p-3 border-l-4 ${priorityBorder} hover:bg-muted/30 transition-colors`}>
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm">{patientNameMap.get(t.patient_id) || 'Aluno'}</p>
                                <Badge className="text-[10px]">{priorityLabels[t.priority] || t.priority}</Badge>
                                <Badge variant={statusVariant} className="text-[10px]">{statusLabel}</Badge>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span>{format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                                {t.recommended_action && <span>{actionLabels[t.recommended_action] || t.recommended_action}</span>}
                                {t.triaged_by_name && <span>por {t.triaged_by_name}</span>}
                              </div>
                              {t.notes && <p className="text-xs text-muted-foreground italic truncate">"{t.notes}"</p>}
                              {t.follow_up_date && <FollowUpIndicator date={t.follow_up_date} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <TriageDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          student={selectedStudent}
          studentHistory={selectedStudentHistory}
          onSubmit={handleTriage}
        />
      </div>
    </TooltipProvider>
  );
}
