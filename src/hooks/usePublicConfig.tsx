import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from './useTenant';

export interface PublicConfig {
  id: string;
  category: string;
  key: string;
  value: any;
  description?: string;
  updated_at: string;
  tenant_id?: string | null;
}

export const usePublicConfig = (allowedCategories?: string[]) => {
  const { tenant } = useTenant();
  const [configs, setConfigs] = useState<PublicConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('system_configurations')
        .select('*');

      // Filter by tenant (tenant-specific or global)
      if (tenant?.id) {
        query = query.or(`tenant_id.is.null,tenant_id.eq.${tenant.id}`);
      } else {
        query = query.is('tenant_id', null);
      }

      // Filter by allowed categories if specified
      if (allowedCategories && allowedCategories.length > 0) {
        query = query.in('category', allowedCategories);
      }

      const { data, error } = await query.order('category, key');

      if (error) {
        // Se há erro (provavelmente RLS), usar configurações padrão
        const defaultConfigs = [];
        
        if (allowedCategories?.includes('homepage')) {
          defaultConfigs.push(
            {
              id: 'default-homepage-1',
              category: 'homepage',
              key: 'hero_carousel_mode',
              value: 'false',
              updated_at: new Date().toISOString()
            },
            {
              id: 'default-homepage-2',
              category: 'homepage', 
              key: 'hero_images',
              value: '["https://alopsi-website.s3.us-east-1.amazonaws.com/imagens/homepage/Hero.png"]',
              updated_at: new Date().toISOString()
            }
          );
        }
        
        if (allowedCategories?.includes('system')) {
          defaultConfigs.push({
            id: 'default-system-1',
            category: 'system',
            key: 'guest_diary_limit',
            value: 10,
            updated_at: new Date().toISOString()
          });
        }
        
        setConfigs(defaultConfigs);
      } else {
        // Priorizar configurações tenant-específicas sobre globais
        const prioritizedConfigs = prioritizeByTenant(data || [], tenant?.id);
        setConfigs(prioritizedConfigs);
      }
    } catch (error) {
      console.error('Error fetching public configurations:', error);
      // Usar configurações padrão em caso de erro
      const defaultConfigs = [];
      
      if (allowedCategories?.includes('homepage')) {
        defaultConfigs.push(
          {
            id: 'default-homepage-1',
            category: 'homepage',
            key: 'hero_carousel_mode', 
            value: 'false',
            updated_at: new Date().toISOString()
          },
          {
            id: 'default-homepage-2',
            category: 'homepage',
            key: 'hero_images',
            value: '["https://alopsi-website.s3.us-east-1.amazonaws.com/imagens/homepage/Hero.png"]',
            updated_at: new Date().toISOString()
          }
        );
      }
      
      if (allowedCategories?.includes('system')) {
        defaultConfigs.push({
          id: 'default-system-1',
          category: 'system',
          key: 'guest_diary_limit',
          value: 10,
          updated_at: new Date().toISOString()
        });
      }
      
      setConfigs(defaultConfigs);
    } finally {
      setLoading(false);
    }
  };

  const getConfig = useCallback((category: string, key: string, defaultValue: any = null) => {
    const config = configs.find(c => c.category === category && c.key === key);
    if (!config) return defaultValue;
    
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
    
    // Tratar valores boolean vindos como string
    if (config.value === 'true') return true;
    if (config.value === 'false') return false;
    
    // Para valores simples (string, number, boolean), retorna diretamente
    return config.value;
  }, [configs]);

  const getConfigsByCategory = (category: string) => {
    return configs.filter(c => c.category === category);
  };

  useEffect(() => {
    fetchConfigs();
  }, [tenant?.id]);

  // Helper function to prioritize tenant-specific configs
  const prioritizeByTenant = (configs: PublicConfig[], tenantId?: string): PublicConfig[] => {
    const grouped = new Map<string, PublicConfig>();
    
    configs.forEach(config => {
      const key = `${config.category}:${config.key}`;
      const existing = grouped.get(key);
      
      // Se não existe ou o novo é tenant-específico, usa o novo
      if (!existing || (config.tenant_id === tenantId && existing.tenant_id === null)) {
        grouped.set(key, config);
      }
    });
    
    return Array.from(grouped.values());
  };

  return {
    configs,
    loading,
    getConfig,
    getConfigsByCategory,
    refetch: fetchConfigs
  };
};