import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Trash2, 
  Clock, 
  AlertCircle,
  Calendar
} from 'lucide-react';

interface Schedule {
  id: number;
  day: string;
  start_time: string;
  end_time: string;
  time_slot: number;
}

interface ScheduleManagerProps {
  professionalId?: number;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
];

// Mapeamento entre formato do banco (abreviado) e formato do componente (completo)
const DAY_FORMAT_MAP: Record<string, string> = {
  'mon': 'monday',
  'tue': 'tuesday', 
  'wed': 'wednesday',
  'thu': 'thursday',
  'fri': 'friday',
  'sat': 'saturday',
  'sun': 'sunday'
};

// Mapeamento reverso para salvar no formato do banco
const DAY_FORMAT_REVERSE_MAP: Record<string, string> = {
  'monday': 'mon',
  'tuesday': 'tue',
  'wednesday': 'wed', 
  'thursday': 'thu',
  'friday': 'fri',
  'saturday': 'sat',
  'sunday': 'sun'
};

const TIME_SLOTS = [
  { value: 30, label: '30 minutos' },
  { value: 50, label: '50 minutos' }
];

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({ professionalId }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    day: '',
    start_time: '09:00',
    end_time: '17:00',
    time_slot: 50
  });
  const { toast } = useToast();

  const loadSchedules = async () => {
    if (!professionalId) {
      console.log('📅 [ScheduleManager] No professionalId provided');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profissionais_sessoes')
        .select('*')
        .eq('user_id', professionalId)
        .order('day')
        .order('start_time');

      if (error) throw error;

      // Converter os dados do banco para o formato esperado pelo componente
      const convertedSchedules = (data || []).map((dbSchedule: any) => {
        const convertedDay = DAY_FORMAT_MAP[dbSchedule.day] || dbSchedule.day;
        const timeSlot = dbSchedule.time_slot || 50;
        
        return {
          id: dbSchedule.id,
          day: convertedDay,
          start_time: dbSchedule.start_time.slice(0, 5),
          end_time: dbSchedule.end_time.slice(0, 5),
          time_slot: timeSlot
        };
      });

      setSchedules(convertedSchedules);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar horários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar horários existentes
  useEffect(() => {
    loadSchedules();
  }, [professionalId]);

  const addSchedule = async () => {
    if (!professionalId || !newSchedule.day || !newSchedule.start_time || !newSchedule.end_time) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha dia, horário de início e fim.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const dbDay = DAY_FORMAT_REVERSE_MAP[newSchedule.day] || newSchedule.day;
      
      const { error } = await supabase
        .from('profissionais_sessoes')
        .insert({
          user_id: professionalId,
          day: dbDay,
          start_time: newSchedule.start_time,
          end_time: newSchedule.end_time,
          time_slot: newSchedule.time_slot || 50
        });

      if (error) throw error;

      // Reload schedules
      await loadSchedules();
      
      // Reset form
      setNewSchedule({
        day: '',
        start_time: '09:00',
        end_time: '17:00',
        time_slot: 50
      });

      toast({
        title: "Horário adicionado",
        description: "Novo horário criado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar horário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateNewSchedule = (field: keyof Schedule, value: string | number) => {
    setNewSchedule(prev => ({ ...prev, [field]: value }));
  };

  const deleteSchedule = async (scheduleId: number) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profissionais_sessoes')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      // Reload schedules
      await loadSchedules();

      toast({
        title: "Horário removido",
        description: "Horário deletado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao deletar horário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };


  const getDayLabel = (day: string) => {
    return DAYS_OF_WEEK.find(d => d.value === day)?.label || day;
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove seconds if present
  };

  if (!professionalId) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Perfil profissional necessário</h3>
        <p className="text-muted-foreground">
          Você precisa ter um perfil profissional ativo para gerenciar horários.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold text-foreground">Gerenciar Horários</h3>
        <p className="text-muted-foreground">Adicione ou remova seus dias e horários de atendimento</p>
      </div>

      {/* Meus Horários */}
      {schedules.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Meus Horários
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Seus horários configurados de atendimento
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="flex items-center justify-between p-4 bg-accent/30 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-medium">
                    {getDayLabel(schedule.day)}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {schedule.time_slot}min
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSchedule(schedule.id)}
                  disabled={saving}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Adicionar Horário */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            Adicionar Horário
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure um novo dia e horário de atendimento
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Dia da semana</Label>
              <Select
                value={newSchedule.day}
                onValueChange={(value) => updateNewSchedule('day', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map(day => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Horário início</Label>
              <Select
                value={newSchedule.start_time}
                onValueChange={(value) => updateNewSchedule('start_time', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Início" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                        {hour}:00
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Horário fim</Label>
              <Select
                value={newSchedule.end_time}
                onValueChange={(value) => updateNewSchedule('end_time', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fim" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                        {hour}:00
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Duração consulta</Label>
              <Select
                value={newSchedule.time_slot?.toString()}
                onValueChange={(value) => updateNewSchedule('time_slot', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Duração" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map(slot => (
                    <SelectItem key={slot.value} value={slot.value.toString()}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={addSchedule}
              disabled={saving || !newSchedule.day || !newSchedule.start_time || !newSchedule.end_time}
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              {saving ? 'Adicionando...' : 'Adicionar Horário'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {schedules.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum horário configurado</h3>
            <p className="text-muted-foreground mb-6">
              Configure seu primeiro dia e horário de atendimento usando o formulário acima
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};