import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pin, PinOff, Pencil, Trash2, CalendarDays, StickyNote } from 'lucide-react';
import { format, isAfter, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useInstitutionNotes, type CreateNoteData, type InstitutionNote } from '@/hooks/useInstitutionNotes';

const NOTE_TYPE_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  event: { label: 'Evento', variant: 'default', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
  info: { label: 'Info', variant: 'secondary', className: 'bg-muted text-muted-foreground' },
  alert: { label: 'Alerta', variant: 'destructive', className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' },
  reminder: { label: 'Lembrete', variant: 'outline', className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20' },
};

interface Props {
  institutionId: string;
}

export function InstitutionNotesTab({ institutionId }: Props) {
  const { notes, isLoading, createNote, updateNote, deleteNote } = useInstitutionNotes(institutionId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<InstitutionNote | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState('info');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const openCreate = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setNoteType('info');
    setStartDate('');
    setEndDate('');
    setDialogOpen(true);
  };

  const openEdit = (note: InstitutionNote) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content || '');
    setNoteType(note.note_type);
    setStartDate(note.start_date || '');
    setEndDate(note.end_date || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    const payload: CreateNoteData = {
      institution_id: institutionId,
      title: title.trim(),
      content: content.trim() || undefined,
      note_type: noteType,
      start_date: startDate || null,
      end_date: endDate || null,
    };
    if (editingNote) {
      await updateNote.mutateAsync({ id: editingNote.id, ...payload });
    } else {
      await createNote.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const togglePin = (note: InstitutionNote) => {
    updateNote.mutate({ id: note.id, is_pinned: !note.is_pinned });
  };

  const isDateRelevant = (note: InstitutionNote) => {
    if (!note.end_date && !note.start_date) return false;
    const ref = note.end_date || note.start_date!;
    const d = parseISO(ref);
    return isToday(d) || isAfter(d, new Date());
  };

  if (isLoading) {
    return <Card><CardContent className="py-10 text-center text-muted-foreground">Carregando notas...</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notas da Instituição</h3>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nova Nota
        </Button>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <StickyNote className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhuma nota cadastrada para esta instituição.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {notes.map((note) => {
            const typeConfig = NOTE_TYPE_CONFIG[note.note_type] || NOTE_TYPE_CONFIG.info;
            const relevant = isDateRelevant(note);
            return (
              <Card key={note.id} className={`transition-colors ${note.is_pinned ? 'border-primary/40' : ''} ${relevant ? 'bg-accent/30' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {note.is_pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
                      <CardTitle className="text-base">{note.title}</CardTitle>
                      <Badge variant={typeConfig.variant} className={`text-[10px] px-1.5 ${typeConfig.className}`}>
                        {typeConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePin(note)}>
                        {note.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(note)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(note.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {note.content && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {(note.start_date || note.end_date) && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {note.start_date && format(parseISO(note.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                        {note.start_date && note.end_date && ' — '}
                        {note.end_date && format(parseISO(note.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    )}
                    <span>Criado em {format(parseISO(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Editar Nota' : 'Nova Nota'}</DialogTitle>
            <DialogDescription>Preencha os campos abaixo para {editingNote ? 'editar a' : 'criar uma nova'} nota.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Semana de Provas" />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Evento</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="alert">Alerta</SelectItem>
                  <SelectItem value="reminder">Lembrete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Data Início</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Data Fim</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Conteúdo</label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Descrição detalhada..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!title.trim() || createNote.isPending || updateNote.isPending}>
              {editingNote ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir nota?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteNote.mutate(deleteId); setDeleteId(null); } }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
