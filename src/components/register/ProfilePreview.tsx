import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Edit2, Check, Clock, DollarSign, Calendar } from 'lucide-react';
import { getIllustrativeAvatar, hasCustomPhoto } from '@/utils/avatarHelpers';

interface ProfilePreviewProps {
  formData: any;
  onEdit: (step: number) => void;
}

const DAYS_LABELS: Record<string, string> = {
  mon: 'Segunda',
  tue: 'Terça',
  wed: 'Quarta',
  thu: 'Quinta',
  fri: 'Sexta',
  sat: 'Sábado',
  sun: 'Domingo'
};

export const ProfilePreview = ({ formData, onEdit }: ProfilePreviewProps) => {
  const getInitials = () => {
    return formData.nome
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Gerar avatar ilustrativo se não houver foto
  const avatarUrl = formData.fotoPerfilUrl 
    ? formData.fotoPerfilUrl 
    : getIllustrativeAvatar(formData.genero, formData.raca, formData.nome);
  
  const hasUploadedPhoto = hasCustomPhoto(formData.fotoPerfilUrl);

  const formatSchedule = () => {
    const scheduleByDay = formData.horarios.reduce((acc: any, slot: any) => {
      if (!acc[slot.day]) acc[slot.day] = [];
      acc[slot.day].push(`${slot.startTime}-${slot.endTime}`);
      return acc;
    }, {});

    return Object.entries(scheduleByDay).map(([day, times]) => (
      <div key={day} className="flex items-start gap-2">
        <Badge variant="outline" className="min-w-[80px]">
          {DAYS_LABELS[day as keyof typeof DAYS_LABELS]}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {(times as string[]).join(', ')}
        </span>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Revise suas informações</h3>
        <p className="text-sm text-muted-foreground">
          Confira se tudo está correto antes de finalizar o cadastro
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Cabeçalho do perfil */}
          <div className="flex flex-col items-center gap-4">
            {/* Avatar centralizado */}
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
              
              {/* Mensagem sobre a foto */}
              {hasUploadedPhoto && (
                <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                  Sua foto será exibida após o cadastro ser completado
                </p>
              )}
              {!hasUploadedPhoto && (
                <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                  Avatar ilustrativo (você pode adicionar sua foto depois)
                </p>
              )}
            </div>

            {/* Informações do profissional */}
            <div className="flex-1 space-y-2 text-center w-full">
              <div className="flex flex-col items-center gap-2">
                <div>
                  <h4 className="text-xl font-semibold">{formData.nome}</h4>
                  <p className="text-sm text-muted-foreground">{formData.profissao}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(1)}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary">
                  {formData.crpCrm}
                </Badge>
                {formData.possuiEPsi === 'sim' && (
                  <Badge variant="secondary">
                    <Check className="h-3 w-3 mr-1" />
                    E-Psi
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Resumo Profissional */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-medium">Resumo Profissional</h5>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(4)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {formData.resumoProfissional}
            </p>
          </div>

          <Separator />

          {/* Especialidades */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-medium">Especialidades</h5>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(5)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.especialidades.map((esp: string) => (
                <Badge key={esp} variant="outline">{esp}</Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Preço */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Preço da Consulta</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                R$ {parseFloat(formData.precoConsulta || '0').toFixed(2)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(5)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Horários */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h5 className="font-medium">Disponibilidade</h5>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(6)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
            {formData.horarios.length > 0 ? (
              <>
                <div className="space-y-2">
                  {formatSchedule()}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Consultas de {formData.intervaloHorarios} minutos</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum horário cadastrado</p>
            )}
          </div>

          <Separator />

          {/* Dados de Contato */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-medium">Contato</h5>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(3)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{formData.email}</p>
              {formData.linkedin && (
                <a 
                  href={formData.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
        <p className="text-sm text-center text-blue-900 dark:text-blue-100">
          ✓ Após confirmar, você receberá um email para ativar sua conta
        </p>
      </div>
    </div>
  );
};
