import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudentActivityData, MoodEntry, TopEmotion, StudentTriageHistory } from '@/hooks/useStudentActivityData';
import { RiskLevel } from '@/hooks/useStudentTriage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, Brain, Zap, Moon, BookOpen, ClipboardCheck, Heart, AlertTriangle, CheckCircle2, Play, Clock } from 'lucide-react';

interface StudentActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  profileId: string | null;
  patientId: string | null;
  institutionId: string;
  riskLevel: RiskLevel;
  entryCount: number;
}

const riskColors: Record<RiskLevel, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  alert: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  attention: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  healthy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  no_data: 'bg-muted text-muted-foreground',
};

const riskLabels: Record<RiskLevel, string> = {
  critical: 'Crítico',
  alert: 'Alerta',
  attention: 'Atenção',
  healthy: 'Saudável',
  no_data: 'Sem Dados',
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

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  triaged: { label: 'Triado', icon: ClipboardCheck, color: 'text-blue-600' },
  in_progress: { label: 'Em andamento', icon: Play, color: 'text-yellow-600' },
  resolved: { label: 'Resolvido', icon: CheckCircle2, color: 'text-green-600' },
};

function MoodScoreDisplay({ value, label, icon: Icon }: { value: number | null; label: string; icon: typeof Activity }) {
  if (value === null) return null;
  const color = value <= 2 ? 'text-red-500' : value <= 3 ? 'text-yellow-500' : 'text-green-500';
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-semibold ${color}`}>{value.toFixed(1)}</span>
    </div>
  );
}

function EmotionDiaryTab({ entries, topEmotions }: { entries: MoodEntry[]; topEmotions: TopEmotion[] }) {
  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
        Nenhum registro emocional nos últimos 30 dias.
      </div>
    );
  }

  // Sparkline
  const moodData = entries.filter(e => e.mood_score != null).reverse().map(e => e.mood_score!);
  const sparkWidth = 200;
  const sparkHeight = 40;
  const sparkPoints = moodData.length >= 2
    ? moodData.map((v, i) => `${(i / (moodData.length - 1)) * sparkWidth},${sparkHeight - ((v - 1) / 4) * sparkHeight}`).join(' ')
    : null;
  const lastMood = moodData.length > 0 ? moodData[moodData.length - 1] : 3;
  const sparkColor = lastMood <= 2 ? '#ef4444' : lastMood <= 3 ? '#eab308' : '#22c55e';

  return (
    <div className="space-y-4">
      {/* Top Emotions */}
      {topEmotions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Sentimentos predominantes</p>
          <div className="flex flex-wrap gap-2">
            {topEmotions.map(e => (
              <Badge key={e.emotion} variant="secondary" className="text-xs capitalize">
                {e.emotion} ({e.count})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Mood Sparkline */}
      {sparkPoints && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Evolução do humor (30 dias)</p>
          <svg width={sparkWidth} height={sparkHeight} className="w-full max-w-[200px]">
            <polyline points={sparkPoints} fill="none" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Entries list */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Registros recentes</p>
        <div className="space-y-2">
          {entries.slice(0, 14).map(entry => (
            <div key={entry.id} className="p-3 rounded-lg border bg-muted/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{format(new Date(entry.date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <MoodScoreDisplay value={entry.mood_score} label="Humor" icon={Activity} />
                <MoodScoreDisplay value={entry.anxiety_level} label="Ansiedade" icon={Brain} />
                <MoodScoreDisplay value={entry.energy_level} label="Energia" icon={Zap} />
                <MoodScoreDisplay value={entry.sleep_quality} label="Sono" icon={Moon} />
              </div>
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                  ))}
                </div>
              )}
              {entry.journal_text && (
                <p className="text-xs text-muted-foreground italic line-clamp-2">"{entry.journal_text}"</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TriageHistoryTab({ history }: { history: StudentTriageHistory[] }) {
  if (history.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
        Nenhuma triagem registrada para este aluno.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((t, idx) => {
        const config = statusConfig[t.status] || statusConfig.triaged;
        const StatusIcon = config.icon;

        return (
          <div key={t.id} className="relative">
            {/* Timeline connector */}
            {idx < history.length - 1 && (
              <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-border" />
            )}
            <div className="flex gap-3">
              <div className={`mt-1 shrink-0 ${config.color}`}>
                <StatusIcon className="h-6 w-6" />
              </div>
              <div className="flex-1 p-3 rounded-lg border bg-muted/20 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="text-xs">{priorityLabels[t.priority] || t.priority}</Badge>
                  <Badge variant="secondary" className="text-xs">{config.label}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(t.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {t.recommended_action && (
                  <p className="text-xs"><span className="text-muted-foreground">Ação:</span> {actionLabels[t.recommended_action] || t.recommended_action}</p>
                )}
                {t.notes && <p className="text-xs text-muted-foreground italic">"{t.notes}"</p>}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {t.triaged_by_name && <span>por {t.triaged_by_name}</span>}
                  {t.follow_up_date && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Acompanhamento: {format(new Date(t.follow_up_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                  {t.resolved_at && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Resolvido em {format(new Date(t.resolved_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StudentActivityModal({
  open,
  onOpenChange,
  studentName,
  profileId,
  patientId,
  institutionId,
  riskLevel,
  entryCount,
}: StudentActivityModalProps) {
  const { data, isLoading } = useStudentActivityData(profileId, patientId, institutionId, open);

  const initials = studentName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={`text-sm font-semibold ${riskColors[riskLevel]}`}>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-lg">{studentName}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs ${riskColors[riskLevel]}`}>{riskLabels[riskLevel]}</Badge>
                <span className="text-xs text-muted-foreground">{entryCount} registros (14 dias)</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="diario" className="flex-1 min-h-0">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="diario" className="gap-1.5 text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              Diário Emocional
            </TabsTrigger>
            <TabsTrigger value="triagens" className="gap-1.5 text-xs">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Histórico de Triagens
            </TabsTrigger>
          </TabsList>

          <div className="mt-3 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Carregando...</div>
            ) : (
              <>
                <TabsContent value="diario" className="mt-0">
                  <EmotionDiaryTab entries={data?.moodEntries || []} topEmotions={data?.topEmotions || []} />
                </TabsContent>
                <TabsContent value="triagens" className="mt-0">
                  <TriageHistoryTab history={data?.triageHistory || []} />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
