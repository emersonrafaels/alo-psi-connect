import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  duration: number; // minutos
}

interface ScheduleSelectorProps {
  value: TimeSlot[];
  onChange: (timeSlots: TimeSlot[]) => void;
}

const DAYS_OF_WEEK = [
  { value: 'segunda', label: 'Segunda-feira' },
  { value: 'terca', label: 'Terça-feira' },
  { value: 'quarta', label: 'Quarta-feira' },
  { value: 'quinta', label: 'Quinta-feira' },
  { value: 'sexta', label: 'Sexta-feira' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' }
];

const DURATIONS = [
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '60 minutos' },
  { value: 90, label: '90 minutos' }
];

export const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({ value, onChange }) => {
  const [newSlot, setNewSlot] = useState<Partial<TimeSlot>>({
    day: '',
    startTime: '',
    endTime: '',
    duration: 60
  });

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const addTimeSlot = () => {
    if (newSlot.day && newSlot.startTime && newSlot.endTime && newSlot.duration) {
      const id = `${newSlot.day}-${newSlot.startTime}-${Date.now()}`;
      const timeSlot: TimeSlot = {
        id,
        day: newSlot.day,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        duration: newSlot.duration
      };
      
      onChange([...value, timeSlot]);
      setNewSlot({
        day: '',
        startTime: '',
        endTime: '',
        duration: 60
      });
    }
  };

  const removeTimeSlot = (id: string) => {
    onChange(value.filter(slot => slot.id !== id));
  };

  const getDayLabel = (day: string) => {
    return DAYS_OF_WEEK.find(d => d.value === day)?.label || day;
  };

  const getDurationLabel = (duration: number) => {
    return DURATIONS.find(d => d.value === duration)?.label || `${duration} min`;
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">
          Dias e Horários de Atendimento <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          Configure os dias da semana e horários em que você está disponível para atendimento.
        </p>

        {/* Lista de horários adicionados */}
        {value.length > 0 && (
          <div className="space-y-2 mb-6">
            <Label className="text-sm font-medium">Horários configurados:</Label>
            <div className="space-y-2">
              {value.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{getDayLabel(slot.day)}</Badge>
                    <span className="text-sm">
                      {slot.startTime} às {slot.endTime}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {getDurationLabel(slot.duration)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTimeSlot(slot.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulário para adicionar novo horário */}
        <div className="border rounded-lg p-4 space-y-4">
          <Label className="text-sm font-medium">Adicionar novo horário:</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="day" className="text-sm">Dia da semana</Label>
              <Select 
                value={newSlot.day} 
                onValueChange={(value) => setNewSlot(prev => ({ ...prev, day: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startTime" className="text-sm">Hora início</Label>
              <Select 
                value={newSlot.startTime} 
                onValueChange={(value) => setNewSlot(prev => ({ ...prev, startTime: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Início" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="endTime" className="text-sm">Hora fim</Label>
              <Select 
                value={newSlot.endTime} 
                onValueChange={(value) => setNewSlot(prev => ({ ...prev, endTime: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fim" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration" className="text-sm">Duração consulta</Label>
              <Select 
                value={newSlot.duration?.toString()} 
                onValueChange={(value) => setNewSlot(prev => ({ ...prev, duration: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Duração" />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((duration) => (
                    <SelectItem key={duration.value} value={duration.value.toString()}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addTimeSlot}
            disabled={!newSlot.day || !newSlot.startTime || !newSlot.endTime || !newSlot.duration}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Horário
          </Button>
        </div>

        {value.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            Nenhum horário configurado. Adicione pelo menos um horário de atendimento.
          </p>
        )}
      </div>
    </div>
  );
};