import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAdminAuth } from './useAdminAuth';

export interface AIDataSource {
  id: string;
  source_name: string;
  display_name: string;
  description?: string;
  enabled: boolean;
  privacy_level: 'public' | 'basic' | 'moderate' | 'complete';
  data_fields: {
    fields: string[];
  };
  created_at: string;
  updated_at: string;
}

export function useAIDataSources() {
  const [dataSources, setDataSources] = useState<AIDataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasRole } = useAdminAuth();
  const hasPermission = hasRole('admin') || hasRole('super_admin');
  const { toast } = useToast();

  const fetchDataSources = async () => {
    if (!hasPermission) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ai_data_sources')
        .select('*')
        .order('source_name');

      if (error) throw error;
      setDataSources((data || []).map(item => ({
        ...item,
        privacy_level: item.privacy_level as 'public' | 'basic' | 'moderate' | 'complete',
        data_fields: item.data_fields as { fields: string[] }
      })));
    } catch (error) {
      console.error('Error fetching AI data sources:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar fontes de dados do assistente IA',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDataSource = async (id: string, updates: Partial<AIDataSource>) => {
    try {
      const { error } = await supabase
        .from('ai_data_sources')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setDataSources(prev => 
        prev.map(source => 
          source.id === id ? { ...source, ...updates } : source
        )
      );

      toast({
        title: 'Sucesso',
        description: 'Configuração atualizada com sucesso',
      });
    } catch (error) {
      console.error('Error updating data source:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar configuração',
        variant: 'destructive',
      });
    }
  };

  const addCustomDataSource = async (dataSource: Omit<AIDataSource, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('ai_data_sources')
        .insert([dataSource])
        .select()
        .single();

      if (error) throw error;

      const newDataSource: AIDataSource = {
        ...data,
        privacy_level: data.privacy_level as 'public' | 'basic' | 'moderate' | 'complete',
        data_fields: data.data_fields as { fields: string[] }
      };
      
      setDataSources(prev => [...prev, newDataSource]);
      
      toast({
        title: 'Sucesso',
        description: 'Nova fonte de dados adicionada',
      });

      return data;
    } catch (error) {
      console.error('Error adding data source:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar fonte de dados',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteDataSource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_data_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDataSources(prev => prev.filter(source => source.id !== id));
      
      toast({
        title: 'Sucesso',
        description: 'Fonte de dados removida',
      });
    } catch (error) {
      console.error('Error deleting data source:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover fonte de dados',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchDataSources();
  }, [hasPermission]);

  return {
    dataSources,
    loading,
    hasPermission,
    updateDataSource,
    addCustomDataSource,
    deleteDataSource,
    refetch: fetchDataSources,
  };
}