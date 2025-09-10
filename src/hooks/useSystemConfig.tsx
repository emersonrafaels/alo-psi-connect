import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export interface SystemConfig {
  id: string;
  category: string;
  key: string;
  value: any;
  description?: string;
  updated_at: string;
}

export const useSystemConfig = (allowedCategories?: string[]) => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const { toast } = useToast();
  const { hasRole, loading: authLoading } = useAdminAuth();

  const fetchConfigs = async () => {
    if (!hasPermission) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('system_configurations')
        .select('*');

      // Filter by allowed categories if specified
      if (allowedCategories && allowedCategories.length > 0) {
        query = query.in('category', allowedCategories);
      }

      const { data, error } = await query.order('category, key');

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching system configurations:', error);
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (category: string, key: string, value: any) => {
    if (!hasPermission) {
      toast({
        title: "Erro",
        description: "Você não tem permissão para alterar configurações",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          category,
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'category,key'
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
    if (!config) return defaultValue;
    
    // Para campos de template, sempre retornar como string formatada
    if (key.endsWith('_template')) {
      // Se o valor já é um objeto/array, converte para string JSON formatada
      if (typeof config.value === 'object') {
        return JSON.stringify(config.value, null, 2);
      }
      
      // Se é uma string que parece com JSON, faz parse e re-stringify para formatar
      if (typeof config.value === 'string' && (config.value.startsWith('{') || config.value.startsWith('['))) {
        try {
          const parsed = JSON.parse(config.value);
          return JSON.stringify(parsed, null, 2);
        } catch (error) {
          console.warn(`Failed to parse JSON template value for ${category}.${key}:`, config.value);
          return config.value;
        }
      }
      
      // Para outros valores, retorna como string
      return String(config.value);
    }
    
    // Para configurações não-template, mantém a lógica original
    // Se o valor já é um objeto/array, retorna diretamente
    if (typeof config.value === 'object') {
      return config.value;
    }
    
    // Se é uma string que parece com JSON (inicia com { ou [), tenta fazer parse
    if (typeof config.value === 'string' && (config.value.startsWith('{') || config.value.startsWith('['))) {
      try {
        return JSON.parse(config.value);
      } catch (error) {
        console.warn(`Failed to parse JSON config value for ${category}.${key}:`, config.value);
        return config.value;
      }
    }
    
    // Para valores simples (string, number, boolean), retorna diretamente
    return config.value;
  };

  const getConfigsByCategory = (category: string) => {
    return configs.filter(c => c.category === category);
  };

  useEffect(() => {
    if (authLoading) return;

    // Check permissions based on allowed categories
    const isAdmin = hasRole('admin') || hasRole('super_admin');
    const isSuperAdmin = hasRole('super_admin');
    
    let permission = false;
    if (!allowedCategories || allowedCategories.length === 0) {
      // If no categories specified, require admin
      permission = isAdmin;
    } else if (allowedCategories.includes('system')) {
      // System configs require super_admin
      permission = isSuperAdmin;
    } else {
      // Other configs (ai_assistant, n8n) require admin or super_admin
      permission = isAdmin;
    }

    setHasPermission(permission);
  }, [hasRole, authLoading, allowedCategories]);

  useEffect(() => {
    if (!authLoading && hasPermission) {
      fetchConfigs();
    } else if (!authLoading && !hasPermission) {
      setLoading(false);
      setConfigs([]);
    }
  }, [hasPermission, authLoading]);

  return {
    configs,
    loading: loading || authLoading,
    hasPermission,
    updateConfig,
    getConfig,
    getConfigsByCategory,
    refetch: fetchConfigs
  };
};