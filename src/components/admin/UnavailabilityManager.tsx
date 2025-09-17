import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, Trash2, Edit, Plus, Repeat, CalendarRange } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UnavailabilityRecord {
  id: string;
  professional_id: number;
  date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

interface UnavailabilityManagerProps {
  professionalId: number;
  professionalName?: string;
}

export const UnavailabilityManager = ({ professionalId, professionalName }: UnavailabilityManagerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [blockingMode, setBlockingMode] = useState<'single' | 'period' | 'recurring'>('single');
  const [formData, setFormData] = useState({
    date: '',
    endDate: '', // For period blocking
    start_time: '',
    end_time: '',
    all_day: false,
    reason: '',
    recurring: {
      type: 'weekly', // weekly, monthly
      dayOfWeek: '', // for weekly recurrence
      dayOfMonth: '', // for monthly recurrence
      endRecurrence: '' // when to stop recurring
    }
  });
  const [editingRecord, setEditingRecord] = useState<UnavailabilityRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch unavailability records
  const { data: unavailabilityRecords = [], isLoading } = useQuery({
    queryKey: ['professional-unavailability', professionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_unavailability')
        .select('*')
        .eq('professional_id', professionalId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as UnavailabilityRecord[];
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<UnavailabilityRecord, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('professional_unavailability')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-unavailability', professionalId] });
      toast({ title: 'Bloqueio criado com sucesso!' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating unavailability:', error);
      toast({ title: 'Erro ao criar bloqueio', variant: 'destructive' });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<UnavailabilityRecord> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('professional_unavailability')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-unavailability', professionalId] });
      toast({ title: 'Bloqueio atualizado com sucesso!' });
      setIsDialogOpen(false);
      setEditingRecord(null);
      resetForm();
    },
    onError: (error) => {
      console.error('Error updating unavailability:', error);
      toast({ title: 'Erro ao atualizar bloqueio', variant: 'destructive' });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('professional_unavailability')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-unavailability', professionalId] });
      toast({ title: 'Bloqueio removido com sucesso!' });
    },
    onError: (error) => {
      console.error('Error deleting unavailability:', error);
      toast({ title: 'Erro ao remover bloqueio', variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      date: '',
      endDate: '',
      start_time: '',
      end_time: '',
      all_day: false,
      reason: '',
      recurring: {
        type: 'weekly',
        dayOfWeek: '',
        dayOfMonth: '',
        endRecurrence: ''
      }
    });
    setEditingRecord(null);
    setBlockingMode('single');
  };

  const generateRecurringDates = (startDate: string, endDate: string, type: string, dayOfWeek?: string) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let current = new Date(start);
    
    if (type === 'weekly' && dayOfWeek) {
      const targetDay = parseInt(dayOfWeek);
      // Find first occurrence of the target day
      while (current.getDay() !== targetDay && current <= end) {
        current = addDays(current, 1);
      }
      
      while (current <= end) {
        dates.push(format(current, 'yyyy-MM-dd'));
        current = addDays(current, 7);
      }
    } else if (type === 'monthly') {
      while (current <= end) {
        dates.push(format(current, 'yyyy-MM-dd'));
        // Move to next month, same day
        const nextMonth = new Date(current);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        current = nextMonth;
      }
    }
    
    return dates;
  };

  const handleSubmit = async () => {
    if (!formData.date) {
      toast({ title: 'Selecione uma data', variant: 'destructive' });
      return;
    }

    // Check if date is in the past
    const selectedDate = new Date(formData.date);
    const today = startOfDay(new Date());
    
    if (isBefore(selectedDate, today)) {
      toast({ 
        title: 'Data inválida', 
        description: 'Não é possível bloquear datas que já passaram',
        variant: 'destructive' 
      });
      return;
    }

    if (!formData.all_day && (!formData.start_time || !formData.end_time)) {
      toast({ title: 'Para horários específicos, informe início e fim', variant: 'destructive' });
      return;
    }

    const baseData = {
      professional_id: professionalId,
      start_time: formData.all_day ? null : formData.start_time,
      end_time: formData.all_day ? null : formData.end_time,
      all_day: formData.all_day,
      reason: formData.reason || null
    };

    try {
      let datesToCreate = [];

      if (blockingMode === 'single') {
        datesToCreate = [formData.date];
      } else if (blockingMode === 'period') {
        if (!formData.endDate) {
          toast({ title: 'Selecione a data final do período', variant: 'destructive' });
          return;
        }
        
        const start = new Date(formData.date);
        const end = new Date(formData.endDate);
        
        if (isBefore(end, start)) {
          toast({ title: 'Data final deve ser posterior à data inicial', variant: 'destructive' });
          return;
        }
        
        let current = new Date(start);
        while (current <= end) {
          datesToCreate.push(format(current, 'yyyy-MM-dd'));
          current = addDays(current, 1);
        }
      } else if (blockingMode === 'recurring') {
        if (!formData.recurring.endRecurrence) {
          toast({ title: 'Selecione quando parar a recorrência', variant: 'destructive' });
          return;
        }
        
        datesToCreate = generateRecurringDates(
          formData.date,
          formData.recurring.endRecurrence,
          formData.recurring.type,
          formData.recurring.dayOfWeek
        );
      }

      // Create multiple records
      const recordsToCreate = datesToCreate.map(date => ({
        ...baseData,
        date
      }));

      if (editingRecord) {
        updateMutation.mutate({ id: editingRecord.id, ...baseData, date: formData.date });
      } else {
        // Bulk create
        const { error } = await supabase
          .from('professional_unavailability')
          .insert(recordsToCreate);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['professional-unavailability', professionalId] });
        toast({ 
          title: 'Bloqueios criados com sucesso!', 
          description: `${datesToCreate.length} dia(s) bloqueado(s)` 
        });
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error: any) {
      console.error('Error creating blocks:', error);
      toast({ title: 'Erro ao criar bloqueios', variant: 'destructive' });
    }
  };

  const handleEdit = (record: UnavailabilityRecord) => {
    setEditingRecord(record);
    setFormData({
      date: record.date,
      endDate: '',
      start_time: record.start_time || '',
      end_time: record.end_time || '',
      all_day: record.all_day,
      reason: record.reason || '',
      recurring: {
        type: 'weekly',
        dayOfWeek: '',
        dayOfMonth: '',
        endRecurrence: ''
      }
    });
    setBlockingMode('single'); // Edit always single mode
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Get blocked dates for calendar highlighting
  const blockedDates = unavailabilityRecords.map(record => new Date(record.date));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gerenciar Indisponibilidades</h3>
          {professionalName && (
            <p className="text-sm text-muted-foreground">Profissional: {professionalName}</p>
          )}
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Bloqueio
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? 'Editar Bloqueio' : 'Novo Bloqueio'}
              </DialogTitle>
              <DialogDescription>
                Configure os dias e horários em que o profissional não estará disponível.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Blocking Mode Selection */}
              <div>
                <Label>Tipo de Bloqueio</Label>
                <Select value={blockingMode} onValueChange={(value: 'single' | 'period' | 'recurring') => setBlockingMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Data específica
                      </div>
                    </SelectItem>
                    <SelectItem value="period">
                      <div className="flex items-center gap-2">
                        <CalendarRange className="h-4 w-4" />
                        Período (várias datas)
                      </div>
                    </SelectItem>
                    <SelectItem value="recurring">
                      <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4" />
                        Recorrente
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div>
                <Label htmlFor="date">
                  {blockingMode === 'period' ? 'Data inicial' : 'Data'}
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  min={format(new Date(), 'yyyy-MM-dd')} // Prevent past dates
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              {/* End Date for Period */}
              {blockingMode === 'period' && (
                <div>
                  <Label htmlFor="endDate">Data final</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    min={formData.date || format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              )}

              {/* Recurring Options */}
              {blockingMode === 'recurring' && (
                <div className="space-y-4 p-4 border rounded-lg bg-accent/20">
                  <div>
                    <Label>Tipo de recorrência</Label>
                    <Select 
                      value={formData.recurring.type} 
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        recurring: { ...formData.recurring, type: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.recurring.type === 'weekly' && (
                    <div>
                      <Label>Dia da semana</Label>
                      <Select 
                        value={formData.recurring.dayOfWeek} 
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          recurring: { ...formData.recurring, dayOfWeek: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o dia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Domingo</SelectItem>
                          <SelectItem value="1">Segunda-feira</SelectItem>
                          <SelectItem value="2">Terça-feira</SelectItem>
                          <SelectItem value="3">Quarta-feira</SelectItem>
                          <SelectItem value="4">Quinta-feira</SelectItem>
                          <SelectItem value="5">Sexta-feira</SelectItem>
                          <SelectItem value="6">Sábado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="endRecurrence">Repetir até</Label>
                    <Input
                      id="endRecurrence"
                      type="date"
                      value={formData.recurring.endRecurrence}
                      min={formData.date || format(new Date(), 'yyyy-MM-dd')}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        recurring: { ...formData.recurring, endRecurrence: e.target.value }
                      })}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="all-day"
                  checked={formData.all_day}
                  onCheckedChange={(checked) => setFormData({ ...formData, all_day: checked })}
                />
                <Label htmlFor="all-day">Dia inteiro</Label>
              </div>
              
              {!formData.all_day && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Início</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">Fim</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Ex: Férias, Consulta médica, etc."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingRecord ? 'Atualizar' : 'Criar'} Bloqueio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="list">
            <Clock className="h-4 w-4 mr-2" />
            Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendário de Bloqueios</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                disabled={(date) => isBefore(date, startOfDay(new Date()))} // Disable past dates
                modifiers={{
                  blocked: blockedDates
                }}
                modifiersStyles={{
                  blocked: {
                    backgroundColor: 'hsl(var(--destructive))',
                    color: 'hsl(var(--destructive-foreground))'
                  }
                }}
                className="rounded-md border pointer-events-auto"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {unavailabilityRecords.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum bloqueio configurado
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {unavailabilityRecords.map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(record.date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          <Badge variant={record.all_day ? 'destructive' : 'secondary'}>
                            {record.all_day ? 'Dia inteiro' : 'Horário específico'}
                          </Badge>
                        </div>
                        
                        {!record.all_day && record.start_time && record.end_time && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{record.start_time} - {record.end_time}</span>
                          </div>
                        )}
                        
                        {record.reason && (
                          <p className="text-sm text-muted-foreground">{record.reason}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(record)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover este bloqueio?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(record.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};