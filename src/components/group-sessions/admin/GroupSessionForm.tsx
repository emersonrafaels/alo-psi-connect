import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GroupSession } from '@/hooks/useGroupSessions';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useTenant } from '@/hooks/useTenant';

interface GroupSessionFormProps {
  session?: GroupSession;
  onSubmit: (data: Partial<GroupSession>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const GroupSessionForm = ({ 
  session, 
  onSubmit, 
  onCancel,
  isSubmitting 
}: GroupSessionFormProps) => {
  const { tenant } = useTenant();
  const { data: professionals } = useProfessionals(100);
  const { institutions } = useInstitutions();

  const { register, handleSubmit, watch, setValue } = useForm<Partial<GroupSession>>({
    defaultValues: session || {
      session_type: 'palestra',
      duration_minutes: 60,
      max_participants: 100,
      is_free: true,
      price: 0,
      has_libras: false,
      audience_type: 'all',
      status: 'scheduled',
      organizer_type: 'tenant',
    },
  });

  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>(
    session?.allowed_institution_ids || []
  );

  const organizerType = watch('organizer_type');
  const audienceType = watch('audience_type');

  const handleFormSubmit = (data: Partial<GroupSession>) => {
    onSubmit({
      ...data,
      allowed_institution_ids: audienceType === 'institutions' ? selectedInstitutions : [],
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...register('title', { required: true })}
              placeholder="Como encarar os dias difíceis"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              {...register('description', { required: true })}
              rows={4}
              placeholder="Momentos difíceis fazem parte da vida..."
            />
          </div>

          <div>
            <Label>Tipo de Encontro *</Label>
            <RadioGroup
              value={watch('session_type')}
              onValueChange={(value) => setValue('session_type', value as any)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="palestra" id="palestra" />
                <Label htmlFor="palestra">Palestra</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="workshop" id="workshop" />
                <Label htmlFor="workshop">Workshop</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="roda_conversa" id="roda_conversa" />
                <Label htmlFor="roda_conversa">Roda de Conversa</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Data e Hora */}
      <Card>
        <CardHeader>
          <CardTitle>Data e Hora</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="session_date">Data *</Label>
              <Input
                id="session_date"
                type="date"
                {...register('session_date', { required: true })}
              />
            </div>

            <div>
              <Label htmlFor="start_time">Horário *</Label>
              <Input
                id="start_time"
                type="time"
                {...register('start_time', { required: true })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="duration_minutes">Duração (minutos) *</Label>
            <Input
              id="duration_minutes"
              type="number"
              min="30"
              max="180"
              {...register('duration_minutes', { required: true, valueAsNumber: true })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Organizador */}
      <Card>
        <CardHeader>
          <CardTitle>Organizador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Quem organiza este encontro? *</Label>
            <RadioGroup
              value={organizerType}
              onValueChange={(value) => {
                setValue('organizer_type', value as any);
                setValue('professional_id', undefined);
                setValue('institution_id', undefined);
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="professional" id="org_professional" />
                <Label htmlFor="org_professional">Profissional</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="institution" id="org_institution" />
                <Label htmlFor="org_institution">Instituição</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tenant" id="org_tenant" />
                <Label htmlFor="org_tenant">Plataforma ({tenant?.name})</Label>
              </div>
            </RadioGroup>
          </div>

          {organizerType === 'professional' && (
            <div>
              <Label>Selecionar Profissional *</Label>
              <Select
                value={watch('professional_id')?.toString()}
                onValueChange={(value) => setValue('professional_id', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um profissional" />
                </SelectTrigger>
                <SelectContent>
                  {professionals?.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id.toString()}>
                      {prof.display_name} - {prof.crp_crm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {organizerType === 'institution' && (
            <div>
              <Label>Selecionar Instituição *</Label>
              <Select
                value={watch('institution_id')}
                onValueChange={(value) => setValue('institution_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma instituição" />
                </SelectTrigger>
                <SelectContent>
                  {institutions?.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Capacidade */}
      <Card>
        <CardHeader>
          <CardTitle>Capacidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="max_participants">Máximo de participantes *</Label>
            <Input
              id="max_participants"
              type="number"
              min="10"
              max="500"
              {...register('max_participants', { required: true, valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              ⚠️ Google Meet Free: até 100 participantes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="meeting_link">Link da Reunião (Google Meet, Zoom, etc.)</Label>
            <Input
              id="meeting_link"
              type="url"
              {...register('meeting_link')}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
            />
          </div>
          <div>
            <Label htmlFor="whatsapp_group_link">Link do Grupo do WhatsApp</Label>
            <Input
              id="whatsapp_group_link"
              type="url"
              {...register('whatsapp_group_link' as any)}
              placeholder="https://chat.whatsapp.com/..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Restrição de Público */}
      <Card>
        <CardHeader>
          <CardTitle>Restrição de Público</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={audienceType}
            onValueChange={(value) => setValue('audience_type', value as any)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="audience_all" />
              <Label htmlFor="audience_all">Aberto para todos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="institutions" id="audience_institutions" />
              <Label htmlFor="audience_institutions">Restrito a instituições</Label>
            </div>
          </RadioGroup>

          {audienceType === 'institutions' && (
            <div className="space-y-2">
              <Label>Selecionar Instituições</Label>
              {institutions?.map((inst) => (
                <div key={inst.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`inst_${inst.id}`}
                    checked={selectedInstitutions.includes(inst.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedInstitutions([...selectedInstitutions, inst.id]);
                      } else {
                        setSelectedInstitutions(selectedInstitutions.filter(id => id !== inst.id));
                      }
                    }}
                  />
                  <Label htmlFor={`inst_${inst.id}`}>{inst.name}</Label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acessibilidade */}
      <Card>
        <CardHeader>
          <CardTitle>Acessibilidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_libras"
              checked={watch('has_libras')}
              onCheckedChange={(checked) => setValue('has_libras', checked as boolean)}
            />
            <Label htmlFor="has_libras">
              Esta sessão terá intérprete de LIBRAS
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={watch('status')}
            onValueChange={(value) => setValue('status', value as any)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="draft" id="status_draft" />
              <Label htmlFor="status_draft">Rascunho</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="scheduled" id="status_scheduled" />
              <Label htmlFor="status_scheduled">Publicar agora</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : session ? 'Atualizar Encontro' : 'Criar Encontro'}
        </Button>
      </div>
    </form>
  );
};
