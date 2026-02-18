import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StudentRiskData } from '@/hooks/useStudentTriage';

interface BatchTriageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentRiskData[];
  onSubmit: (data: {
    patientIds: string[];
    priority: string;
    recommendedAction: string;
    notes: string;
    followUpDate?: string;
  }) => Promise<void>;
  isAnonymized?: boolean;
  studentIndexMap?: Map<string, number>;
}

const priorityOptions = [
  { value: 'urgent', label: '🔴 Urgente' },
  { value: 'high', label: '🟠 Alta' },
  { value: 'medium', label: '🟡 Média' },
  { value: 'low', label: '🟢 Baixa' },
];

const actionOptions = [
  { value: 'refer_professional', label: 'Encaminhar para profissional' },
  { value: 'schedule_talk', label: 'Agendar conversa' },
  { value: 'monitor', label: 'Monitorar' },
  { value: 'contact_family', label: 'Contato com família' },
];

export function BatchTriageDialog({ open, onOpenChange, students, onSubmit, isAnonymized = false, studentIndexMap }: BatchTriageDialogProps) {
  const [priority, setPriority] = useState('medium');
  const [action, setAction] = useState('monitor');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        patientIds: students.map(s => s.patientId),
        priority,
        recommendedAction: action,
        notes,
        followUpDate: followUpDate || undefined,
      });
      onOpenChange(false);
      setPriority('medium');
      setAction('monitor');
      setNotes('');
      setFollowUpDate('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Triagem em Lote — {students.length} aluno{students.length > 1 ? 's' : ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {students.map(s => {
              const displayName = isAnonymized && studentIndexMap
                ? `Aluno #${(studentIndexMap.get(s.patientId) ?? 0) + 1}`
                : s.studentName;
              return (
                <Badge key={s.patientId} variant="secondary" className="text-xs">{displayName}</Badge>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ação Recomendada</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {actionOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações aplicáveis a todos os alunos selecionados..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Data de Acompanhamento (opcional)</Label>
            <Input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : `Triar ${students.length} aluno${students.length > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
