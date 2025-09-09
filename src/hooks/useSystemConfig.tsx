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