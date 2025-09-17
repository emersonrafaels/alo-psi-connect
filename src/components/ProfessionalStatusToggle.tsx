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
    <div className="flex items-center gap-3 p-3 bg-card/60 rounded-lg border shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Label htmlFor="profile-status" className="text-sm font-medium whitespace-nowrap">
          Status
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
          <XCircle className="h-4 w-4 text-destructive" />
        )}
        <span className="text-xs text-muted-foreground">
          {professionalData.ativo ? "Visível" : "Oculto"}
        </span>
      </div>
    </div>
  );
};