import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Users, FileText, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

export type WellbeingMetricType = 'participants' | 'entries' | 'trend' | 'alerts';

interface Props {
  type: WellbeingMetricType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: any;
  periodDays: number;
  onNavigateToTriage?: () => void;
}

const trendLabel = (t: 'up' | 'down' | 'stable') =>
  t === 'up' ? 'Em melhora' : t === 'down' ? 'Em queda' : 'Estável';

const trendIcon = (t: 'up' | 'down' | 'stable') =>
  t === 'up' ? <TrendingUp className="h-5 w-5 text-green-500" />
    : t === 'down' ? <TrendingDown className="h-5 w-5 text-red-500" />
    : <Minus className="h-5 w-5 text-muted-foreground" />;

export const WellbeingMetricDialog = ({ type, open, onOpenChange, metrics, periodDays, onNavigateToTriage }: Props) => {
  if (!type || !metrics) return null;

  const periodLabel = periodDays >= 9999 ? 'em todo o período' : `nos últimos ${periodDays} dias`;

  const renderContent = () => {
    switch (type) {
      case 'participants': {
        const total = metrics.totalStudentsLinked || 0;
        const active = metrics.students_with_entries || 0;
        const rate = total > 0 ? (active / total) * 100 : 0;
        return {
          icon: <Users className="h-5 w-5 text-blue-500" />,
          title: 'Participantes',
          description: `Alunos que registraram ao menos um diário emocional ${periodLabel}.`,
          body: (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Ativos no período" value={active.toString()} />
                <Stat label="Total vinculados" value={total.toString()} />
                <Stat label="Taxa de participação" value={`${rate.toFixed(0)}%`} />
                <Stat label="Sem registros" value={Math.max(total - active, 0).toString()} />
              </div>
              <p className="text-muted-foreground text-xs">
                Os alunos não são identificados aqui para preservar a privacidade. Para acompanhar casos individuais, use a aba <strong>Triagem</strong>.
              </p>
            </div>
          ),
        };
      }
      case 'entries': {
        const totalEntries = metrics.total_entries || 0;
        const active = metrics.students_with_entries || 0;
        const daily = metrics.daily_entries || [];
        const perStudent = active > 0 ? totalEntries / active : 0;
        const perDay = daily.length > 0 ? totalEntries / daily.length : 0;
        const topDays = [...daily].sort((a: any, b: any) => b.entries_count - a.entries_count).slice(0, 5);
        return {
          icon: <FileText className="h-5 w-5 text-purple-500" />,
          title: 'Registros',
          description: `Diários emocionais preenchidos ${periodLabel}.`,
          body: (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Total" value={totalEntries.toString()} />
                <Stat label="Por aluno" value={perStudent.toFixed(1)} />
                <Stat label="Por dia" value={perDay.toFixed(1)} />
              </div>
              {topDays.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Dias com mais registros</p>
                  <div className="rounded-md border divide-y">
                    {topDays.map((d: any) => (
                      <div key={d.date} className="flex justify-between px-3 py-2">
                        <span>{new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' })}</span>
                        <span className="font-medium">{d.entries_count} registro{d.entries_count > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ),
        };
      }
      case 'trend': {
        const cmp = metrics.period_comparison || { current_avg: 0, previous_avg: 0, change_percent: 0 };
        const t = metrics.mood_trend as 'up' | 'down' | 'stable';
        return {
          icon: trendIcon(t),
          title: `Tendência: ${trendLabel(t)}`,
          description: 'Comparação entre a primeira e a segunda metade do período selecionado.',
          body: (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Média anterior" value={`${cmp.previous_avg}/5`} />
                <Stat label="Média atual" value={`${cmp.current_avg}/5`} />
                <Stat label="Variação" value={`${cmp.change_percent > 0 ? '+' : ''}${cmp.change_percent}%`} />
              </div>
              <p className="text-muted-foreground text-xs">
                {t === 'up' && 'A média de humor na segunda metade do período foi maior que na primeira — indicador de melhora.'}
                {t === 'down' && 'A média de humor caiu entre a primeira e a segunda metade do período — vale investigar contextos e eventos que podem ter influenciado.'}
                {t === 'stable' && 'A média de humor manteve-se estável entre as duas metades do período.'}
              </p>
            </div>
          ),
        };
      }
      case 'alerts': {
        const count = metrics.students_with_low_mood || 0;
        const active = metrics.students_with_entries || 0;
        const pct = active > 0 ? (count / active) * 100 : 0;
        return {
          icon: <AlertTriangle className={`h-5 w-5 ${count > 0 ? 'text-orange-500' : 'text-green-500'}`} />,
          title: 'Alertas',
          description: 'Alunos com humor médio abaixo de 3 (numa escala de 1 a 5) no período.',
          body: (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Alunos em alerta" value={count.toString()} />
                <Stat label="% dos ativos" value={`${pct.toFixed(0)}%`} />
              </div>
              <p className="text-muted-foreground text-xs">
                Critério: humor médio &lt; 3 no período. Esses alunos podem se beneficiar de acolhimento, escuta ativa ou encaminhamento.
              </p>
              {onNavigateToTriage && count > 0 && (
                <Button onClick={() => { onNavigateToTriage(); onOpenChange(false); }} className="w-full">
                  Ver Triagem
                </Button>
              )}
            </div>
          ),
        };
      }
    }
  };

  const content = renderContent();
  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{content.icon}{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>
        {content.body}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border bg-muted/30 p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);
