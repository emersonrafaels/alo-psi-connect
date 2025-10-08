import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export const AnalyticsSync = () => {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('aggregate-blog-analytics', {
        body: { mode: 'full', include_today: true }
      });
      
      if (error) throw error;

      const daysText = data?.processed_days === 1 ? 'dia' : 'dias';
      const postsText = data?.processed_posts === 1 ? 'post' : 'posts';
      
      toast({
        title: 'Sincronização concluída',
        description: `Processados ${data?.processed_days || 0} ${daysText}, ${data?.processed_posts || 0} ${postsText}, ${data?.total_views || 0} visualizações.`,
      });

      // Invalidar queries para refazer fetch dos dados
      queryClient.invalidateQueries({ queryKey: ['blogAnalyticsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['blogDailyAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['blogPostAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['curationStats'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsLastUpdate'] });
    } catch (error) {
      console.error('Erro ao sincronizar analytics:', error);
      toast({
        title: 'Erro na sincronização',
        description: error.message || 'Não foi possível sincronizar os analytics',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={syncing}
      variant="outline"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Sincronizando...' : 'Sincronizar Analytics'}
    </Button>
  );
};
