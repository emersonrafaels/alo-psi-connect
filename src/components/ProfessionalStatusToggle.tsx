import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ProfessionalStatusToggleProps {
  professionalData: {
    id: number;
    ativo: boolean;
    display_name: string;
  } | null;
  onUpdate: (isActive: boolean) => void;
}

export const ProfessionalStatusToggle: React.FC<ProfessionalStatusToggleProps> = ({
  professionalData,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleToggle = async (checked: boolean) => {
    if (!professionalData) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profissionais')
        .update({ ativo: checked })
        .eq('id', professionalData.id);

      if (error) throw error;

      onUpdate(checked);
      
      toast({
        title: checked ? "Perfil ativado" : "Perfil desativado",
        description: checked 
          ? "Seu perfil está agora visível e disponível para agendamentos."
          : "Seu perfil foi desativado e não receberá novos agendamentos.",
        variant: checked ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Não foi possível atualizar o status do perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!professionalData) return null;

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="pt-6 pb-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="profile-status" className="text-sm font-medium">
              Status do perfil
            </Label>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                id="profile-status"
                checked={professionalData.ativo}
                onCheckedChange={handleToggle}
                disabled={loading}
              />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {professionalData.ativo ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <Badge 
              variant={professionalData.ativo ? "default" : "secondary"}
              className="text-xs"
            >
              {professionalData.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {professionalData.ativo 
              ? "Seu perfil está visível e disponível para agendamentos"
              : "Seu perfil está oculto e não receberá novos agendamentos"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};