import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Trash2, 
  Clock, 
  Save,
  AlertCircle
} from 'lucide-react';

interface Schedule {
  id: number;
  day: string;
  start_time: string;
  end_time: string;
  time_slot: number;
  minutos_janela: number;
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

const TIME_SLOTS = [
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' }
];

const BUFFER_TIME = [
  { value: 0, label: 'Sem intervalo' },
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' }
];

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({ professionalId }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Carregar horários existentes
  useEffect(() => {
    const loadSchedules = async () => {
      if (!professionalId) {
        console.log('ScheduleManager: No professionalId provided');
        return;
      }

      console.log('ScheduleManager: Loading schedules for professional ID:', professionalId);

      try {
        const { data, error } = await supabase
          .from('profissionais_sessoes')
          .select('*')
          .eq('user_id', professionalId)
          .order('day')
          .order('start_time');

        if (error) {
          console.error('ScheduleManager: Error loading schedules:', error);
          throw error;
        }

        console.log('ScheduleManager: Loaded schedules:', data);
        setSchedules(data || []);
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

    loadSchedules();
  }, [professionalId, toast]);

  const addNewSchedule = () => {
    const newSchedule: Partial<Schedule> = {
      day: '',
      start_time: '09:00',
      end_time: '17:00',
      time_slot: 60,
      minutos_janela: 15
    };

    setSchedules(prev => [...prev, newSchedule as Schedule]);
  };

  const updateSchedule = (index: number, field: keyof Schedule, value: string | number) => {
    setSchedules(prev => prev.map((schedule, i) => 
      i === index ? { ...schedule, [field]: value } : schedule
    ));
  };

  const removeSchedule = (index: number) => {
    const schedule = schedules[index];
    if (schedule.id) {
      // Se tem ID, marcar para exclusão
      deleteScheduleFromDB(schedule.id);
    }
    setSchedules(prev => prev.filter((_, i) => i !== index));
  };

  const deleteScheduleFromDB = async (id: number) => {
    try {
      const { error } = await supabase
        .from('profissionais_sessoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro ao deletar horário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveSchedules = async () => {
    if (!professionalId) return;

    setSaving(true);
    try {
      // Validar horários
      const validSchedules = schedules.filter(schedule => 
        schedule.day && schedule.start_time && schedule.end_time
      );

      if (validSchedules.length === 0) {
        toast({
          title: "Nenhum horário válido",
          description: "Preencha pelo menos um horário completo.",
          variant: "destructive",
        });
        return;
      }

      // Preparar dados para salvar
      const schedulesToSave = validSchedules.map(schedule => ({
        user_id: professionalId,
        day: schedule.day,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        time_slot: schedule.time_slot,
        minutos_janela: schedule.minutos_janela
      }));

      // Primeiro, deletar todos os horários existentes
      const { error: deleteError } = await supabase
        .from('profissionais_sessoes')
        .delete()
        .eq('user_id', professionalId);

      if (deleteError) throw deleteError;

      // Inserir novos horários
      const { error: insertError } = await supabase
        .from('profissionais_sessoes')
        .insert(schedulesToSave);

      if (insertError) throw insertError;

      // Recarregar horários
      const { data, error: loadError } = await supabase
        .from('profissionais_sessoes')
        .select('*')
        .eq('user_id', professionalId)
        .order('day')
        .order('start_time');

      if (loadError) throw loadError;

      setSchedules(data || []);

      toast({
        title: "Horários salvos",
        description: "Seus horários de atendimento foram atualizados com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar os horários.",
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

  const generateTimeSlots = (startTime: string, endTime: string, slotDuration: number, bufferTime: number) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const slots = [];

    let current = new Date(start);
    while (current < end) {
      const next = new Date(current.getTime() + slotDuration * 60000);
      if (next <= end) {
        slots.push({
          start: current.toTimeString().slice(0, 5),
          end: next.toTimeString().slice(0, 5)
        });
      }
      current = new Date(next.getTime() + bufferTime * 60000);
    }

    return slots;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Horários de Atendimento</h3>
          <p className="text-sm text-muted-foreground">
            Configure seus dias e horários disponíveis para consultas
          </p>
        </div>
        <Button onClick={addNewSchedule} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Horário
        </Button>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum horário configurado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione seus horários de atendimento para que pacientes possam agendar consultas.
            </p>
            <Button onClick={addNewSchedule}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Horário
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {schedules.map((schedule, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <Label>Dia da semana</Label>
                      <Select
                        value={schedule.day}
                        onValueChange={(value) => updateSchedule(index, 'day', value)}
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
                      <Label>Horário início</Label>
                      <Select
                        value={schedule.start_time}
                        onValueChange={(value) => updateSchedule(index, 'start_time', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                      <Label>Horário fim</Label>
                      <Select
                        value={schedule.end_time}
                        onValueChange={(value) => updateSchedule(index, 'end_time', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                      <Label>Duração consulta</Label>
                      <Select
                        value={schedule.time_slot?.toString()}
                        onValueChange={(value) => updateSchedule(index, 'time_slot', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
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

                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSchedule(index)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Preview dos horários */}
                  {schedule.day && schedule.start_time && schedule.end_time && schedule.time_slot && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <Label className="text-sm font-medium mb-2 block">
                        Horários disponíveis - {getDayLabel(schedule.day)}:
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {generateTimeSlots(
                          schedule.start_time,
                          schedule.end_time,
                          schedule.time_slot,
                          schedule.minutos_janela || 0
                        ).map((slot, slotIndex) => (
                          <Badge key={slotIndex} variant="secondary" className="text-xs">
                            {slot.start} - {slot.end}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={saveSchedules} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Horários'}
            </Button>
          </div>
        </>
      )}

      {/* Informações sobre como funciona */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Configure os dias e horários que você atende</p>
          <p>• Defina a duração de cada consulta</p>
          <p>• Os pacientes só verão os horários que você configurou</p>
          <p>• Horários já agendados não aparecerão como disponíveis</p>
          <p>• Se conectado ao Google Calendar, eventos existentes serão considerados ocupados</p>
        </CardContent>
      </Card>
    </div>
  );
};