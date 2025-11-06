import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tenant } from '@/types/tenant';

export interface TenantBrandingData {
  logo_url: string;
  favicon_url: string;
  hero_title: string;
  hero_subtitle: string;
  header_color?: string;
  primary_color: string;
  accent_color: string;
  secondary_color: string;
  hero_images: string[];
  hero_autoplay: boolean;
  hero_autoplay_delay: number;
}

export const useTenantBranding = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchBranding = useCallback(async (tenantId: string): Promise<TenantBrandingData | null> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error) throw error;
      if (!data) return null;

      const tenant = data as unknown as Tenant;
      
      return {
        logo_url: tenant.logo_url || '',
        favicon_url: tenant.favicon_url || '',
        hero_title: tenant.theme_config?.hero_title || 'Sua jornada de bem-estar começa aqui',
        hero_subtitle: tenant.theme_config?.hero_subtitle || 'Conecte-se com profissionais qualificados',
        primary_color: tenant.primary_color,
        accent_color: tenant.accent_color,
        secondary_color: tenant.theme_config?.secondary_color || tenant.primary_color,
        hero_images: tenant.theme_config?.hero_images || [],
        hero_autoplay: tenant.theme_config?.hero_autoplay ?? true,
        hero_autoplay_delay: tenant.theme_config?.hero_autoplay_delay || 5000,
      };
    } catch (error) {
      console.error('Erro ao buscar branding:', error);
      toast({
        title: 'Erro ao carregar configurações',
        description: 'Não foi possível carregar as configurações de branding.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateBranding = useCallback(async (
    tenantId: string,
    branding: TenantBrandingData
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('tenants')
        .update({
          logo_url: branding.logo_url,
          favicon_url: branding.favicon_url,
          primary_color: branding.primary_color,
          accent_color: branding.accent_color,
          theme_config: {
            secondary_color: branding.secondary_color,
            hero_title: branding.hero_title,
            hero_subtitle: branding.hero_subtitle,
            hero_images: branding.hero_images,
            hero_autoplay: branding.hero_autoplay,
            hero_autoplay_delay: branding.hero_autoplay_delay,
          },
        })
        .eq('id', tenantId);

      if (error) throw error;

      toast({
        title: 'Configurações salvas!',
        description: 'As configurações de branding foram atualizadas com sucesso.',
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar branding:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações de branding.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    fetchBranding,
    updateBranding,
  };
};
