import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SystemConfig {
  id: string;
  category: string;
  key: string;
  value: any;
  description?: string;
  updated_at: string;
}

export const useSystemConfig = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_configurations')
        .select('*')
        .order('category, key');

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching system configurations:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações do sistema",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (category: string, key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          category,
          key,
          value: JSON.stringify(value),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      await fetchConfigs();
      toast({
        title: "Sucesso",
        description: "Configuração atualizada com sucesso"
      });
    } catch (error) {
      console.error('Error updating system configuration:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configuração",
        variant: "destructive"
      });
    }
  };

  const getConfig = (category: string, key: string, defaultValue: any = null) => {
    const config = configs.find(c => c.category === category && c.key === key);
    return config ? JSON.parse(config.value) : defaultValue;
  };

  const getConfigsByCategory = (category: string) => {
    return configs.filter(c => c.category === category);
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return {
    configs,
    loading,
    updateConfig,
    getConfig,
    getConfigsByCategory,
    refetch: fetchConfigs
  };
};