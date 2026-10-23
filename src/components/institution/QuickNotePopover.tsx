import { useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, FileText, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { applyTemplate, getTemplatesForRisk, riskLevelLabel, type TriageNoteTemplate } from '@/lib/triageNoteTemplates';

export interface QuickNoteHistoryItem {
  id: string;
  note: string;
  created_at: string;
  author_name?: string;
  risk_level: string | null;
}

interface QuickNotePopoverProps {
  /** Previous notes for this student, newest first. */
  history?: QuickNoteHistoryItem[];
  onSave: (note: string) => Promise<void>;
  riskLevel?: string | null;
  /** Anonymized label shown in the header, e.g. "Aluno #52". */
  subjectName?: string;
  /** Why the student is in the queue; opens the note when a template is used on an empty note. */
  reasons?: string[];
}

/** A placeholder to replace ("(canal e horário)") or a field left open at the end of a line ("Combinado com o aluno: "). */
const BLANK = /\([^)\n]+\)|[:?] $/m;

export function QuickNotePopover({ onSave, history = [], riskLevel, subjectName, reasons = [] }: QuickNotePopoverProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const templates = getTemplatesForRisk(riskLevel);

  const handleSave = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await onSave(note.trim());
      setNote('');
      toast.success('Nota salva no histórico');
    } catch (err) {
      console.error('Erro ao salvar nota', err);
      toast.error('Não foi possível salvar a nota. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const insertTemplate = (template: TriageNoteTemplate) => {
    const next = applyTemplate(note, template, reasons);
    setNote(next);
    // Put the cursor on the first thing left to fill in, so the template is completed rather than saved as is.
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      const start = next.lastIndexOf(template.content);
      const match = start >= 0 ? BLANK.exec(template.content) : null;
      el.focus();
      if (!match) {
        el.setSelectionRange(next.length, next.length);
      } else if (match[0].startsWith('(')) {
        el.setSelectionRange(start + match.index, start + match.index + match[0].length);
      } else {
        const end = start + match.index + match[0].length;
        el.setSelectionRange(end, end);
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Nota rápida">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent className="text-xs">Nota rápida</TooltipContent>
      </Tooltip>
      {/*
        Opens beside the pencil instead of above/below it: rows near the bottom of the screen left too little
        room vertically and the top of the popover was cut off. The height is capped to the space Radix reports,
        and only the middle scrolls, so the header and the save button stay visible. The top padding clears the
        page's sticky header.
      */}
      <PopoverContent
        side="left"
        align="center"
        sideOffset={8}
        collisionPadding={{ top: 72, bottom: 16, left: 16, right: 16 }}
        className="flex max-h-[var(--radix-popover-content-available-height)] w-[420px] max-w-[calc(100vw-2rem)] flex-col p-0"
      >
        <div className="shrink-0 border-b px-4 py-3">
          <p className="text-sm font-semibold">Nota rápida{subjectName ? ` · ${subjectName}` : ''}</p>
          <p className="text-xs text-muted-foreground">Anotação interna da instituição. Não conta como triagem: o aluno continua na fila.</p>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {templates.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Modelos para {riskLevelLabel(riskLevel)}
              </p>
              <div className="grid gap-1.5">
                {templates.map((t) => {
                  const used = note.includes(t.content);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => insertTemplate(t)}
                      disabled={used}
                      title={t.content}
                      className="group flex items-center gap-2.5 rounded-md border px-2.5 py-1.5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:border-primary/40 disabled:bg-primary/5"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium">{t.label}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{t.summary}</span>
                      </span>
                      {used
                        ? <Check className="h-4 w-4 shrink-0 text-primary" aria-label="Adicionado" />
                        : <Plus className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <Textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void handleSave(); }
            }}
            placeholder={templates.length > 0 ? 'Escreva a observação ou comece por um modelo acima…' : 'Adicionar observação…'}
            rows={6}
            className="min-h-[120px] text-sm leading-relaxed"
            aria-label="Nota"
          />

          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Histórico de notas ({history.length})
            </p>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma nota registrada ainda.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((h) => (
                  <li key={h.id} className="rounded-md border bg-muted/40 px-2.5 py-2">
                    <p className="mb-1 text-[11px] text-muted-foreground">
                      {new Date(h.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      {h.author_name ? ` · ${h.author_name}` : ''}
                      {h.risk_level ? ` · ${riskLevelLabel(h.risk_level)}` : ''}
                    </p>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed">{h.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t px-4 py-3">
          <span className="text-[11px] text-muted-foreground">Ctrl+Enter para salvar</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Fechar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !note.trim()}>
              {saving ? 'Salvando…' : 'Salvar nota'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
