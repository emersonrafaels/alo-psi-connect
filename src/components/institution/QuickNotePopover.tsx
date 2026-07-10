import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Sparkles } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getTemplatesForRisk } from '@/lib/triageNoteTemplates';

interface QuickNotePopoverProps {
  onSave: (note: string) => Promise<void>;
  riskLevel?: string | null;
}

export function QuickNotePopover({ onSave, riskLevel }: QuickNotePopoverProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const templates = getTemplatesForRisk(riskLevel);

  const handleSave = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await onSave(note.trim());
      setNote('');
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Nota rápida">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Nota rápida</p>
            {templates.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <Sparkles className="h-3 w-3" /> Usar template
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="text-xs">
                    Templates {riskLevel ? `(risco ${riskLevel})` : ''}
                  </DropdownMenuLabel>
                  {templates.map((t) => (
                    <DropdownMenuItem key={t.id} onClick={() => setNote(t.content)} className="flex-col items-start gap-1">
                      <span className="font-medium text-xs">{t.label}</span>
                      <span className="text-[10px] text-muted-foreground line-clamp-2">{t.content}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Adicionar observação..."
            rows={5}
            className="text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !note.trim()}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
