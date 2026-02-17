import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Activity, Moon, Zap, Brain } from 'lucide-react';
import { StudentRiskData } from '@/hooks/useStudentTriage';
import { toast } from 'sonner';

interface TriageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentRiskData | null;
  onSubmit: (data: {
    patientId: string;
    riskLevel: string;
    priority: string;
    recommendedAction: string;
    notes: string;
  }) => Promise<void>;
}

const riskLabels: Record<string, { label: string; color: string }> = {
  critical: { label: 'Crítico', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  alert: { label: 'Alerta', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  attention: { label: 'Atenção', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  healthy: { label: 'Saudável', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  no_data: { label: 'Sem Dados', color: 'bg-muted text-muted-foreground' },
};

export function TriageDialog({ open, onOpenChange, student, onSubmit }: TriageDialogProps) {
  const [priority, setPriority] = useState('medium');
  const [action, setAction] = useState('monitor');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!student) return null;

  const risk = riskLabels[student.riskLevel];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        patientId: student.patientId,
        riskLevel: student.riskLevel,
        priority,
        recommendedAction: action,
        notes,
      });
      toast.success('Triagem registrada com sucesso');
      onOpenChange(false);
      setPriority('medium');
      setAction('monitor');
      setNotes('');
    } catch {
      toast.error('Erro ao registrar triagem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Triar Aluno
          </DialogTitle>
          <DialogDescription>
            Registre observações e ações recomendadas para este aluno.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student summary */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{student.studentName}</span>
              <Badge className={risk.color}>{risk.label}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                Humor: {student.avgMood !== null ? student.avgMood : '—'}
              </div>
              <div className="flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5" />
                Ansiedade: {student.avgAnxiety !== null ? student.avgAnxiety : '—'}
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                Energia: {student.avgEnergy !== null ? student.avgEnergy : '—'}
              </div>
              <div className="flex items-center gap-1.5">
                <Moon className="h-3.5 w-3.5" />
                Sono: {student.avgSleep !== null ? student.avgSleep : '—'}
              </div>
            </div>
            {student.moodTrend !== null && (
              <p className="text-xs text-muted-foreground">
                Tendência: {student.moodTrend > 0 ? '+' : ''}{student.moodTrend}% nos últimos 14 dias
              </p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">🔴 Urgente</SelectItem>
                <SelectItem value="high">🟠 Alta</SelectItem>
                <SelectItem value="medium">🟡 Média</SelectItem>
                <SelectItem value="low">🟢 Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recommended action */}
          <div className="space-y-1.5">
            <Label>Ação Recomendada</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="refer_professional">Encaminhar para profissional</SelectItem>
                <SelectItem value="schedule_talk">Agendar conversa</SelectItem>
                <SelectItem value="monitor">Monitorar</SelectItem>
                <SelectItem value="contact_family">Contato com família</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre o aluno..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Registrar Triagem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
