import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { useTenant } from './useTenant';
import { useToast } from '@/hooks/use-toast';
import { normalizeDateForStorage } from '@/lib/utils';

export interface MoodEntry {
  id: string;
  user_id: string;
  profile_id: string;
  date: string;
  mood_score?: number | null;
  energy_level?: number | null;
  anxiety_level?: number | null;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  journal_text?: string | null;
  audio_url?: string | null;
  tags?: string[] | null;
  emotion_values?: Record<string, number>; // Dynamic emotion values
  created_at: string;
  updated_at: string;
}

export interface MoodFactor {
  id: string;
  mood_entry_id: string;
  factor_type: string;
  factor_value: any;
  created_at: string;
}

export const useMoodEntries = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const { toast } = useToast();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const fetchEntries = useCallback(async () => {
    // Evitar múltiplos fetches simultâneos
    if (fetchingRef.current || !user || !profile || !tenantId) {
      if (!user || !profile) {
        setLoading(false);
      }
      return;
    }

    fetchingRef.current = true;
    
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false });

      if (error) throw error;
      setEntries((data || []) as MoodEntry[]);
    } catch (error) {
      console.error('Error fetching mood entries:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar suas entradas do diário.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user?.id, profile?.id, tenantId, toast]);

  const createEntry = useCallback(async (entryData: Omit<MoodEntry, 'id' | 'user_id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !profile || !tenantId) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar uma entrada.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .insert({
          ...entryData,
          user_id: user.id,
          profile_id: profile.id,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Entrada do diário criada com sucesso!",
      });

      fetchEntries(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error creating mood entry:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a entrada do diário.",
        variant: "destructive",
      });
      return null;
    }
  }, [user, profile, tenantId, fetchEntries, toast]);

  const updateEntry = useCallback(async (id: string, entryData: Partial<MoodEntry>) => {
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .update(entryData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('Entry updated successfully');

      fetchEntries(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error updating mood entry:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a entrada.",
        variant: "destructive",
      });
      return null;
    }
  }, [fetchEntries, toast]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('mood_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Entrada excluída com sucesso!",
      });

      fetchEntries(); // Refresh the list
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a entrada.",
        variant: "destructive",
      });
    }
  }, [fetchEntries, toast]);

  const getEntryByDate = useCallback(async (date: string): Promise<MoodEntry | null> => {
    if (!user || !profile || !tenantId) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId)
        .eq('date', date)
        .maybeSingle();

      if (error) throw error;
      return data as MoodEntry | null;
    } catch (error) {
      console.error('Error checking existing entry:', error);
      return null;
    }
  }, [user, tenantId]);

  const getEntryById = useCallback(async (id: string): Promise<MoodEntry | null> => {
    if (!user) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id) // Security: ensure entry belongs to user
        .maybeSingle();

      if (error) throw error;
      return data as MoodEntry | null;
    } catch (error) {
      console.error('Error fetching entry by ID:', error);
      return null;
    }
  }, [user]);

  const createOrUpdateEntry = useCallback(async (entryData: Omit<MoodEntry, 'id' | 'user_id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !profile || !tenantId) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar uma entrada.",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Normalize the date to prevent timezone issues
      const normalizedDate = normalizeDateForStorage(entryData.date);
      
      // Clean undefined values - convert to null or remove them
      const cleanData = Object.entries(entryData).reduce((acc, [key, value]) => {
        if (value === undefined) {
          // For nullable fields, use null instead of undefined
          if (['mood_score', 'energy_level', 'anxiety_level', 'sleep_hours', 'sleep_quality', 'journal_text', 'audio_url', 'tags'].includes(key)) {
            acc[key] = null;
          }
          // Skip undefined values for other fields
        } else if (value === '' && ['journal_text', 'audio_url'].includes(key)) {
          // Convert empty strings to null for text fields
          acc[key] = null;
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const normalizedEntryData = { ...cleanData, date: normalizedDate };
      
      console.log('🧹 Cleaned entry data:', normalizedEntryData);
      
      const { data, error } = await supabase
        .from('mood_entries')
        .upsert(
          {
            ...normalizedEntryData,
            user_id: user.id,
            profile_id: profile.id,
            tenant_id: tenantId,
          },
          { onConflict: 'user_id,date' }
        )
        .select()
        .single();

      if (error) {
        console.error('Supabase upsert error:', error);
        throw new Error(`Erro ao salvar entrada: ${error.message}`);
      }

      console.log('Entry saved successfully:', data.id);
      toast({
        title: "Sucesso",
        description: "Entrada do diário salva com sucesso!",
      });
      fetchEntries();
      return data;
    } catch (error) {
      console.error('💥 Error in createOrUpdateEntry:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível salvar a entrada do diário.",
        variant: "destructive",
      });
      return null;
    }
  }, [user, profile, tenantId, getEntryByDate, fetchEntries, toast]);

  useEffect(() => {
    // Só executa quando temos usuário e perfil estáveis
    if (user?.id && profile?.id && tenantId && !fetchingRef.current) {
      fetchEntries();
    }
  }, [user?.id, profile?.id, tenantId, fetchEntries]);

  return {
    entries,
    loading,
    createEntry,
    updateEntry,
    deleteEntry,
    getEntryByDate,
    getEntryById,
    createOrUpdateEntry,
    refetch: fetchEntries,
  };
};