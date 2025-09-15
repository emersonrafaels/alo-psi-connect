import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { useToast } from '@/hooks/use-toast';

export interface MoodEntry {
  id: string;
  user_id: string;
  profile_id: string;
  date: string;
  mood_score: number;
  energy_level: number;
  anxiety_level: number;
  sleep_hours?: number;
  sleep_quality?: number;
  journal_text?: string;
  tags?: string[];
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
  const { toast } = useToast();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching mood entries:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar suas entradas do diário.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createEntry = async (entryData: Omit<MoodEntry, 'id' | 'user_id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !profile) {
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
  };

  const updateEntry = async (id: string, entryData: Partial<MoodEntry>) => {
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .update(entryData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Entrada atualizada com sucesso!",
      });

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
  };

  const deleteEntry = async (id: string) => {
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
  };

  const getEntryByDate = async (date: string): Promise<MoodEntry | null> => {
    if (!user || !profile) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking existing entry:', error);
      return null;
    }
  };

  const createOrUpdateEntry = async (entryData: Omit<MoodEntry, 'id' | 'user_id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !profile) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar uma entrada.",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Check if entry already exists for this date
      const existingEntry = await getEntryByDate(entryData.date);
      
      if (existingEntry) {
        // Update existing entry
        const { data, error } = await supabase
          .from('mood_entries')
          .update(entryData)
          .eq('id', existingEntry.id)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Entrada atualizada com sucesso!",
        });

        fetchEntries();
        return data;
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('mood_entries')
          .insert({
            ...entryData,
            user_id: user.id,
            profile_id: profile.id,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Entrada do diário criada com sucesso!",
        });

        fetchEntries();
        return data;
      }
    } catch (error) {
      console.error('Error saving mood entry:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a entrada do diário.",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [user, profile]);

  return {
    entries,
    loading,
    createEntry,
    updateEntry,
    deleteEntry,
    getEntryByDate,
    createOrUpdateEntry,
    refetch: fetchEntries,
  };
};