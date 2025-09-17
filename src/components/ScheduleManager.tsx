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
  Save,
  AlertCircle
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
  const { toast } = useToast();

  // Carregar horários existentes
  useEffect(() => {
    const loadSchedules = async () => {
      if (!professionalId) {
        console.log('📅 [ScheduleManager] No professionalId provided');
        return;
      }

      console.log('📅 [ScheduleManager] Loading schedules for professional ID:', professionalId);

      try {
        const { data, error } = await supabase
          .from('profissionais_sessoes')
          .select('*')
          .eq('user_id', professionalId)
          .order('day')
          .order('start_time');

        if (error) {
          console.error('❌ [ScheduleManager] Error loading schedules:', error);
          throw error;
        }

        console.log('📅 [ScheduleManager] Raw data from database:', data);

        // Converter os dados do banco para o formato esperado pelo componente
        const convertedSchedules = (data || []).map((dbSchedule: any) => {
          const convertedDay = DAY_FORMAT_MAP[dbSchedule.day] || dbSchedule.day;
          const timeSlot = dbSchedule.time_slot || 50; // Default para 50 minutos se for null
          
          const converted = {
            id: dbSchedule.id,
            day: convertedDay,
            start_time: dbSchedule.start_time.slice(0, 5), // Remove seconds
            end_time: dbSchedule.end_time.slice(0, 5), // Remove seconds  
            time_slot: timeSlot
          };

          console.log('🔄 [ScheduleManager] Converting:', {
            original: { day: dbSchedule.day, time_slot: dbSchedule.time_slot },
            converted: { day: converted.day, time_slot: converted.time_slot }
          });

          return converted;
        });

        console.log('✅ [ScheduleManager] Converted schedules:', convertedSchedules);
        setSchedules(convertedSchedules);
      } catch (error: any) {
        console.error('❌ [ScheduleManager] Exception:', error);
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
      time_slot: 50
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

      // Preparar dados para salvar - converter de volta para o formato do banco
      const schedulesToSave = validSchedules.map(schedule => {
        const dbDay = DAY_FORMAT_REVERSE_MAP[schedule.day] || schedule.day;
        console.log('💾 [ScheduleManager] Converting for save:', { 
          componentDay: schedule.day, 
          dbDay: dbDay 
        });
        
        return {
          user_id: professionalId,
          day: dbDay,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          time_slot: schedule.time_slot
        };
      });

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

      // Converter os dados recarregados
      const reloadedSchedules = (data || []).map((dbSchedule: any) => ({
        id: dbSchedule.id,
        day: DAY_FORMAT_MAP[dbSchedule.day] || dbSchedule.day,
        start_time: dbSchedule.start_time.slice(0, 5),
        end_time: dbSchedule.end_time.slice(0, 5),
        time_slot: dbSchedule.time_slot || 50
      }));

      setSchedules(reloadedSchedules);

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

  const generateTimeSlots = (startTime: string, endTime: string, slotDuration: number) => {
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
      current = new Date(next.getTime());
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
      <div className="text-center">
        <h3 className="text-xl font-medium">Horários de atendimento</h3>
      </div>

      {/* Configuração de Intervalos */}
      <div className="space-y-4">
        <div>
          <h4 className="text-base font-medium">
            Configuração de Intervalos <span className="text-destructive">*</span>
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            Escolha o intervalo entre os horários disponíveis para agendamento.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="time_interval"
              value="30"
              checked={true}
              readOnly
              className="mt-1"
            />
            <div>
              <div className="font-medium">30 em 30 minutos</div>
              <div className="text-sm text-muted-foreground">Ex: 10:00, 10:30, 11:00, 11:30...</div>
            </div>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer opacity-50">
            <input
              type="radio"
              name="time_interval"
              value="60"
              disabled
              className="mt-1"
            />
            <div>
              <div className="font-medium">1 em 1 hora</div>
              <div className="text-sm text-muted-foreground">Ex: 10:00, 11:00, 12:00, 13:00...</div>
            </div>
          </label>
        </div>
      </div>

      {/* Dias e Horários de Atendimento */}
      <div className="space-y-4">
        <div>
          <h4 className="text-base font-medium">
            Dias e Horários de Atendimento <span className="text-destructive">*</span>
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            Configure os dias da semana e horários em que você está disponível para atendimento.
          </p>
        </div>

        {/* Adicionar novo horário */}
        <div className="space-y-4">
          <h5 className="font-medium">Adicionar novo horário:</h5>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label className="text-sm font-medium">Dia da semana</Label>
              <Select value="" onValueChange={(value) => {
                const newSchedule = {
                  day: value,
                  start_time: '09:00',
                  end_time: '17:00',
                  time_slot: 50
                };
                setSchedules(prev => [...prev, newSchedule as Schedule]);
              }}>
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
              <Label className="text-sm font-medium">Hora início</Label>
              <Select value="" disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Início" />
                </SelectTrigger>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Hora fim</Label>
              <Select value="" disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Fim" />
                </SelectTrigger>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Duração consulta</Label>
              <Select value="50" disabled>
                <SelectTrigger>
                  <SelectValue placeholder="50 minutos" />
                </SelectTrigger>
              </Select>
            </div>
          </div>

          <Button variant="outline" className="w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Horário
          </Button>
        </div>

        {schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum horário configurado. Adicione pelo menos um horário de atendimento.</p>
          </div>
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
                            schedule.time_slot
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
      </div>

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