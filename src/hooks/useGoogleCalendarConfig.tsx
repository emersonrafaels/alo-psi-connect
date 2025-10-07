import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GoogleCalendarConfig {
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  lastSyncTimestamp: string | null;
  statistics: {
    last_run?: string;
    success_count?: number;
    error_count?: number;
    total_profiles?: number;
    errors?: string[];
  };
}

export const useGoogleCalendarConfig = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<GoogleCalendarConfig>({
    autoSyncEnabled: true,
    syncIntervalMinutes: 15,
    lastSyncTimestamp: null,
    statistics: {}
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('*')
        .eq('category', 'google_calendar');

      if (error) throw error;

      const configMap = new Map(data?.map(item => [item.key, item.value]) || []);

      const autoSyncValue = configMap.get('auto_sync_enabled');
      const intervalValue = configMap.get('sync_interval_minutes');
      const timestampValue = configMap.get('last_sync_timestamp');
      const statsValue = configMap.get('sync_statistics');

      setConfig({
        autoSyncEnabled: autoSyncValue === 'true' || autoSyncValue === true,
        syncIntervalMinutes: typeof intervalValue === 'string' ? parseInt(intervalValue) : (typeof intervalValue === 'number' ? intervalValue : 15),
        lastSyncTimestamp: timestampValue === 'null' || !timestampValue ? null : String(timestampValue),
        statistics: statsValue && typeof statsValue === 'string' 
          ? JSON.parse(statsValue)
          : (statsValue && typeof statsValue === 'object' ? statsValue as any : {})
      });
    } catch (error) {
      console.error('Error fetching Google Calendar config:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações do Google Calendar.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = useCallback(async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          category: 'google_calendar',
          key,
          value: typeof value === 'boolean' || typeof value === 'number' ? value.toString() : value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'category,key'
        });

      if (error) throw error;

      toast({
        title: "Configuração atualizada",
        description: "A configuração foi salva com sucesso.",
      });

      await fetchConfig();
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração.",
        variant: "destructive",
      });
    }
  }, [toast, fetchConfig]);

  const forceSync = useCallback(async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('google-calendar-cron', {
        body: {}
      });

      if (error) throw error;

      toast({
        title: "Sincronização iniciada",
        description: "A sincronização manual foi iniciada com sucesso.",
      });

      // Wait a bit and refresh config to show updated stats
      setTimeout(fetchConfig, 2000);
    } catch (error) {
      console.error('Error forcing sync:', error);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível iniciar a sincronização manual.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  }, [toast, fetchConfig]);

  return {
    config,
    loading,
    syncing,
    updateConfig,
    forceSync,
    refreshConfig: fetchConfig
  };
};
