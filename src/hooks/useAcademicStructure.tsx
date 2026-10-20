import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AcademicLevel, AcademicUnit, normalizeLevels } from '@/features/academic/hierarchy';

const db = supabase as any;

export const useAcademicStructure = (institutionId?: string) => {
  const qc = useQueryClient();
  const enabled = !!institutionId;

  const levelsQ = useQuery({
    queryKey: ['academic-levels', institutionId],
    enabled,
    queryFn: async () => {
      const { data, error } = await db.from('educational_institutions').select('academic_hierarchy_levels').eq('id', institutionId).maybeSingle();
      if (error) throw error;
      return normalizeLevels(data?.academic_hierarchy_levels);
    },
  });

  const unitsQ = useQuery({
    queryKey: ['academic-units', institutionId],
    enabled,
    queryFn: async () => {
      const { data, error } = await db.from('institution_academic_units').select('*').eq('institution_id', institutionId);
      if (error) throw error;
      return (data || []) as AcademicUnit[];
    },
  });

  const placementsQ = useQuery({
    queryKey: ['academic-placements', institutionId],
    enabled,
    queryFn: async () => {
      const { data, error } = await db.from('patient_institution_placements').select('patient_id, class_unit_id').eq('institution_id', institutionId);
      if (error) throw error;
      return new Map<string, string>((data || []).map((p: any) => [p.patient_id, p.class_unit_id]));
    },
  });

  const onErr = (e: any) => toast.error(e?.message || 'Erro ao salvar');
  const inv = (k: string) => qc.invalidateQueries({ queryKey: [k, institutionId] });

  const setLevels = useMutation({
    mutationFn: async (levels: AcademicLevel[]) => {
      const { data, error } = await db.from('educational_institutions').update({ academic_hierarchy_levels: levels }).eq('id', institutionId).select('id');
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Você não tem permissão para atualizar esta instituição');
    },
    onSuccess: () => { inv('academic-levels'); toast.success('Modelo atualizado'); },
    onError: onErr,
  });

  const saveUnit = useMutation({
    mutationFn: async (u: { id?: string; level: AcademicLevel; name: string; parent_id: string | null }) => {
      const { error } = u.id
        ? await db.from('institution_academic_units').update({ name: u.name }).eq('id', u.id)
        : await db.from('institution_academic_units').insert({ ...u, institution_id: institutionId });
      if (error) throw error;
    },
    onSuccess: () => inv('academic-units'),
    onError: onErr,
  });

  const deleteUnit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('institution_academic_units').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { inv('academic-units'); inv('academic-placements'); },
    onError: onErr,
  });

  const assign = useMutation({
    mutationFn: async ({ patientIds, classId }: { patientIds: string[]; classId: string | null }) => {
      if (classId) {
        const rows = patientIds.map((patient_id) => ({ patient_id, institution_id: institutionId, class_unit_id: classId }));
        const { error } = await db.from('patient_institution_placements').upsert(rows, { onConflict: 'patient_id,institution_id' });
        if (error) throw error;
      } else {
        const { error } = await db.from('patient_institution_placements').delete().eq('institution_id', institutionId).in('patient_id', patientIds);
        if (error) throw error;
      }
    },
    onSuccess: () => { inv('academic-placements'); toast.success('Vínculo atualizado'); },
    onError: onErr,
  });

  return {
    levels: levelsQ.data || normalizeLevels(null),
    units: unitsQ.data || [],
    placements: placementsQ.data || new Map<string, string>(),
    isLoading: levelsQ.isLoading || unitsQ.isLoading || placementsQ.isLoading,
    setLevels, saveUnit, deleteUnit, assign,
  };
};
