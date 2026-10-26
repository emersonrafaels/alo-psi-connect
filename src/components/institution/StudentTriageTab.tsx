import { useState, useMemo, useCallback, useEffect } from 'react';
import { LoadingBar, LoadingSection, LoadingCards } from "@/components/ui/loading-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, AlertCircle, Eye, Heart, HelpCircle, TrendingDown, TrendingUp, Minus, ChevronDown, ClipboardCheck, Activity, Brain, Zap, Moon, Info, Search, Download, Calendar, Clock, CheckCircle2, RotateCcw, Play, ChevronRight, Maximize2, BookOpen, Users } from 'lucide-react';
import { subDays } from 'date-fns';
import { useStudentTriageData, useTriageRecords, useTriageNotes, useTriageActions, RiskLevel, StudentRiskData } from '@/hooks/useStudentTriage';
import { TriageDialog } from './TriageDialog';
import TriageResolutionDialog, { RESOLUTION_TYPE_LABEL } from './TriageResolutionDialog';
import TriageReopenDialog from './TriageReopenDialog';
import { StudentActivityModal, type ActivityTab } from './StudentActivityModal';
import { BatchTriageDialog } from './BatchTriageDialog';
import { TriageMetricsDashboard } from './TriageMetricsDashboard';
import { DetailModal } from './DetailModal';
import { useInstitutionNotes } from '@/hooks/useInstitutionNotes';
import { anonymizeStudentName, buildAnonymizedStudentIndex } from '@/hooks/useAnonymizationConfig';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/useDebounce';
import * as XLSX from 'xlsx';
import { useTriagePeriod } from '@/hooks/useTriagePeriod';
import { buildPriorities, buildActions, isAwaitingTriage } from '@/features/triage/priorities';
import { TriageFunnel } from '@/features/triage/TriageFunnel';
import { Layers } from 'lucide-react';
import { TriageSummary, TriagePriorities, TriageFollowUps, ViewHeader } from '@/features/triage/TriageViews';
import { PendingQueue } from '@/features/triage/queue/PendingQueue';
import { sortPending, type PendingSort } from '@/features/triage/queue/indicators';
import { AllStudents } from '@/features/triage/AllStudents';

export type TriageView = 'resumo' | 'prioridades' | 'followups' | 'fila' | 'metricas';

interface StudentTriageTabProps {
  institutionId: string;
  view?: TriageView;
  initialRisk?: string | null;
  initialTab?: string | null;
  onNavigate?: (view: TriageView, params?: { risk?: string; tab?: string }) => void;
}

const riskConfig: Record<RiskLevel, {label: string;color: string;labelColor: string;icon: typeof AlertTriangle;cardBg: string;progressColor: string;}> = {
  critical: { label: 'Em Risco', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', labelColor: 'text-red-700 dark:text-red-400', icon: AlertTriangle, cardBg: 'border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20', progressColor: '[&>div]:bg-red-500' },
  alert: { label: 'Alerta', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', labelColor: 'text-orange-700 dark:text-orange-400', icon: AlertCircle, cardBg: 'border-orange-200 dark:border-orange-900/50 bg-orange-50/40 dark:bg-orange-950/20', progressColor: '[&>div]:bg-orange-500' },
  attention: { label: 'Atenção', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', labelColor: 'text-yellow-700 dark:text-yellow-400', icon: Eye, cardBg: 'border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/30 dark:bg-yellow-950/20', progressColor: '[&>div]:bg-yellow-500' },
  healthy: { label: 'Saudável', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', labelColor: 'text-green-700 dark:text-green-400', icon: Heart, cardBg: 'border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/20', progressColor: '[&>div]:bg-green-500' },
  no_data: { label: 'Sem Dados', color: 'bg-muted text-muted-foreground', labelColor: 'text-muted-foreground', icon: HelpCircle, cardBg: 'bg-muted/30', progressColor: '[&>div]:bg-muted-foreground/40' }
};

const riskLegend: Record<RiskLevel, string> = {
  critical: 'Humor médio ≤ 1.5, ansiedade ≥ 4.5 ou queda no humor > 40%',
  alert: 'Humor ≤ 2.5, ansiedade ≥ 3.5 ou energia ≤ 1.5',
  attention: 'Humor ≤ 3.0, ansiedade ≥ 3.0 ou qualidade de sono ≤ 2.0',
  healthy: 'Indicadores dentro da faixa esperada',
  no_data: 'Sem registros no período selecionado'
};

const riskTooltips: Record<RiskLevel, {title: string;description: string;}> = {
  critical: {
    title: '🔴 Nível Em Risco',
    description: 'Alunos com humor muito baixo (≤1.5), ansiedade muito alta (≥4.5) ou queda brusca no humor (>40%). Necessitam atenção imediata.'
  },
  alert: {
    title: '🟠 Nível Alerta',
    description: 'Alunos com humor baixo (≤2.5), ansiedade elevada (≥3.5) ou energia muito baixa. Recomenda-se acompanhamento.'
  },
  attention: {
    title: '🟡 Nível Atenção',
    description: 'Alunos com indicadores moderadamente preocupantes. Vale monitorar de perto.'
  },
  healthy: {
    title: '🟢 Nível Saudável',
    description: 'Alunos com todos os indicadores dentro da faixa esperada.'
  },
  no_data: {
    title: '⚪ Sem Dados',
    description: 'Alunos que não registraram diários emocionais no período selecionado.'
  }
};

const priorityLabels: Record<string, string> = {
  urgent: '🔴 Urgente',
  high: '🟠 Alta',
  medium: '🟡 Média',
  low: '🟢 Baixa'
};

const actionLabels: Record<string, string> = {
  refer_professional: 'Encaminhar para profissional',
  schedule_talk: 'Agendar conversa',
  monitor: 'Monitorar',
  contact_family: 'Contato com família'
};

const riskOrder: RiskLevel[] = ['critical', 'alert', 'attention', 'healthy', 'no_data'];

// Elegant tooltip component
function MetricTooltip({ title, description, children }: {title: string;description: string;children: React.ReactNode;}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="w-[280px] p-0 border-border/60 shadow-lg">

        <div className="px-3 py-2 border-b border-border/40 bg-muted/50 rounded-t-md">
          <p className="font-semibold text-xs">{title}</p>
        </div>
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </TooltipContent>
    </Tooltip>);

}

function FollowUpIndicator({ date }: {date: string;}) {
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
    </MetricTooltip>);

}

export function StudentTriageTab({ institutionId, view, initialRisk, initialTab, onNavigate }: StudentTriageTabProps) {
  const [analysisPeriod, setAnalysisPeriod] = useTriagePeriod();
  const { data: students = [], isLoading } = useStudentTriageData(
    institutionId,
    analysisPeriod
  );
  const { notes: institutionNotes } = useInstitutionNotes(institutionId);
  const { data: triageRecords = [] } = useTriageRecords(institutionId);
  const { data: triageNotes = [] } = useTriageNotes(institutionId);
  const noteCounts = useMemo(() => {
    const m = new Map<string, number>();
    triageNotes.forEach((n) => m.set(n.patient_id, (m.get(n.patient_id) ?? 0) + 1));
    return m;
  }, [triageNotes]);
  const { createTriage, updateTriageStatus, batchCreateTriage, addQuickNote } = useTriageActions(institutionId);

  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentRiskData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolveDialogTriage, setResolveDialogTriage] = useState<any | null>(null);
  const [reopenDialogTriage, setReopenDialogTriage] = useState<any | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('para_triar');
  const [pendingSort, setPendingSort] = useState<PendingSort>('urgency');
  const [pageSize, setPageSize] = useState(25);
  const [visibleCount, setVisibleCount] = useState(25);
  useEffect(() => { setVisibleCount(pageSize); }, [pageSize, activeTab, searchTerm, riskFilter]);
  const renderPager = (total: number) => (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-xs text-muted-foreground">
      <span>Exibindo {Math.min(visibleCount, total)} de {total}</span>
      <div className="flex items-center gap-2">
        <span>Mostrar</span>
        <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
          <SelectTrigger className="h-8 w-[84px]"><SelectValue /></SelectTrigger>
          <SelectContent>{[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
        </Select>
        <span>por vez</span>
        {visibleCount < total && (
          <Button size="sm" variant="outline" onClick={() => setVisibleCount((c) => c + pageSize)}>Ver mais</Button>
        )}
      </div>
    </div>
  );
  const [activityModalStudent, setActivityModalStudent] = useState<StudentRiskData | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityModalTab, setActivityModalTab] = useState<ActivityTab>('diario');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [historyPeriod, setHistoryPeriod] = useState<string>('all');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Detail modal states
  const [riskDetailLevel, setRiskDetailLevel] = useState<RiskLevel | null>(null);
  const [classAvgModalOpen, setClassAvgModalOpen] = useState(false);

  const counts = useMemo(() => {
    const c: Record<RiskLevel, number> = { critical: 0, alert: 0, attention: 0, healthy: 0, no_data: 0 };
    students.forEach((s) => c[s.riskLevel]++);
    return c;
  }, [students]);


  const totalStudents = students.length;

  const patientIndexMap = useMemo(() => {
    return buildAnonymizedStudentIndex(students.map((student) => student.patientId));
  }, [students]);

  // Only Em Risco students not yet triaged or pending enter the queue.
  const pendingStudents = useMemo(() => {
    let filtered = students.filter(isAwaitingTriage);
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      filtered = filtered.filter((s) => {
        const index = patientIndexMap.get(s.patientId) ?? 0;
        return anonymizeStudentName(index).toLowerCase().includes(term);
      });
    }
    return sortPending(filtered, pendingSort);
  }, [students, debouncedSearch, patientIndexMap, pendingSort]);

  // Triage records by status
  const inProgressTriages = useMemo(() => {
    return triageRecords.filter((t) => t.status === 'triaged' || t.status === 'in_progress');
  }, [triageRecords]);

  const resolvedTriages = useMemo(() => {
    return triageRecords.filter((t) => t.status === 'resolved');
  }, [triageRecords]);

  const allTriages = useMemo(() => {
    return [...triageRecords].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [triageRecords]);

  // Count of critical pending students
  const criticalPendingCount = useMemo(() => {
    return students.filter(isAwaitingTriage).length;
  }, [students]);

  const riskCounts = useMemo(() => {
    return {
      critical: students.filter((s) => s.riskLevel === 'critical').length,
      alert: students.filter((s) => s.riskLevel === 'alert').length,
      attention: students.filter((s) => s.riskLevel === 'attention').length,
    };
  }, [students]);

  const overdueFollowUpCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inProgressTriages.filter(t => {
      if (!t.follow_up_date) return false;
      return new Date(t.follow_up_date) < today;
    }).length;
  }, [inProgressTriages]);

  const goToOverdueFollowUps = useCallback(() => {
    setActiveTab('em_andamento');
    requestAnimationFrame(() => {
      document.getElementById('triage-queue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  // Apply filters coming from the summary/priority views
  useEffect(() => {
    if (view !== 'fila') return;
    const tab = initialTab || 'para_triar';
    setRiskFilter(tab === 'para_triar' ? 'critical' : initialRisk || 'all');
    if (tab === 'para_triar' && initialRisk && initialRisk !== 'critical') {
      onNavigate?.('fila', { risk: 'critical', tab });
    }
    if (initialTab) setActiveTab(initialTab);
    // Coming back from "Todos os alunos" (side menu) the queue tab is cleared, so fall back to the default queue.
    else setActiveTab((tab) => (tab === 'todos_alunos' ? 'para_triar' : tab));
  }, [view, initialRisk, initialTab]);

  const overduePatientIds = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Set(inProgressTriages.filter((t) => t.follow_up_date && new Date(t.follow_up_date) < today).map((t) => t.patient_id));
  }, [inProgressTriages]);

  const pendingByRisk = useMemo(() => {
    const c: Record<RiskLevel, number> = { critical: 0, alert: 0, attention: 0, healthy: 0, no_data: 0 };
    students.forEach((s) => { if (isAwaitingTriage(s)) c.critical++; });
    return c;
  }, [students]);

  const keywordStudentCount = useMemo(() => students.filter((s) => s.criticalKeywordFlag).length, [students]);

  const priorityItems = useMemo(() => buildPriorities(
    students.map((s) => ({ ...s, criticalSeverity: s.criticalKeywordFlag?.severity ?? null, overdueFollowUp: overduePatientIds.has(s.patientId) })),
    analysisPeriod,
  ), [students, overduePatientIds, analysisPeriod]);

  const triageActions = useMemo(() => buildActions({
    criticalPending: pendingByRisk.critical,
    overdueFollowUps: overdueFollowUpCount,
    keywordStudents: keywordStudentCount,
    noData: pendingByRisk.no_data,
  }), [pendingByRisk, overdueFollowUpCount, keywordStudentCount, counts]);

  const followUpRows = useMemo(() => inProgressTriages
    .filter((t) => t.follow_up_date)
    .map((t) => ({ id: t.id, patientId: t.patient_id, followUpDate: t.follow_up_date as string, status: t.status, action: t.recommended_action ? (actionLabels[t.recommended_action] || t.recommended_action) : null })),
  [inProgressTriages]);

  const nav = (v: TriageView, params?: { risk?: string; tab?: string }) => {
    if (onNavigate) onNavigate(v, params);
    else {
      if (params?.risk) setRiskFilter(params.risk);
      if (params?.tab) setActiveTab(params.tab);
    }
  };
  // In the Fila view the risk filter and sub-tab live in the URL, so links and reloads keep them.
  const syncQueueUrl = (risk: string, tab: string) => {
    if (view === 'fila' && onNavigate) onNavigate('fila', { risk: risk === 'all' ? undefined : risk, tab });
  };
  const changeRisk = (risk: string) => { setRiskFilter(risk); setSelectedStudentIds(new Set()); syncQueueUrl(risk, activeTab); };
  const changeTab = (tab: string) => {
    const risk = tab === 'para_triar' ? 'critical' : 'all';
    setActiveTab(tab); setRiskFilter(risk); setSelectedStudentIds(new Set()); syncQueueUrl(risk, tab);
  };
  const showLegacy = !view;
  const [funnelOpen, setFunnelOpen] = useState(true);
  useEffect(() => { setFunnelOpen(view === 'resumo'); }, [view]);
  const showView = (v: TriageView) => !view || view === v;


  const filteredResolvedTriages = useMemo(() => {
    if (historyPeriod === 'all') return resolvedTriages;
    const cutoff = new Date();
    if (historyPeriod === '1w') cutoff.setDate(cutoff.getDate() - 7);
    else if (historyPeriod === '1m') cutoff.setMonth(cutoff.getMonth() - 1);
    else cutoff.setMonth(cutoff.getMonth() - 3);
    return resolvedTriages.filter(t => new Date(t.created_at) >= cutoff);
  }, [resolvedTriages, historyPeriod]);

  const filteredAllTriages = useMemo(() => {
    if (historyPeriod === 'all') return allTriages;
    const cutoff = new Date();
    if (historyPeriod === '1w') cutoff.setDate(cutoff.getDate() - 7);
    else if (historyPeriod === '1m') cutoff.setMonth(cutoff.getMonth() - 1);
    else cutoff.setMonth(cutoff.getMonth() - 3);
    return allTriages.filter(t => new Date(t.created_at) >= cutoff);
  }, [allTriages, historyPeriod]);

  const classAverages = useMemo(() => {
    const withData = students.filter((s) => s.riskLevel !== 'no_data');
    if (withData.length === 0) return { mood: null, anxiety: null, energy: null, sleep: null };
    const avg = (vals: (number | null)[]) => {
      const valid = vals.filter((v): v is number => v != null);
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
    };
    return {
      mood: avg(withData.map((s) => s.avgMood)),
      anxiety: avg(withData.map((s) => s.avgAnxiety)),
      energy: avg(withData.map((s) => s.avgEnergy)),
      sleep: avg(withData.map((s) => s.avgSleep))
    };
  }, [students]);

  const patientDataMap = useMemo(() => {
    const map = new Map<string, StudentRiskData>();
    students.forEach((s) => map.set(s.patientId, s));
    return map;
  }, [students]);

  const patientNameMap = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s, idx) => {
      map.set(s.patientId, anonymizeStudentName(patientIndexMap.get(s.patientId) ?? idx));
    });
    return map;
  }, [students, patientIndexMap]);

  // Students grouped by risk level for detail modal
  const studentsByRisk = useMemo(() => {
    const groups: Record<RiskLevel, StudentRiskData[]> = { critical: [], alert: [], attention: [], healthy: [], no_data: [] };
    students.forEach((s) => groups[s.riskLevel].push(s));
    return groups;
  }, [students]);

  // Class averages detail data (min, max, median)
  const classAvgDetail = useMemo(() => {
    const withData = students.filter((s) => s.riskLevel !== 'no_data');
    const compute = (vals: (number | null)[]) => {
      const valid = vals.filter((v): v is number => v != null).sort((a, b) => a - b);
      if (valid.length === 0) return null;
      const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
      const median = valid.length % 2 === 0 ? (valid[valid.length / 2 - 1] + valid[valid.length / 2]) / 2 : valid[Math.floor(valid.length / 2)];
      return { min: valid[0], max: valid[valid.length - 1], avg: Math.round(avg * 10) / 10, median: Math.round(median * 10) / 10 };
    };
    return {
      mood: compute(withData.map((s) => s.avgMood)),
      anxiety: compute(withData.map((s) => s.avgAnxiety)),
      energy: compute(withData.map((s) => s.avgEnergy)),
      sleep: compute(withData.map((s) => s.avgSleep)),
    };
  }, [students]);

  const handleOpenActivity = (student: StudentRiskData, tab: ActivityTab = 'diario') => {
    setActivityModalStudent(student);
    setActivityModalTab(tab);
    setActivityModalOpen(true);
  };

  const handleOpenActivityByPatientId = (patientId: string) => {
    const student = patientDataMap.get(patientId);
    if (student) {
      handleOpenActivity(student);
    }
  };

  const selectedStudentHistory = useMemo(() => {
    if (!selectedStudent) return [];
    return triageRecords.filter((t) => t.patient_id === selectedStudent.patientId);
  }, [selectedStudent, triageRecords]);

  const handleTriage = async (data: any) => {
    await createTriage.mutateAsync(data);
  };

  const handleBatchTriage = useCallback(async (data: { patientIds: string[]; priority: string; recommendedAction: string; notes: string; followUpDate?: string }) => {
    const entries = data.patientIds.map(id => {
      const s = patientDataMap.get(id);
      return {
        patientId: id,
        riskLevel: s?.riskLevel || 'attention',
        studentName: patientNameMap.get(id) ?? 'Aluno',
      };
    });
    await batchCreateTriage.mutateAsync({ entries, priority: data.priority, recommendedAction: data.recommendedAction, notes: data.notes, followUpDate: data.followUpDate });
    setSelectedStudentIds(new Set());
  }, [batchCreateTriage, patientDataMap, patientNameMap]);

  const toggleStudentSelection = useCallback((patientId: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(patientId)) next.delete(patientId);
      else next.add(patientId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedStudentIds.size === pendingStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(pendingStudents.map(s => s.patientId)));
    }
  }, [pendingStudents, selectedStudentIds.size]);

  const handleExport = useCallback((type: 'pending' | 'history' | 'full') => {
    if (type === 'pending') {
      const data = pendingStudents.map((s, idx) => ({
        'Aluno': anonymizeStudentName(patientIndexMap.get(s.patientId) ?? idx),
        'Nível de Risco': riskConfig[s.riskLevel].label,
        'Humor Médio': s.avgMood ?? '—',
        'Ansiedade Média': s.avgAnxiety ?? '—',
        'Energia Média': s.avgEnergy ?? '—',
        'Sono Médio': s.avgSleep ?? '—',
        'Tendência (%)': s.moodTrend ?? '—',
        'Registros': s.entryCount,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pendentes');
      XLSX.writeFile(wb, `pendentes-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } else if (type === 'history') {
      const data = triageRecords.map(t => ({
        'Aluno': patientNameMap.get(t.patient_id) || 'Aluno',
        'Status': t.status === 'resolved' ? 'Resolvido' : t.status === 'in_progress' ? 'Em andamento' : 'Triado',
        'Prioridade': priorityLabels[t.priority] || t.priority,
        'Ação': actionLabels[t.recommended_action || ''] || t.recommended_action || '',
        'Notas': t.notes || '',
        'Triado por': t.triaged_by_name || '',
        'Data Triagem': format(new Date(t.created_at), 'dd/MM/yyyy'),
        'Data Resolução': t.resolved_at ? format(new Date(t.resolved_at), 'dd/MM/yyyy') : '',
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Triagens');
      XLSX.writeFile(wb, `triagens-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } else {
      const studentsData = students.map((s, idx) => ({
        'Aluno': anonymizeStudentName(patientIndexMap.get(s.patientId) ?? idx),
        'Nível de Risco': riskConfig[s.riskLevel].label,
        'Humor': s.avgMood ?? '—',
        'Ansiedade': s.avgAnxiety ?? '—',
        'Energia': s.avgEnergy ?? '—',
        'Sono': s.avgSleep ?? '—',
        'Tendência (%)': s.moodTrend ?? '—',
        'Registros': s.entryCount,
        'Status Triagem': s.lastTriageStatus || 'Pendente',
      }));
      const triagesData = triageRecords.map(t => ({
        'Aluno': patientNameMap.get(t.patient_id) || 'Aluno',
        'Status': t.status === 'resolved' ? 'Resolvido' : t.status === 'in_progress' ? 'Em andamento' : 'Triado',
        'Prioridade': priorityLabels[t.priority] || t.priority,
        'Ação': actionLabels[t.recommended_action || ''] || t.recommended_action || '',
        'Notas': t.notes || '',
        'Data': format(new Date(t.created_at), 'dd/MM/yyyy'),
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentsData), 'Alunos');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(triagesData), 'Triagens');
      XLSX.writeFile(wb, `relatorio-completo-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    }
  }, [pendingStudents, students, triageRecords, patientNameMap, patientIndexMap]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingCards labels={["Em Risco", "Alerta", "Atenção", "Estável"]} />
        <LoadingSection label="Carregando dados da triagem..." />
      </div>);

  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Nenhum aluno matriculado nesta instituição.</p>
        </CardContent>
      </Card>);

  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Fila and Métricas carry the period in their own toolbars. */}
        {view && view !== 'fila' && view !== 'metricas' && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Período analisado</span>
            <Select value={String(analysisPeriod)} onValueChange={(v) => setAnalysisPeriod(Number(v))}>
              <SelectTrigger className="h-8 w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Última semana (7d)</SelectItem>
                <SelectItem value="15">Quinzena (15d)</SelectItem>
                <SelectItem value="30">Último mês (30d)</SelectItem>
                <SelectItem value="60">2 meses (60d)</SelectItem>
                <SelectItem value="90">Trimestre (90d)</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">{format(subDays(new Date(), analysisPeriod), 'dd/MM')} – {format(new Date(), 'dd/MM')} · Atualizado às {format(new Date(), 'HH:mm')}</span>
            <Button variant="outline" size="sm" className="ml-auto h-8 gap-1" onClick={() => setFunnelOpen((o) => !o)} aria-expanded={funnelOpen}><Layers className="h-4 w-4" />Como funciona a triagem</Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground"><Info className="h-4 w-4" />Como a criticidade é calculada</Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" className="max-w-sm space-y-1.5 p-3 text-xs">
                {riskOrder.map((l) => <p key={l}><strong>{riskConfig[l].label}:</strong> {riskLegend[l]}</p>)}
                <p><strong>Palavras críticas:</strong> termos graves no diário levam a Em Risco; termos moderados sobem um nível. O texto do aluno nunca é exibido.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        {view && (view === 'resumo' || funnelOpen) && (
          <div className={view === 'resumo' ? 'order-none' : ''}>
            <TriageFunnel
              open={view === 'resumo' ? funnelOpen : true}
              onOpenChange={setFunnelOpen}
              onNavigate={nav}
              counts={{
                total: totalStudents,
                withData: totalStudents - counts.no_data,
                atRisk: counts.critical,
                alert: counts.alert,
                attention: counts.attention,
                healthy: counts.healthy,
                priorities: priorityItems.length,
                pending: pendingByRisk.critical,
                inFollowUp: inProgressTriages.length,
                overdue: overdueFollowUpCount,
                resolved: resolvedTriages.length,
              }}
            />
          </div>
        )}
        {view === 'resumo' && (
          <>
            <ViewHeader title="Resumo" description="Quantos alunos estão em cada nível de risco e o que fazer primeiro. Clique em um nível para ver os alunos." />
            <TriageSummary
              counts={counts}
              pendingByRisk={pendingByRisk}
              total={totalStudents}
              periodDays={analysisPeriod}
              overdueFollowUps={overdueFollowUpCount}
              actions={triageActions}
              onOpenRisk={(r) => r === 'critical' ? nav('fila', { risk: r, tab: 'para_triar' }) : setRiskDetailLevel(r)}
              onAction={(a) => {
                if (a === 'critical') nav('fila', { risk: 'critical', tab: 'para_triar' });
                else if (a === 'followups') nav('followups');
                else if (a === 'keywords') nav('prioridades');
                else setRiskDetailLevel('no_data');
              }}
            />
          </>
        )}

        {view === 'prioridades' && (
          <>
            <ViewHeader title="Prioridades" description="Os alunos mais urgentes, em ordem, com o motivo em linguagem simples." />
            <TriagePriorities
              items={priorityItems}
              nameOf={(id) => patientNameMap.get(id) ?? 'Aluno'}
              onTriage={(s) => { setSelectedStudent(s); setDialogOpen(true); }}
              onHistory={(s) => handleOpenActivity(s)}
            />
          </>
        )}

        {view === 'followups' && (
          <>
            <ViewHeader title="Follow-ups" description="Acompanhamentos vencidos e os que vencem nos próximos 7 dias." />
            <TriageFollowUps
              rows={followUpRows}
              nameOf={(id) => patientNameMap.get(id) ?? 'Aluno'}
              onResolve={(id) => setResolveDialogTriage(triageRecords.find((t) => t.id === id) ?? null)}
              onContact={(pid) => handleOpenActivityByPatientId(pid)}
            />
          </>
        )}

        {view === 'fila' && <ViewHeader title="Fila de triagem" description="Para Triar reúne apenas alunos Em Risco. Use “Todos os alunos” no menu lateral para ver todos os níveis e filtros." />}
        {view === 'metricas' && <ViewHeader title="Métricas" description="A equipe está dando conta? Volume, tempo até resolver, cobertura dos alunos em risco, desfechos e carga por pessoa no período escolhido." />}

        {showLegacy && (<>
        {/* Summary cards — redesigned */}
        <div id="triage-risk" className="scroll-mt-20 grid grid-cols-2 md:grid-cols-5 gap-3">
          {riskOrder.map((level) => {
            const config = riskConfig[level];
            const Icon = config.icon;
            const count = counts[level];
            const pct = totalStudents > 0 ? count / totalStudents * 100 : 0;
            const tooltip = riskTooltips[level];
            const isSelected = riskFilter === level;

            return (
              <MetricTooltip key={level} title={tooltip.title} description={tooltip.description}>
                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${config.cardBg} ${isSelected ? 'ring-2 ring-primary shadow-md scale-[1.02]' : ''}`}
                  onClick={() => setRiskFilter(isSelected ? 'all' : level)}>

                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-lg font-bold ${config.labelColor}`}>
                          {pct.toFixed(0)}%
                        </span>
                        <button
                          type="button"
                          className="p-1 rounded-md opacity-40 hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); setRiskDetailLevel(level); }}
                          title="Ver detalhes"
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold tracking-tight">
                        {count}
                      </p>
                      <p className={`text-xs font-semibold mt-0.5 ${config.labelColor}`}>{config.label}</p>
                    </div>
                    <Progress value={pct} className={`h-1.5 ${config.progressColor}`} />
                  </CardContent>
                </Card>
              </MetricTooltip>);

          })}
        </div>

        {/* Class averages summary with comparatives */}
        {(classAverages.mood != null || classAverages.anxiety != null) && (
          <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">Médias da turma ({analysisPeriod}d):</span>
            {classAverages.mood != null && (
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />Humor: {classAverages.mood.toFixed(1)}
              </span>
            )}
            {classAverages.anxiety != null && (
              <span className="flex items-center gap-1">
                <Brain className="h-3 w-3" />Ansiedade: {classAverages.anxiety.toFixed(1)}
              </span>
            )}
            {classAverages.energy != null && (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />Energia: {classAverages.energy.toFixed(1)}
              </span>
            )}
            {classAverages.sleep != null && (
              <span className="flex items-center gap-1">
                <Moon className="h-3 w-3" />Sono: {classAverages.sleep.toFixed(1)}
              </span>
            )}
            <button
              type="button"
              className="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
              onClick={() => setClassAvgModalOpen(true)}
              title="Ver detalhes"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div id="triage-followups" className="scroll-mt-20" />
        {/* Stratified attention banner */}
        {(riskCounts.critical + riskCounts.alert + riskCounts.attention) > 0 && (() => {
          const openTotal = riskCounts.critical + riskCounts.alert + riskCounts.attention;
          return (
            <Alert className="border-red-300 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-foreground">
                <div className="space-y-2">
                  <div className="font-semibold text-red-800 dark:text-red-300">
                    {openTotal} aluno{openTotal > 1 ? 's' : ''} {openTotal > 1 ? 'precisam' : 'precisa'} da sua atenção nos últimos {analysisPeriod} dias
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                    {riskCounts.critical > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <strong className="text-red-700 dark:text-red-300">{riskCounts.critical} em risco</strong>
                        <span className="text-muted-foreground">— ação imediata (contato urgente)</span>
                      </span>
                    )}
                    {riskCounts.alert > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                        <strong className="text-orange-700 dark:text-orange-300">{riskCounts.alert} em alerta</strong>
                        <span className="text-muted-foreground">— acolhimento em até 7 dias</span>
                      </span>
                    )}
                    {riskCounts.attention > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                        <strong className="text-yellow-700 dark:text-yellow-400">{riskCounts.attention} em atenção</strong>
                        <span className="text-muted-foreground">— monitorar próximo check-in</span>
                      </span>
                    )}
                  </div>
                  {criticalPendingCount > 0 && (
                    <div className="pt-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs"
                        onClick={() => { setRiskFilter('critical'); setActiveTab('para_triar'); }}
                      >
                        Começar pelos alunos em risco
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          );
        })()}

        {/* Overdue follow-up banner */}
        {overdueFollowUpCount > 0 && (
          <Alert className="border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800">
            <Clock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-sm text-orange-800 dark:text-orange-300 flex items-center justify-between">
              <span>
                <span className="font-semibold">{overdueFollowUpCount} {overdueFollowUpCount === 1 ? 'triagem' : 'triagens'} com follow-up vencido.</span>
              </span>
              <Button variant="ghost" size="sm" className="text-orange-700 hover:text-orange-900 h-7 text-xs" onClick={goToOverdueFollowUps}>
                Ver <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </AlertDescription>
          </Alert>
        )}
        </>)}

        {/* Triage Metrics Dashboard */}
        {showView('metricas') && (<>
        <div id="triage-metrics" className="scroll-mt-20" />
        <TriageMetricsDashboard
          triageRecords={triageRecords}
          students={students}
          institutionId={institutionId}
          periodDays={analysisPeriod}
          onPeriodChange={setAnalysisPeriod}
          variant={view ? 'full' : 'compact'}
          onNavigate={(target) => {
            if (target === 'critical_queue') nav('fila', { risk: 'critical', tab: 'para_triar' });
            else if (target === 'followups') nav('followups');
            else nav('fila', { tab: 'em_andamento' });
          }}
        />
        </>)}

        {/* Contexto Institucional */}
        {(showLegacy || view === 'resumo') && (() => {
          const today = new Date().toISOString().split('T')[0];
          const activeTriageNotes = institutionNotes.filter((n) => {
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
                {activeTriageNotes.map((n) => n.title).join(', ')}
                {' — '}Considere estes eventos ao avaliar os alunos.
              </AlertDescription>
            </Alert>);

        })()}

        {showView('fila') && (<>
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
                {riskOrder.map((level) => {
                  const config = riskConfig[level];
                  const Icon = config.icon;
                  return (
                    <div key={level} className="flex items-start gap-2">
                      <Badge className={`shrink-0 mt-0.5 ${config.color}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      <span className="text-muted-foreground">{riskLegend[level]}</span>
                    </div>);

                })}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Filters + search + period selector + export */}
        <div id="triage-queue" className="scroll-mt-20 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Select value={String(analysisPeriod)} onValueChange={(v) => setAnalysisPeriod(Number(v))}>
              <SelectTrigger className="w-[180px]" aria-label="Período analisado">
                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Última semana (7d)</SelectItem>
                <SelectItem value="15">Quinzena (15d)</SelectItem>
                <SelectItem value="30">Último mês (30d)</SelectItem>
                <SelectItem value="60">2 meses (60d)</SelectItem>
                <SelectItem value="90">Trimestre (90d)</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {format(subDays(new Date(), analysisPeriod), 'dd/MM')} – {format(new Date(), 'dd/MM')}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <Download className="h-4 w-4 mr-1" />
                Exportar
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pending')}>Alunos pendentes</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('history')}>Histórico de triagens</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('full')}>Relatório completo</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>


        {/* Sub-tabs for triage workflow */}
        <Tabs value={activeTab} onValueChange={changeTab}>
          <TabsList className="w-full justify-start bg-muted/50 p-1.5 h-auto flex-wrap">
            <TabsTrigger value="para_triar" className="gap-2 py-2 px-4 text-sm data-[state=active]:bg-background">
              Para Triar
              <Badge
                variant="secondary"
                className={`text-xs px-2 py-0.5 h-5 ${
                criticalPendingCount > 0 ?
                'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                ''}`
                }>

                {criticalPendingCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="em_andamento" className="gap-2 py-2 px-4 text-sm data-[state=active]:bg-background">
              Em Andamento
              <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
                {inProgressTriages.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="concluidos" className="gap-2 py-2 px-4 text-sm data-[state=active]:bg-background">
              Concluídos
              <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                {resolvedTriages.length}
              </Badge>
            </TabsTrigger>
            {/* In the full-screen triage page "Todos os alunos" lives in the side menu; the embedded
                portal tab has no side menu, so the trigger stays there. */}
            {showLegacy && (
              <TabsTrigger value="todos_alunos" className="gap-2 py-2 px-4 text-sm data-[state=active]:bg-background">
                <Users className="h-4 w-4" />Ver todos
                <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5">{students.length}</Badge>
              </TabsTrigger>
            )}
            <TabsTrigger value="todos" className="gap-2 py-2 px-4 text-sm data-[state=active]:bg-background">
              Histórico de triagens
              <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5">
                {allTriages.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos_alunos">
            <AllStudents students={students} nameOf={(id) => patientNameMap.get(id) ?? 'Aluno'}
              overdueIds={overduePatientIds} periodDays={analysisPeriod} risk={riskFilter}
              onRiskChange={changeRisk} onOpenHistory={(student) => handleOpenActivity(student)} />
          </TabsContent>

          {/* Tab: Para Triar */}
          <TabsContent value="para_triar">
            <PendingQueue
              students={pendingStudents}
              visibleCount={visibleCount}
              pendingByRisk={pendingByRisk}
              search={searchTerm}
              onSearchChange={setSearchTerm}
              sort={pendingSort}
              onSortChange={setPendingSort}
              periodDays={analysisPeriod}
              classAverages={classAverages}
              nameOf={(id) => patientNameMap.get(id) ?? 'Aluno'}
              selectedIds={selectedStudentIds}
              onToggleSelect={toggleStudentSelection}
              onToggleSelectAll={toggleSelectAll}
              onClearSelection={() => setSelectedStudentIds(new Set())}
              onBatchTriage={() => setBatchDialogOpen(true)}
              onTriage={(s) => { setSelectedStudent(s); setDialogOpen(true); }}
              onOpenHistory={(s) => handleOpenActivity(s)}
              noteCountOf={(id) => noteCounts.get(id) ?? 0}
              notesOf={(id) => triageNotes.filter((n) => n.patient_id === id)}
              onOpenNotes={(s) => handleOpenActivity(s, 'notas')}
              onQuickNote={async (s, note) => { await addQuickNote.mutateAsync({ patientId: s.patientId, note, riskLevel: s.riskLevel }); }}
              footer={pendingStudents.length > 10 ? renderPager(pendingStudents.length) : null}
            />
          </TabsContent>

          {/* Tab: Em Andamento */}
          <TabsContent value="em_andamento">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Triagens em Andamento
                  <Badge variant="secondary" className="text-xs font-normal">{inProgressTriages.length}</Badge>
                </CardTitle>
                <CardDescription>Triagens que estão sendo acompanhadas ativamente</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {inProgressTriages.length === 0 ?
                <div className="p-8 text-center text-muted-foreground text-sm">
                    Nenhuma triagem em andamento.
                  </div> :

                <div className="divide-y">
                    {inProgressTriages.slice(0, visibleCount).map((t) => {
                    const priorityBorder = t.priority === 'urgent' ? 'border-l-red-500' :
                    t.priority === 'high' ? 'border-l-orange-500' :
                    t.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500';

                    return (
                      <div key={t.id} className={`p-4 border-l-4 ${priorityBorder} hover:bg-muted/30 transition-colors`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                              <button type="button" onClick={() => handleOpenActivityByPatientId(t.patient_id)} className="font-semibold text-base text-primary hover:underline cursor-pointer bg-transparent border-none p-0 text-left">{patientNameMap.get(t.patient_id) || 'Aluno'}</button>
                                <Badge className="text-xs">{priorityLabels[t.priority] || t.priority}</Badge>
                                <Badge variant={t.status === 'in_progress' ? 'default' : 'secondary'} className="text-xs">
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
                              {t.status === 'triaged' &&
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8"
                              onClick={() => updateTriageStatus.mutate({ triageId: t.id, status: 'in_progress' })}>

                                  <Play className="h-3 w-3 mr-1" />
                                  Em andamento
                                </Button>
                            }
                              <Button
                              size="sm"
                              variant="default"
                              className="text-xs h-8"
                              onClick={() => setResolveDialogTriage(t)}>

                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Resolver
                              </Button>
                            </div>
                          </div>
                        </div>);

                  })}
                  </div>
                }
                {inProgressTriages.length > 10 && renderPager(inProgressTriages.length)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Concluídos */}
          <TabsContent value="concluidos">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Triagens Concluídas
                      <Badge variant="secondary" className="text-xs font-normal">{filteredResolvedTriages.length}</Badge>
                    </CardTitle>
                    <CardDescription>Triagens finalizadas e resolvidas</CardDescription>
                  </div>
                  <Select value={historyPeriod} onValueChange={setHistoryPeriod}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1w">Última semana</SelectItem>
                      <SelectItem value="1m">Último mês</SelectItem>
                      <SelectItem value="3m">Últimos 3 meses</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredResolvedTriages.length === 0 ?
                <div className="p-8 text-center text-muted-foreground text-sm">
                    Nenhuma triagem concluída{historyPeriod !== 'all' ? ' neste período' : ' ainda'}.
                  </div> :

                <div className="divide-y">
                    {filteredResolvedTriages.slice(0, visibleCount).map((t) =>
                  <div key={t.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => handleOpenActivityByPatientId(t.patient_id)} className="font-semibold text-base text-primary hover:underline cursor-pointer bg-transparent border-none p-0 text-left">{patientNameMap.get(t.patient_id) || 'Aluno'}</button>
                              <Badge variant="secondary" className="text-xs">{priorityLabels[t.priority] || t.priority}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>Triado em {format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                              {t.resolved_at && <span>Resolvido em {format(new Date(t.resolved_at), "dd/MM/yyyy", { locale: ptBR })}</span>}
                              {t.triaged_by_name && <span>por {t.triaged_by_name}</span>}
                            </div>
                            {t.notes && <p className="text-xs text-muted-foreground italic truncate">"{t.notes}"</p>}
                            {(t as any).resolution_type && (
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <Badge variant="outline" className="text-[10px] h-5">
                                  {RESOLUTION_TYPE_LABEL[(t as any).resolution_type] || (t as any).resolution_type}
                                </Badge>
                                {(t as any).resolution_notes && (
                                  <span className="text-xs text-muted-foreground italic truncate">
                                    {(t as any).resolution_notes}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7"
                        onClick={() => setReopenDialogTriage(t)}>

                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reabrir
                          </Button>
                        </div>
                      </div>
                  )}
                  </div>
                }
                {filteredResolvedTriages.length > 10 && renderPager(filteredResolvedTriages.length)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Todos */}
          <TabsContent value="todos">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5" />
                      Histórico Completo
                      <Badge variant="secondary" className="text-xs font-normal">{filteredAllTriages.length}</Badge>
                    </CardTitle>
                    <CardDescription>Todas as triagens realizadas nesta instituição</CardDescription>
                  </div>
                  <Select value={historyPeriod} onValueChange={setHistoryPeriod}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1w">Última semana</SelectItem>
                      <SelectItem value="1m">Último mês</SelectItem>
                      <SelectItem value="3m">Últimos 3 meses</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredAllTriages.length === 0 ?
                <div className="p-8 text-center text-muted-foreground text-sm">
                    Nenhuma triagem registrada{historyPeriod !== 'all' ? ' neste período' : ' ainda'}.
                  </div> :

                <div className="divide-y">
                    {filteredAllTriages.slice(0, visibleCount).map((t) => {
                    const priorityBorder = t.priority === 'urgent' ? 'border-l-red-500' :
                    t.priority === 'high' ? 'border-l-orange-500' :
                    t.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500';
                    const statusLabel = t.status === 'resolved' ? 'Resolvido' : t.status === 'in_progress' ? 'Em andamento' : 'Triado';
                    const statusVariant = t.status === 'resolved' ? 'secondary' as const : 'default' as const;

                    return (
                      <div key={t.id} className={`p-4 border-l-4 ${priorityBorder} hover:bg-muted/30 transition-colors`}>
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button type="button" onClick={() => handleOpenActivityByPatientId(t.patient_id)} className="font-semibold text-base text-primary hover:underline cursor-pointer bg-transparent border-none p-0 text-left">{patientNameMap.get(t.patient_id) || 'Aluno'}</button>
                                <Badge className="text-xs">{priorityLabels[t.priority] || t.priority}</Badge>
                                <Badge variant={statusVariant} className="text-xs">{statusLabel}</Badge>
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
                        </div>);

                  })}
                  </div>
                }
                {filteredAllTriages.length > 10 && renderPager(filteredAllTriages.length)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </>)}

        <TriageDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          student={selectedStudent ? { ...selectedStudent, studentName: patientNameMap.get(selectedStudent.patientId) ?? 'Aluno' } : null}
          studentHistory={selectedStudentHistory}
          periodDays={analysisPeriod}
          onSubmit={handleTriage} />

        <BatchTriageDialog
          open={batchDialogOpen}
          onOpenChange={setBatchDialogOpen}
          students={pendingStudents.filter(s => selectedStudentIds.has(s.patientId))}
          onSubmit={handleBatchTriage}
          isAnonymized
          studentIndexMap={patientIndexMap}
        />

        {activityModalStudent &&
        <StudentActivityModal
          open={activityModalOpen}
          onOpenChange={setActivityModalOpen}
          studentName={anonymizeStudentName(patientIndexMap.get(activityModalStudent.patientId) ?? 0)}
          profileId={activityModalStudent.profileId}
          patientId={activityModalStudent.patientId}
          institutionId={institutionId}
          riskLevel={activityModalStudent.riskLevel}
          entryCount={activityModalStudent.entryCount}
          periodDays={analysisPeriod}
          initialTab={activityModalTab} />

        }

        {/* Risk Detail Modal */}
        <DetailModal
          title={riskDetailLevel ? `${riskTooltips[riskDetailLevel].title} — ${counts[riskDetailLevel]} aluno${counts[riskDetailLevel] !== 1 ? 's' : ''}` : ''}
          icon={riskDetailLevel ? riskConfig[riskDetailLevel].icon : undefined}
          open={!!riskDetailLevel}
          onOpenChange={(open) => { if (!open) setRiskDetailLevel(null); }}
        >
          {riskDetailLevel && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <strong>Critérios:</strong> {riskLegend[riskDetailLevel]}
              </div>
              {studentsByRisk[riskDetailLevel].length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Humor</TableHead>
                      <TableHead>Ansiedade</TableHead>
                      <TableHead>Energia</TableHead>
                      <TableHead>Sono</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsByRisk[riskDetailLevel].map((s, idx) => {
                      const displayName = anonymizeStudentName(patientIndexMap.get(s.patientId) ?? idx);
                      return (
                        <TableRow key={s.patientId}>
                          <TableCell className="font-medium">{displayName}</TableCell>
                          <TableCell>{s.avgMood?.toFixed(1) ?? '—'}</TableCell>
                          <TableCell>{s.avgAnxiety?.toFixed(1) ?? '—'}</TableCell>
                          <TableCell>{s.avgEnergy?.toFixed(1) ?? '—'}</TableCell>
                          <TableCell>{s.avgSleep?.toFixed(1) ?? '—'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum aluno neste nível.</p>
              )}
            </div>
          )}
        </DetailModal>

        {/* Class Averages Detail Modal */}
        <DetailModal
          title="Médias da Turma — Detalhamento"
          icon={Activity}
          open={classAvgModalOpen}
          onOpenChange={setClassAvgModalOpen}
        >
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Métrica</TableHead>
                  <TableHead>Média</TableHead>
                  <TableHead>Mediana</TableHead>
                  <TableHead>Mín</TableHead>
                  <TableHead>Máx</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {([
                  { key: 'mood' as const, label: '😊 Humor' },
                  { key: 'anxiety' as const, label: '😰 Ansiedade' },
                  { key: 'energy' as const, label: '⚡ Energia' },
                  { key: 'sleep' as const, label: '🌙 Sono' },
                ]).map(({ key, label }) => {
                  const detail = classAvgDetail[key];
                  return (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell>{detail?.avg.toFixed(1) ?? '—'}</TableCell>
                      <TableCell>{detail?.median.toFixed(1) ?? '—'}</TableCell>
                      <TableCell>{detail?.min.toFixed(1) ?? '—'}</TableCell>
                      <TableCell>{detail?.max.toFixed(1) ?? '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DetailModal>

        <TriageResolutionDialog
          open={!!resolveDialogTriage}
          onOpenChange={(open) => { if (!open) setResolveDialogTriage(null); }}
          studentLabel={resolveDialogTriage ? (patientNameMap.get(resolveDialogTriage.patient_id) || 'Aluno') : undefined}
          isSubmitting={updateTriageStatus.isPending}
          onConfirm={async ({ resolutionType, resolutionNotes }) => {
            if (!resolveDialogTriage) return;
            await updateTriageStatus.mutateAsync({
              triageId: resolveDialogTriage.id,
              status: 'resolved',
              resolvedAt: new Date().toISOString(),
              resolutionType,
              resolutionNotes,
              studentName: patientNameMap.get(resolveDialogTriage.patient_id) || '',
            });
            setResolveDialogTriage(null);
          }}
        />

        <TriageReopenDialog
          open={!!reopenDialogTriage}
          onOpenChange={(open) => { if (!open) setReopenDialogTriage(null); }}
          studentLabel={reopenDialogTriage ? (patientNameMap.get(reopenDialogTriage.patient_id) || 'Aluno') : undefined}
          isSubmitting={updateTriageStatus.isPending}
          onConfirm={async ({ reopenReason, reopenNotes }) => {
            if (!reopenDialogTriage) return;
            await updateTriageStatus.mutateAsync({
              triageId: reopenDialogTriage.id,
              status: 'triaged',
              reopenReason,
              reopenNotes,
              studentName: patientNameMap.get(reopenDialogTriage.patient_id) || '',
            });
            setReopenDialogTriage(null);
          }}
        />
      </div>
    </TooltipProvider>);

}