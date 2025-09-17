import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TestProfessionalPermissionsProps {
  professionalId?: number;
}

export const TestProfessionalPermissions: React.FC<TestProfessionalPermissionsProps> = ({ 
  professionalId 
}) => {
  const { toast } = useToast();

  const testUpdatePermission = async () => {
    if (!professionalId) {
      toast({
        title: "Erro",
        description: "ID do profissional não encontrado",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🧪 Testando permissões de atualização para profissional:', professionalId);
      
      // Primeiro, vamos verificar se podemos ler o profissional
      const { data: currentData, error: readError } = await supabase
        .from('profissionais')
        .select('id, ativo, display_name')
        .eq('id', professionalId)
        .single();

      if (readError) {
        throw new Error(`Erro ao ler profissional: ${readError.message}`);
      }

      console.log('✅ Leitura bem-sucedida:', currentData);

      // Agora vamos testar a atualização (alternando o status)
      const newStatus = !currentData.ativo;
      
      const { error: updateError } = await supabase
        .from('profissionais')
        .update({ ativo: newStatus })
        .eq('id', professionalId);

      if (updateError) {
        throw new Error(`Erro ao atualizar profissional: ${updateError.message}`);
      }

      console.log('✅ Atualização bem-sucedida! Novo status:', newStatus);

      // Reverter para o status original
      const { error: revertError } = await supabase
        .from('profissionais')
        .update({ ativo: currentData.ativo })
        .eq('id', professionalId);

      if (revertError) {
        console.warn('⚠️ Erro ao reverter status:', revertError.message);
      } else {
        console.log('✅ Status revertido com sucesso');
      }

      toast({
        title: "✅ Teste de Permissões",
        description: "Profissional tem permissão para atualizar seu próprio perfil!",
      });

    } catch (error: any) {
      console.error('❌ Erro no teste de permissões:', error);
      toast({
        title: "❌ Erro no Teste",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 border border-dashed rounded-lg">
      <h4 className="text-sm font-medium mb-2">🧪 Teste de Permissões</h4>
      <p className="text-xs text-muted-foreground mb-3">
        Teste se o profissional pode atualizar seu próprio status
      </p>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={testUpdatePermission}
        disabled={!professionalId}
      >
        Testar Permissões
      </Button>
    </div>
  );
};