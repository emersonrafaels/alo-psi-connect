import { useMemo, useState } from 'react';
import { LoadingBar, LoadingSection, LoadingCards } from "@/components/ui/loading-bar";
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookOpen, Compass, Leaf, ClipboardList, Users, Activity } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

type Kind = 'mood' | 'journey' | 'practice' | 'scale' | 'group';
interface TimelineItem { id: string; kind: Kind; occurred_at: string; title: string; detail: string | null; level: string | null }

const KIND_META: Record<Kind, { label: string; icon: typeof Activity }> = {
  mood: { label: 'Diário', icon: BookOpen },
  journey: { label: 'Jornadas', icon: Compass },
  practice: { label: 'Práticas', icon: Leaf },
  scale: { label: 'Escalas', icon: ClipboardList },
  group: { label: 'Encontros', icon: Users },
};

const RISK_LABEL: Record<string, string> = { healthy: 'Estável', attention: 'Atenção', alert: 'Alerta', critical: 'Crítico' };

const prettify = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

interface Props { open: boolean; onOpenChange: (o: boolean) => void; institutionId?: string; patientId: string; studentName: string }

export function StudentTimelineModal({ open, onOpenChange, institutionId, patientId, studentName }: Props) {
  const [filter, setFilter] = useState<Kind | 'all'>('all');
  const [limit, setLimit] = useState(30);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['student-timeline', institutionId, patientId],
    enabled: open && !!institutionId,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_institution_student_timeline', {
        _institution_id: institutionId, _patient_id: patientId, _days: 90,
      });
      if (error) throw error;
      return (data ?? []) as TimelineItem[];
    },
  });

  const counts = useMemo(() => data.reduce<Record<string, number>>((acc, i) => ((acc[i.kind] = (acc[i.kind] ?? 0) + 1), acc), {}), [data]);
  const items = filter === 'all' ? data : data.filter((i) => i.kind === filter);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de atividades · {studentName}</DialogTitle>
          <DialogDescription>Últimos 90 dias. Apenas datas e indicadores — nenhum texto pessoal é exibido.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>Todas ({data.length})</Button>
          {(Object.keys(KIND_META) as Kind[]).map((k) => (
            <Button key={k} size="sm" variant={filter === k ? 'default' : 'outline'} onClick={() => setFilter(k)} disabled={!counts[k]}>
              {KIND_META[k].label} ({counts[k] ?? 0})
            </Button>
          ))}
        </div>

        {isLoading ? (
          <LoadingBar className="py-8" label="Carregando histórico..." />
        ) : error ? (
          <p className="py-8 text-center text-sm text-destructive">Não foi possível carregar o histórico.</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma atividade registrada nos últimos 90 dias.</p>
        ) : (
          <ol className="relative border-l border-border ml-3 space-y-4">
            {items.slice(0, limit).map((item) => {
              const Icon = KIND_META[item.kind]?.icon ?? Activity;
              return (
                <li key={item.id} className="ml-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 ring-4 ring-background">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <div className="rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{item.title}</p>
                      <time className="text-xs text-muted-foreground">{format(new Date(item.occurred_at), "dd/MM/yyyy", { locale: ptBR })}</time>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px]">{KIND_META[item.kind]?.label}</Badge>
                      {item.detail && <span>{item.kind === 'journey' || item.kind === 'scale' ? prettify(item.detail) : item.detail}</span>}
                      {item.kind === 'mood' && item.level && RISK_LABEL[item.level] && <Badge variant="outline" className="text-[10px]">{RISK_LABEL[item.level]}</Badge>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {items.length > limit && (
          <Button variant="outline" className="w-full" onClick={() => setLimit((l) => l + 30)}>Carregar mais</Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
