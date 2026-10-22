import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NotebookPen, Layers, Flame, ClipboardCheck, Clock, CheckCircle2, ChevronRight, ChevronDown } from 'lucide-react';
import type { TriageView } from '@/components/institution/StudentTriageTab';

export interface FunnelCounts {
  total: number;
  withData: number;
  atRisk: number;
  alert: number;
  attention: number;
  healthy: number;
  priorities: number;
  pending: number;
  inFollowUp: number;
  overdue: number;
  resolved: number;
}

export function TriageFunnel({ counts, onNavigate, open, onOpenChange }: {
  counts: FunnelCounts;
  onNavigate: (v: TriageView, p?: { risk?: string; tab?: string }) => void;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const steps = [
    { n: 1, icon: NotebookPen, title: 'Registros do diário', value: `${counts.withData} de ${counts.total}`, unit: 'alunos registraram',
      text: 'Tudo começa no Diário Emocional: humor, ansiedade, energia, sono e palavras críticas no período analisado.', cta: 'Ver sem registros', go: () => onNavigate('fila', { risk: 'no_data', tab: 'para_triar' }) },
    { n: 2, icon: Layers, title: 'Classificação por risco', value: `${counts.atRisk + counts.alert + counts.attention}`, unit: 'precisam de atenção',
      text: `Cada aluno recebe um nível: Em Risco (${counts.atRisk}), Alerta (${counts.alert}), Atenção (${counts.attention}) ou Estável (${counts.healthy}).`, cta: 'Ver Em Risco', go: () => onNavigate('fila', { risk: 'critical', tab: 'para_triar' }) },
    { n: 3, icon: Flame, title: 'Prioridades', value: `${counts.priorities}`, unit: 'mais urgentes',
      text: 'Quem atender primeiro: termo grave no diário, Em Risco sem triagem, follow-up vencido e humor em queda.', cta: 'Ver prioridades', go: () => onNavigate('prioridades') },
    { n: 4, icon: ClipboardCheck, title: 'Triagem', value: `${counts.pending}`, unit: 'aguardando triagem',
      text: 'A equipe faz a primeira avaliação e escolhe uma ação: conversar, encaminhar, monitorar ou contatar a família.', cta: 'Abrir fila', go: () => onNavigate('fila', { tab: 'para_triar' }) },
    { n: 5, icon: Clock, title: 'Follow-up', value: `${counts.inFollowUp}`, unit: counts.overdue ? `em acompanhamento · ${counts.overdue} vencidos` : 'em acompanhamento',
      text: 'Uma data combinada para retomar o contato. Se a data passa sem retorno, o follow-up fica vencido.', cta: 'Ver follow-ups', go: () => onNavigate('followups') },
    { n: 6, icon: CheckCircle2, title: 'Resolução', value: `${counts.resolved}`, unit: 'casos resolvidos',
      text: 'O caso é encerrado com um registro de como terminou. Pode ser reaberto se o aluno voltar a precisar.', cta: 'Ver concluídos', go: () => onNavigate('fila', { tab: 'concluidos' }) },
  ];
  const max = Math.max(1, counts.total);
  const widths = [counts.withData, counts.atRisk + counts.alert + counts.attention, counts.priorities, counts.pending, counts.inFollowUp, counts.resolved]
    .map((v) => Math.max(6, Math.round((v / max) * 100)));

  return (
    <Card>
      <CardHeader className="cursor-pointer pb-3" onClick={() => onOpenChange(!open)}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Como funciona a triagem</CardTitle>
            <CardDescription>O caminho de cada aluno, do registro no diário até a resolução do caso.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" aria-expanded={open}>
            {open ? 'Recolher' : 'Ver infográfico'}<ChevronDown className={`ml-1 h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-6">
          <ol className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.n} className="relative flex flex-col rounded-xl border bg-card p-4">
                  {i < steps.length - 1 && (
                    <ChevronRight className="absolute -right-3 top-8 z-10 hidden h-5 w-5 rounded-full bg-background text-primary xl:block" aria-hidden />
                  )}
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{s.n}</span>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">{s.title}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.unit}</p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${widths[i]}%`, opacity: 1 - i * 0.12 }} />
                  </div>
                  <p className="mt-3 flex-1 text-xs leading-relaxed text-muted-foreground">{s.text}</p>
                  <Button variant="link" size="sm" className="mt-2 h-auto justify-start p-0 text-xs" onClick={s.go}>{s.cta}<ChevronRight className="ml-0.5 h-3 w-3" /></Button>
                </li>
              );
            })}
          </ol>
          <div className="grid gap-3 rounded-lg bg-muted/50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <p><strong>Triar:</strong> fazer a primeira avaliação do aluno e escolher uma ação.</p>
            <p><strong>Follow-up:</strong> a data combinada para retomar o contato.</p>
            <p><strong>Vencido:</strong> quando essa data já passou sem retorno.</p>
            <p><strong>Resolvido:</strong> o caso foi encerrado, com registro do desfecho.</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
