import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Pencil } from 'lucide-react';

interface QuickNotePopoverProps {
  onSave: (note: string) => Promise<void>;
}

export function QuickNotePopover({ onSave }: QuickNotePopoverProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

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
      <PopoverContent className="w-72" align="end">
        <div className="space-y-2">
          <p className="text-xs font-medium">Nota rápida</p>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Adicionar observação..."
            rows={3}
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
