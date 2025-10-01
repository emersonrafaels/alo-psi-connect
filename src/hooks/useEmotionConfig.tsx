import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface EmotionConfig {
  id: string;
  emotion_type: string;
  display_name: string;
  description?: string;
  scale_min: number;
  scale_max: number;
  emoji_set: Record<string, string>;
  color_scheme: {
    low: string;
    mid: string;
    high: string;
  };
  is_enabled: boolean;
  order_position: number;
}

export interface DefaultEmotionType {
  id: string;
  emotion_type: string;
  display_name: string;
  description?: string;
  default_scale_min: number;
  default_scale_max: number;
  default_emoji_set: Record<string, string>;
  default_color_scheme: {
    low: string;
    mid: string;
    high: string;
  };
  category: string;
  is_active: boolean;
}

export const useEmotionConfig = () => {
  const { user } = useAuth();
  const [userConfigs, setUserConfigs] = useState<EmotionConfig[]>([]);
  const [defaultTypes, setDefaultTypes] = useState<DefaultEmotionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<'basic' | 'advanced' | 'wellbeing' | 'professional' | 'custom' | null>(null);

  // Template detection
  const detectCurrentTemplate = useCallback((configs: EmotionConfig[]) => {
    const activeEmotions = configs.filter(c => c.is_enabled).map(c => c.emotion_type).sort();
    
    const templates = {
      basic: ['mood', 'anxiety', 'energy'].sort(),
      advanced: ['mood', 'anxiety', 'energy', 'stress', 'motivation', 'focus'].sort(),
      wellbeing: ['mood', 'energy', 'sleep_quality', 'gratitude', 'social_connection', 'physical_activity'].sort(),
      professional: ['mood', 'anxiety', 'energy', 'stress', 'motivation', 'focus', 'sleep_quality', 'gratitude', 'social_connection', 'physical_activity', 'productivity', 'creativity'].sort(),
    };

    for (const [name, emotions] of Object.entries(templates)) {
      if (JSON.stringify(activeEmotions) === JSON.stringify(emotions)) {
        return name as 'basic' | 'advanced' | 'wellbeing' | 'professional';
      }
    }
    
    return 'custom' as const;
  }, []);

  // Fetch default emotion types
  const fetchDefaultTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('default_emotion_types')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      setDefaultTypes((data || []) as unknown as DefaultEmotionType[]);
    } catch (err) {
      console.error('Error fetching default emotion types:', err);
      setError('Erro ao carregar tipos de emoções padrão');
    }
  };

  // Fetch user configurations
  const fetchUserConfigs = async () => {
    if (!user) {
      setUserConfigs([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('emotion_configurations')
        .select('*')
        .eq('user_id', user.id)
        .order('order_position', { ascending: true });

      if (error) throw error;
      const configs = (data || []) as unknown as EmotionConfig[];
      setUserConfigs(configs);
      setCurrentTemplate(detectCurrentTemplate(configs));
    } catch (err) {
      console.error('Error fetching user emotion configs:', err);
      setError('Erro ao carregar suas configurações de emoções');
    } finally {
      setLoading(false);
    }
  };

  // Initialize user with default basic emotions if they have none
  const initializeDefaultConfigs = async () => {
    if (!user || userConfigs.length > 0) return;

    const basicEmotions = defaultTypes.filter(type => type.category === 'basic');
    
    const configs = basicEmotions.map((emotion, index) => ({
      user_id: user.id,
      emotion_type: emotion.emotion_type,
      display_name: emotion.display_name,
      description: emotion.description,
      scale_min: emotion.default_scale_min,
      scale_max: emotion.default_scale_max,
      emoji_set: emotion.default_emoji_set,
      color_scheme: emotion.default_color_scheme,
      is_enabled: true,
      order_position: index,
    }));

    try {
      const { error } = await supabase
        .from('emotion_configurations')
        .insert(configs);

      if (error) throw error;
      await fetchUserConfigs();
    } catch (err) {
      console.error('Error initializing default configs:', err);
    }
  };

  // Add emotion to user's config
  const addEmotion = async (emotionType: string) => {
    if (!user) return;

    const defaultEmotion = defaultTypes.find(t => t.emotion_type === emotionType);
    if (!defaultEmotion) return;

    const maxPosition = Math.max(...userConfigs.map(c => c.order_position), -1);

    try {
      const { error } = await supabase
        .from('emotion_configurations')
        .insert({
          user_id: user.id,
          emotion_type: defaultEmotion.emotion_type,
          display_name: defaultEmotion.display_name,
          description: defaultEmotion.description,
          scale_min: defaultEmotion.default_scale_min,
          scale_max: defaultEmotion.default_scale_max,
          emoji_set: defaultEmotion.default_emoji_set,
          color_scheme: defaultEmotion.default_color_scheme,
          is_enabled: true,
          order_position: maxPosition + 1,
        });

      if (error) throw error;
      await fetchUserConfigs();
    } catch (err) {
      console.error('Error adding emotion:', err);
      throw err;
    }
  };

  // Add custom emotion
  const addCustomEmotion = async (
    displayName: string,
    scaleMin: number,
    scaleMax: number,
    emojiSet: Record<string, string>,
    colorScheme: Record<string, string>
  ) => {
    if (!user) return;

    try {
      const emotionType = `custom_${displayName.toLowerCase().replace(/\s+/g, '_')}`;
      
      // Check if emotion already exists
      const exists = userConfigs.some(c => c.emotion_type === emotionType);
      if (exists) throw new Error('Uma emoção com esse nome já existe');

      const maxPosition = Math.max(...userConfigs.map(c => c.order_position), -1);

      // Convert flat color scheme to required format
      const formattedColorScheme = {
        low: colorScheme[scaleMin.toString()],
        mid: colorScheme[Math.floor((scaleMax + scaleMin) / 2).toString()],
        high: colorScheme[scaleMax.toString()],
      };

      const { error } = await supabase
        .from('emotion_configurations')
        .insert({
          user_id: user.id,
          emotion_type: emotionType,
          display_name: displayName,
          description: `Emoção personalizada: ${displayName}`,
          scale_min: scaleMin,
          scale_max: scaleMax,
          emoji_set: emojiSet,
          color_scheme: formattedColorScheme,
          is_enabled: true,
          order_position: maxPosition + 1,
        });

      if (error) throw error;
      await fetchUserConfigs();
    } catch (err) {
      console.error('Error adding custom emotion:', err);
      throw err;
    }
  };

  // Remove emotion from user's config
  const removeEmotion = async (emotionType: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('emotion_configurations')
        .delete()
        .eq('user_id', user.id)
        .eq('emotion_type', emotionType);

      if (error) throw error;
      await fetchUserConfigs();
    } catch (err) {
      console.error('Error removing emotion:', err);
      throw err;
    }
  };

  // Update emotion configuration
  const updateEmotion = async (emotionType: string, updates: Partial<EmotionConfig>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('emotion_configurations')
        .update(updates)
        .eq('user_id', user.id)
        .eq('emotion_type', emotionType);

      if (error) throw error;
      await fetchUserConfigs();
    } catch (err) {
      console.error('Error updating emotion:', err);
      throw err;
    }
  };

  // Toggle emotion enabled status
  const toggleEmotion = async (emotionType: string) => {
    const config = userConfigs.find(c => c.emotion_type === emotionType);
    if (!config) return;

    await updateEmotion(emotionType, { is_enabled: !config.is_enabled });
  };

  // Reorder emotions
  const reorderEmotions = async (newOrder: string[]) => {
    if (!user) return;

    try {
      const updates = newOrder.map((emotionType, index) => 
        supabase
          .from('emotion_configurations')
          .update({ order_position: index })
          .eq('user_id', user.id)
          .eq('emotion_type', emotionType)
      );

      await Promise.all(updates);
      await fetchUserConfigs();
    } catch (err) {
      console.error('Error reordering emotions:', err);
      throw err;
    }
  };

  // Apply template
  const applyTemplate = async (category: 'basic' | 'advanced' | 'wellbeing' | 'professional') => {
    if (!user) return;

    // Clear existing configurations
    await supabase
      .from('emotion_configurations')
      .delete()
      .eq('user_id', user.id);

    // Get emotions for this category
    const emotionsForCategory = defaultTypes.filter(type => 
      category === 'basic' ? type.category === 'basic' :
      category === 'advanced' ? ['basic', 'advanced'].includes(type.category) :
      category === 'wellbeing' ? ['basic', 'wellbeing'].includes(type.category) :
      true // professional includes all
    );

    const configs = emotionsForCategory.map((emotion, index) => ({
      user_id: user.id,
      emotion_type: emotion.emotion_type,
      display_name: emotion.display_name,
      description: emotion.description,
      scale_min: emotion.default_scale_min,
      scale_max: emotion.default_scale_max,
      emoji_set: emotion.default_emoji_set,
      color_scheme: emotion.default_color_scheme,
      is_enabled: true,
      order_position: index,
    }));

    try {
      const { error } = await supabase
        .from('emotion_configurations')
        .insert(configs);

      if (error) throw error;
      await fetchUserConfigs();
    } catch (err) {
      console.error('Error applying template:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchDefaultTypes();
  }, []);

  useEffect(() => {
    if (defaultTypes.length > 0) {
      fetchUserConfigs();
    }
  }, [user, defaultTypes]);

  useEffect(() => {
    if (user && defaultTypes.length > 0 && userConfigs.length === 0 && !loading) {
      initializeDefaultConfigs();
    }
  }, [user, defaultTypes, userConfigs, loading]);

  const activeConfigs = userConfigs.filter(c => c.is_enabled);
  const availableEmotions = defaultTypes.filter(
    type => !userConfigs.some(c => c.emotion_type === type.emotion_type)
  );

  return {
    userConfigs,
    activeConfigs,
    defaultTypes,
    availableEmotions,
    loading,
    error,
    currentTemplate,
    addEmotion,
    addCustomEmotion,
    removeEmotion,
    updateEmotion,
    toggleEmotion,
    reorderEmotions,
    applyTemplate,
    refetch: fetchUserConfigs,
  };
};
