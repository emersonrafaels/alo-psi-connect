import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SessionFormData {
  title: string;
  description: string;
  session_type: string;
  session_date: string;
  start_time: string;
  duration_minutes: number;
  max_participants: number;
  organizer_type: string;
  meeting_link?: string;
  whatsapp_group_link?: string;
}

interface FacilitatorSessionFormProps {
  onSubmit: (data: SessionFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: Partial<SessionFormData>;
}

export const FacilitatorSessionForm = ({ onSubmit, onCancel, isSubmitting, initialData }: FacilitatorSessionFormProps) => {
  const isEditing = !!initialData;
  const { register, handleSubmit, watch, setValue } = useForm<SessionFormData>({
    defaultValues: {
      session_type: initialData?.session_type || 'roda_conversa',
      duration_minutes: initialData?.duration_minutes || 60,
      max_participants: initialData?.max_participants || 50,
      organizer_type: initialData?.organizer_type || 'professional',
      title: initialData?.title || '',
      description: initialData?.description || '',
      session_date: initialData?.session_date || '',
      start_time: initialData?.start_time || '',
      meeting_link: initialData?.meeting_link || '',
      whatsapp_group_link: initialData?.whatsapp_group_link || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações do Encontro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input id="title" {...register('title', { required: true })} placeholder="Ex: Roda de Conversa sobre Ansiedade" />
          </div>
          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Textarea id="description" {...register('description', { required: true })} rows={4} placeholder="Descreva o encontro, objetivos e público-alvo..." />
          </div>
          <div>
            <Label>Tipo de Encontro</Label>
            <RadioGroup value={watch('session_type')} onValueChange={(v) => setValue('session_type', v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="palestra" id="f_palestra" />
                <Label htmlFor="f_palestra">Palestra</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="workshop" id="f_workshop" />
                <Label htmlFor="f_workshop">Workshop</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="roda_conversa" id="f_roda" />
                <Label htmlFor="f_roda">Roda de Conversa</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data e Hora</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="session_date">Data *</Label>
              <Input id="session_date" type="date" {...register('session_date', { required: true })} />
            </div>
            <div>
              <Label htmlFor="start_time">Horário *</Label>
              <Input id="start_time" type="time" {...register('start_time', { required: true })} />
            </div>
          </div>
          <div>
            <Label htmlFor="duration_minutes">Duração (minutos)</Label>
            <Input id="duration_minutes" type="number" min="30" max="180" {...register('duration_minutes', { valueAsNumber: true })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="meeting_link">Link da Reunião (Google Meet, Zoom, etc.)</Label>
            <Input id="meeting_link" type="url" {...register('meeting_link')} placeholder="https://meet.google.com/xxx-xxxx-xxx" />
          </div>
          <div>
            <Label htmlFor="whatsapp_group_link">Link do Grupo do WhatsApp</Label>
            <Input id="whatsapp_group_link" type="url" {...register('whatsapp_group_link')} placeholder="https://chat.whatsapp.com/..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Capacidade</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="max_participants">Máximo de participantes</Label>
          <Input id="max_participants" type="number" min="5" max="500" {...register('max_participants', { valueAsNumber: true })} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Enviar para Aprovação'}
        </Button>
      </div>
    </form>
  );
};
