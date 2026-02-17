import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type InstitutionNote = {
  id: string;
  institution_id: string;
  title: string;
  content: string | null;
  note_type: string;
  start_date: string | null;
  end_date: string | null;
  is_pinned: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CreateNoteData = {
  institution_id: string;
  title: string;
  content?: string;
  note_type: string;
  start_date?: string | null;
  end_date?: string | null;
  is_pinned?: boolean;
};

export type UpdateNoteData = Partial<CreateNoteData> & { id: string };

export function useInstitutionNotes(institutionId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['institution-notes', institutionId];

  const { data: notes = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!institutionId) return [];
      const { data, error } = await supabase
        .from('institution_notes')
        .select('*')
        .eq('institution_id', institutionId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as InstitutionNote[];
    },
    enabled: !!institutionId,
  });

  const createNote = useMutation({
    mutationFn: async (data: CreateNoteData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Não autenticado');
      const { error } = await supabase.from('institution_notes').insert({
        ...data,
        created_by: user.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Nota criada com sucesso');
    },
    onError: () => toast.error('Erro ao criar nota'),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...data }: UpdateNoteData) => {
      const { error } = await supabase
        .from('institution_notes')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Nota atualizada');
    },
    onError: () => toast.error('Erro ao atualizar nota'),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('institution_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Nota excluída');
    },
    onError: () => toast.error('Erro ao excluir nota'),
  });

  return { notes, isLoading, createNote, updateNote, deleteNote };
}
