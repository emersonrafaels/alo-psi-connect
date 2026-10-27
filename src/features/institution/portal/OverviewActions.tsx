import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, ListChecks } from 'lucide-react';
import type { ActionLevel, ActionTarget, OverviewAction } from './overviewActions';

const LEVEL: Record<ActionLevel, { label: string; cls: string; bar: string }> = {
  urgent: { label: 'Urgente', cls: 'bg-destructive/10 text-destructive', bar: 'bg-destructive' },
  important: { label: 'Importante', cls: 'bg-accent text-accent-foreground', bar: 'bg-accent-foreground/60' },
  suggestion: { label: 'Sugestão', cls: 'bg-primary/10 text-primary', bar: 'bg-primary/60' },
};

export function OverviewActions({ actions, onAction }: { actions: OverviewAction[]; onAction: (t: ActionTarget) => void }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" /> O que fazer agora
        </CardTitle>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" /> Tudo em dia — nenhuma ação pendente agora.
          </p>
        ) : (
          <ol className="space-y-2">
            {actions.map((a) => {
              const l = LEVEL[a.level];
              return (
                <li key={a.id} className="relative flex flex-col gap-3 overflow-hidden rounded-lg border border-border/60 bg-card p-3 pl-4 sm:flex-row sm:items-center">
                  <span className={`absolute inset-y-0 left-0 w-1 ${l.bar}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${l.cls}`}>{l.label}</span>
                      <p className="text-sm font-semibold">{a.title}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{a.reason}</p>
                  </div>
                  <Button size="sm" variant={a.level === 'urgent' ? 'default' : 'outline'} onClick={() => onAction(a.target)}>
                    {a.cta} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
