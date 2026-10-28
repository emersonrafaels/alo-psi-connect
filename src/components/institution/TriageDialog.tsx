import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Activity, AlertTriangle, BookOpen, Brain, ChevronDown, Eye, FileText, History, MessageCircle, Moon, Stethoscope, TrendingDown, TrendingUp, Users, Zap } from 'lucide-react';
import { StudentRiskData, TriageRecord } from '@/hooks/useStudentTriage';
import { toast } from 'sonner';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { METRIC_KEYS, METRIC_LABEL, metricBand, metricValue, riskReasons, type Band, type MetricKey } from '@/features/triage/queue/indicators';
import { ACTION_META, PRIORITY_META, followUpDate, suggestPlan, type TriageAction, type TriagePriority } from '@/features/triage/triagePlan';
import { applyTemplate, getTemplatesForRisk } from '@/lib/triageNoteTemplates';

interface TriageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentRiskData | null;
  studentHistory?: TriageRecord[];
  /** Period the student's indicators were computed over. */
  periodDays: number;
  onSubmit: (data: {
    patientId: string;
    riskLevel: string;
    priority: string;
    recommendedAction: string;
    notes: string;
    followUpDate?: string;
  }) => Promise<void>;
}

const riskLabels: Record<string, { label: string; color: string; border: string }> = {
  critical: { label: 'Sinal elevado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', border: 'border-l-red-500' },
  alert: { label: 'Alerta', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', border: 'border-l-orange-500' },
  attention: { label: 'Atenção', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', border: 'border-l-yellow-500' },
  healthy: { label: 'Sem sinais prioritários', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', border: 'border-l-green-500' },
  no_data: { label: 'Dados insuficientes', color: 'bg-muted text-muted-foreground', border: 'border-l-muted-foreground/30' },
};

const statusLabels: Record<string, string> = {
  triaged: 'Triado',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
};

const BAND_TEXT: Record<Band, string> = {
  critical: 'text-red-600 dark:text-red-400',
  alert: 'text-orange-600 dark:text-orange-400',
  attention: 'text-yellow-700 dark:text-yellow-400',
  healthy: 'text-foreground',
};
const METRIC_ICON: Record<MetricKey, typeof Activity> = { mood: Activity, anxiety: Brain, energy: Zap, sleep: Moon };
const ACTION_ICON: Record<TriageAction, typeof Activity> = { refer_professional: Stethoscope, schedule_talk: MessageCircle, monitor: Eye, contact_family: Users };
const PRIORITIES = Object.keys(PRIORITY_META) as TriagePriority[];
const ACTIONS = Object.keys(ACTION_META) as TriageAction[];
const FOLLOW_UP_SHORTCUTS: { days: number; label: string }[] = [
  { days: 1, label: 'Amanhã' }, { days: 7, label: '7 dias' }, { days: 14, label: '14 dias' }, { days: 30, label: '30 dias' },
];

/** Selectable card backed by a native radio, so arrow keys and screen readers work as in any radio group. */
const optionCard =
  'relative flex cursor-pointer gap-2.5 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-1 has-[:checked]:ring-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring';

function SuggestedTag() {
  return <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Sugerido</span>;
}

export function TriageDialog({ open, onOpenChange, student, studentHistory = [], periodDays, onSubmit }: TriageDialogProps) {
  const [priority, setPriority] = useState<TriagePriority>('medium');
  const [action, setAction] = useState<TriageAction>('monitor');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [followUpTouched, setFollowUpTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const suggestion = student ? suggestPlan(student.riskLevel, student.criticalKeywordFlag?.severity) : null;

  // Start from a plan that matches the student's risk; every field stays editable.
  // Reset only when the dialog opens for a student: the parent passes a fresh object on every render,
  // and a background refetch must not wipe what the team is typing.
  useEffect(() => {
    if (!open || !student) return;
    const plan = suggestPlan(student.riskLevel, student.criticalKeywordFlag?.severity);
    setPriority(plan.priority);
    setAction(plan.action);
    setFollowUp(followUpDate(plan.followUpDays));
    setFollowUpTouched(false);
    setNotes('');
    setHistoryOpen(false);
  }, [open, student?.patientId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!student || !suggestion) return null;

  const risk = riskLabels[student.riskLevel];
  const reasons = riskReasons(student);
  const templates = getTemplatesForRisk(student.riskLevel);
  const recentHistory = studentHistory.slice(0, 5);
  const engagement = periodDays > 0 ? Math.min(1, student.entryCount / periodDays) : 0;

  const changePriority = (p: TriagePriority) => {
    setPriority(p);
    // Keep the follow-up in step with the priority until the team picks a date themselves.
    if (!followUpTouched) setFollowUp(followUpDate(PRIORITY_META[p].followUpDays));
  };
  const pickFollowUp = (value: string) => { setFollowUp(value); setFollowUpTouched(true); };

  const followUpText = (() => {
    if (!followUp) return 'Sem data de acompanhamento';
    const date = parseISO(followUp);
    const diff = differenceInCalendarDays(date, new Date());
    const relative = diff === 0 ? 'hoje' : diff === 1 ? 'amanhã' : `em ${diff} dias`;
    return `${format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })} · ${relative}`;
  })();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        patientId: student.patientId,
        riskLevel: student.riskLevel,
        priority,
        recommendedAction: action,
        notes: notes.trim(),
        followUpDate: followUp || undefined,
      });
      toast.success(`${student.studentName} triado`, { description: 'Movido para “Em andamento”.' });
      onOpenChange(false);
    } catch {
      toast.error('Erro ao registrar triagem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] max-w-2xl flex-col gap-0 p-0"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isSubmitting) { e.preventDefault(); void handleSubmit(); }
        }}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b py-4 pl-6 pr-12 text-left">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-lg">
            Triar {student.studentName}
            <Badge className={`${risk.color} text-xs`}>{risk.label}</Badge>
          </DialogTitle>
          <DialogDescription>Defina a prioridade, o que a equipe vai fazer e quando acompanhar.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* Why this student is here */}
          <section className={`space-y-3 rounded-lg border border-l-4 ${risk.border} bg-muted/30 p-4`} aria-label="Resumo do aluno">
            {student.criticalKeywordFlag && (
              <p className={`flex items-center gap-1.5 text-sm font-medium ${student.criticalKeywordFlag.severity === 'grave' ? 'text-red-700 dark:text-red-400' : 'text-orange-700 dark:text-orange-400'}`}>
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {student.criticalKeywordFlag.severity === 'grave' ? 'Sinal textual sensível' : 'Sinal textual sensível'} · revisão pendente ·  {student.criticalKeywordFlag.hits} registro(s)
                <span className="font-normal text-muted-foreground">· o texto do aluno não é exibido</span>
              </p>
            )}
            {reasons.length > 0 && <p className="text-sm font-medium">{reasons.join(' · ')}</p>}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
              {METRIC_KEYS.map((key) => {
                const value = metricValue(student, key);
                const Icon = METRIC_ICON[key];
                return (
                  <div key={key} className="rounded-md bg-background px-3 py-2">
                    <dt className="flex items-center gap-1 text-[11px] text-muted-foreground"><Icon className="h-3 w-3" />{METRIC_LABEL[key]}</dt>
                    <dd className={`text-lg font-semibold tabular-nums ${value != null ? BAND_TEXT[metricBand(value, key)] : 'text-muted-foreground'}`}>
                      {value != null ? value.toFixed(1) : '—'}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" />Diário em {student.entryCount} de {periodDays} dias ({Math.round(engagement * 100)}%)</span>
              {student.moodTrend != null && (
                <span className={`inline-flex items-center gap-1 ${student.moodTrend <= -20 ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {student.moodTrend < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}Humor {student.moodTrend > 0 ? '+' : ''}{student.moodTrend}% no período
                </span>
              )}
              <span>Médias de 1 a 5 nos últimos {periodDays} dias</span>
            </div>

            {recentHistory.length > 0 && (
              <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border-t pt-3 text-xs font-medium text-muted-foreground hover:text-foreground">
                  <span className="flex items-center gap-1.5"><History className="h-3.5 w-3.5" />Triagens anteriores ({recentHistory.length})</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="mt-2 space-y-2">
                    {recentHistory.map((t) => (
                      <li key={t.id} className="space-y-1 rounded-md bg-background p-2.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">
                            {format(new Date(t.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            {t.triaged_by_name && ` · por ${t.triaged_by_name}`}
                          </span>
                          <Badge variant={t.status === 'resolved' ? 'secondary' : 'default'} className="text-[10px]">{statusLabels[t.status] || t.status}</Badge>
                        </div>
                        <p className="text-muted-foreground">
                          {PRIORITY_META[t.priority as TriagePriority]?.label ?? t.priority}
                          {t.recommended_action && ` · ${ACTION_META[t.recommended_action as TriageAction]?.label ?? t.recommended_action}`}
                        </p>
                        {t.notes && <p className="whitespace-pre-line italic text-muted-foreground">“{t.notes}”</p>}
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            )}
          </section>

          {/* 1. Priority */}
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">1. Prioridade</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRIORITIES.map((p) => (
                <label key={p} className={`${optionCard} flex-col`}>
                  <input type="radio" name="triage-priority" value={p} checked={priority === p} onChange={() => changePriority(p)} className="sr-only" />
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <span className={`h-2 w-2 rounded-full ${PRIORITY_META[p].dot}`} />{PRIORITY_META[p].label}
                    {suggestion.priority === p && <SuggestedTag />}
                  </span>
                  <span className="text-[11px] leading-snug text-muted-foreground">{PRIORITY_META[p].hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* 2. Action */}
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">2. Ação recomendada</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {ACTIONS.map((a) => {
                const Icon = ACTION_ICON[a];
                return (
                  <label key={a} className={`${optionCard} items-start`}>
                    <input type="radio" name="triage-action" value={a} checked={action === a} onChange={() => setAction(a)} className="sr-only" />
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        {ACTION_META[a].label}
                        {suggestion.action === a && <SuggestedTag />}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">{ACTION_META[a].hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* 3. Follow-up */}
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">3. Próximo acompanhamento</legend>
            <div className="flex flex-wrap items-center gap-2">
              {FOLLOW_UP_SHORTCUTS.map(({ days, label }) => {
                const value = followUpDate(days);
                const active = followUp === value;
                return (
                  <Button key={days} type="button" size="sm" variant={active ? 'default' : 'outline'} className="h-8" onClick={() => pickFollowUp(value)} aria-pressed={active}>
                    {label}
                  </Button>
                );
              })}
              <Input
                type="date"
                value={followUp}
                onChange={(e) => pickFollowUp(e.target.value)}
                min={followUpDate(0)}
                className="h-8 w-[150px]"
                aria-label="Data do próximo acompanhamento"
              />
              {followUp && (
                <Button type="button" size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={() => pickFollowUp('')}>
                  Sem data
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground first-letter:uppercase">{followUpText}</p>
          </fieldset>

          {/* 4. Notes */}
          <div className="space-y-2">
            <Label htmlFor="triage-notes" className="text-sm font-semibold">4. Observações <span className="font-normal text-muted-foreground">(opcional)</span></Label>
            {templates.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {templates.map((t) => {
                  const used = notes.includes(t.content);
                  return (
                    <Button
                      key={t.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs"
                      disabled={used}
                      title={t.content}
                      onClick={() => setNotes(applyTemplate(notes, t, reasons))}
                    >
                      <FileText className="h-3 w-3" />{t.label}
                    </Button>
                  );
                })}
              </div>
            )}
            <Textarea
              id="triage-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que foi observado, combinado ou encaminhado. Use um modelo acima para começar."
              rows={4}
              className="text-sm leading-relaxed"
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">O aluno sai de “Para triar” e passa para “Em andamento”.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} title="Ctrl+Enter">
              {isSubmitting ? 'Salvando…' : 'Registrar triagem'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
