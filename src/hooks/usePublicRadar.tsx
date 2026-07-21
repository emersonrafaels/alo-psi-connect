import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RadarAnswers } from '@/data/radarCatalog';
import { toast } from '@/hooks/use-toast';

export interface PublicInstitutionInfo {
  name: string;
  type?: string;
  city?: string;
  state?: string;
  website?: string;
}

export function useSubmitPublicRadar() {
  return useMutation({
    mutationFn: async (payload: { answers: RadarAnswers; institution: PublicInstitutionInfo }) => {
      const { data, error } = await supabase.functions.invoke('radar-public-submit', {
        body: payload,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { ok: true; id: string; token: string };
    },
    onError: (e: any) => {
      toast({ title: 'Erro ao enviar', description: e.message, variant: 'destructive' });
    },
  });
}

export function usePublicRadarByToken(token?: string | null) {
  return useQuery({
    queryKey: ['public-radar', token],
    enabled: !!token,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_radar_by_public_token', { _token: token });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row ?? null;
    },
    refetchInterval: (query) => {
      const d: any = query.state.data;
      return d && d.status !== 'submitted' ? 3000 : false;
    },
  });
}
