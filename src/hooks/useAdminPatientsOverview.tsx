import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PatientOverviewRow {
  profile_id: string;
  user_id: string;
  nome: string | null;
  email: string | null;
  data_nascimento: string | null;
  genero: string | null;
  foto_perfil_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  tenant_id: string | null;
  patient_id: string | null;
  eh_estudante: boolean;
  institutions: { name: string; type: string; status: string }[];
  mood: { total: number; last30: number; last_date: string | null };
  sessions: { upcoming: number; past: number };
  appointments: { upcoming: number; past: number };
  scales: { filled: number; required: number; missing: string[]; complete: boolean };
  iseu: { score: number | null; band: 'verde' | 'amarelo' | 'laranja' | 'vermelho' | null; computed_at: string | null };
}

export const useAdminPatientsOverview = (params: {
  search?: string;
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ['admin-patients-overview', params],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-patients-overview', {
        body: { action: 'list', ...params },
      });
      if (error) throw error;
      return data as { rows: PatientOverviewRow[]; total: number; page: number; pageSize: number };
    },
  });
};

export const useAdminPatientDetail = (profileId: string | null) => {
  return useQuery({
    queryKey: ['admin-patient-detail', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-patients-overview', {
        body: { action: 'detail', profile_id: profileId },
      });
      if (error) throw error;
      return data as any;
    },
  });
};
