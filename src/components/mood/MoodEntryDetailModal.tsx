import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Moon, NotebookPen, Tag } from 'lucide-react';
import { parseISODateLocal } from '@/lib/utils';
import { getAllEmotions, getEmotionColor } from '@/utils/emotionFormatters';
import type { MoodEntry } from '@/hooks/useMoodEntries';
import { type MoodEntryAnalysis, RISK_LEVEL_META } from '@/hooks/useMoodEntryAnalyses';

interface Props {
  entry: MoodEntry | null;
  analysis?: MoodEntryAnalysis | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userConfigs?: Array<{ emotion_type: string; display_name?: string }>;
}

export function MoodEntryDetailModal({ entry, analysis, open, onOpenChange, userConfigs }: Props) {
  if (!entry) return null;

  const emotions = getAllEmotions(entry, userConfigs);
  const dateLabel = parseISODateLocal(entry.date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const riskMeta = analysis?.risk_level ? RISK_LEVEL_META[analysis.risk_level] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="capitalize">{dateLabel}</DialogTitle>
              <DialogDescription>Registro completo do diário emocional</DialogDescription>
            </div>
            {riskMeta && (
              <Badge variant="outline" className={riskMeta.badgeClass}>
                {riskMeta.emoji} {riskMeta.label}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Emoções */}
          {emotions.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-3">Emoções registradas</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {emotions.map((e) => {
                  const value = Math.round(e.value);
                  const pct = Math.min(100, Math.max(0, (e.value / 5) * 100));
                  return (
                    <div key={e.key} className="p-3 rounded-lg bg-muted/40 border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          <span className="mr-1">{e.emoji}</span>{e.name}
                        </span>
                        <span className="text-sm tabular-nums text-muted-foreground">{value}/5</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${getEmotionColor(e.value, 5)}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Sono */}
          {(entry.sleep_hours != null || entry.sleep_quality != null) && (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Moon className="h-4 w-4" /> Sono
              </h3>
              <div className="flex flex-wrap gap-2 text-sm">
                {entry.sleep_hours != null && (
                  <Badge variant="secondary">Horas: {entry.sleep_hours}h</Badge>
                )}
                {entry.sleep_quality != null && (
                  <Badge variant="secondary">Qualidade: {Math.round(entry.sleep_quality)}/5</Badge>
                )}
              </div>
            </section>
          )}

          {/* Diário */}
          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <NotebookPen className="h-4 w-4" /> Anotações
            </h3>
            {entry.journal_text ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-lg p-3 border">
                {entry.journal_text}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sem anotações nesta entrada.</p>
            )}
          </section>

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" /> Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((t) => (
                  <Badge key={t} variant="outline">{t}</Badge>
                ))}
              </div>
            </section>
          )}

          {/* Análise IA */}
          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Análise da IA
            </h3>
            {analysis ? (
              <div className="space-y-2">
                {riskMeta && (
                  <div className="text-sm">
                    Nível de risco:{' '}
                    <Badge variant="outline" className={riskMeta.badgeClass}>
                      {riskMeta.emoji} {riskMeta.label}
                    </Badge>
                  </div>
                )}
                {analysis.buddy_message ? (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {analysis.buddy_message}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem mensagem da IA para esta entrada.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Análise ainda não disponível para esta entrada.
              </p>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
