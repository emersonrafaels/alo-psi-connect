import { MoodEntry } from '@/hooks/useMoodEntries';
import { DemoMoodEntry } from '@/hooks/useMoodExperience';

type EmotionEntry = MoodEntry | DemoMoodEntry;

/**
 * Formata um valor numérico com 1 casa decimal
 */
export const formatValue = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(1);
};

/**
 * Obtém valor de uma emoção, priorizando emotion_values e fazendo fallback para campos legados
 */
export const getEmotionValue = (
  entry: EmotionEntry,
  emotionKey: string,
  legacyField?: keyof EmotionEntry
): number | null => {
  // Primeiro tenta buscar em emotion_values
  if ('emotion_values' in entry && entry.emotion_values && typeof entry.emotion_values === 'object') {
    const emotionValues = entry.emotion_values as Record<string, any>;
    if (emotionKey in emotionValues && emotionValues[emotionKey] !== null && emotionValues[emotionKey] !== undefined) {
      return Number(emotionValues[emotionKey]);
    }
  }

  // Fallback para campo legado se fornecido
  if (legacyField && legacyField in entry) {
    const value = entry[legacyField];
    if (value !== null && value !== undefined) {
      return Number(value);
    }
  }

  return null;
};

/**
 * Formata um valor de emoção com escala
 */
export const formatEmotionValue = (
  entry: EmotionEntry,
  emotionKey: string,
  legacyField?: keyof EmotionEntry,
  maxScale: number = 5
): string => {
  const value = getEmotionValue(entry, emotionKey, legacyField);
  if (value === null) return 'N/A';
  return `${formatValue(value)}/${maxScale}`;
};

/**
 * Mapeamento padrão de nomes de emoções em português
 */
export const DEFAULT_EMOTION_NAMES: Record<string, string> = {
  mood: 'Humor',
  mood_score: 'Humor',
  energy: 'Energia',
  energy_level: 'Energia',
  anxiety: 'Ansiedade',
  anxiety_level: 'Ansiedade',
  stress: 'Estresse',
  stress_level: 'Estresse',
  motivation: 'Motivação',
  focus: 'Foco',
  gratitude: 'Gratidão',
  confidence: 'Confiança',
  hope: 'Esperança',
  creativity: 'Criatividade',
  productivity: 'Produtividade',
  satisfaction: 'Satisfação',
  sleep_quality: 'Qualidade do Sono',
  sleep_hours: 'Horas de sono',
  sleepHours: 'Horas de sono',
  horas_sono: 'Horas de sono',
  social_connection: 'Conexão Social',
  physical_health: 'Saúde Física',
};

/**
 * Obtém emojis padrão para tipos de emoção conhecidos
 */
export const getDefaultEmoji = (emotionType: string): string => {
  const emojiMap: Record<string, string> = {
    mood: '😊',
    mood_score: '😊',
    humor: '😊',
    energy: '⚡',
    energy_level: '⚡',
    energia: '⚡',
    anxiety: '😰',
    anxiety_level: '😰',
    ansiedade: '😰',
    stress: '😓',
    stress_level: '😓',
    estresse: '😓',
    sleep_quality: '⭐',
    qualidade_sono: '⭐',
    motivation: '🎯',
    focus: '🎯',
    foco: '🎯',
    gratitude: '🙏',
    gratidao: '🙏',
    confidence: '💪',
    confianca: '💪',
    hope: '✨',
    esperanca: '✨',
    creativity: '🎨',
    criatividade: '🎨',
    productivity: '📈',
    produtividade: '📈',
    satisfaction: '😌',
    satisfacao: '😌',
  };

  return emojiMap[emotionType.toLowerCase()] || '💭';
};

/**
 * Obtém o nome de exibição de uma emoção
 * Prioriza display_name das configurações do usuário, depois fallback para nomes padrão
 */
export const getEmotionDisplayName = (
  emotionType: string,
  userConfigs?: Array<{ emotion_type: string; display_name?: string }>
): string => {
  // Remove prefixo "custom_" se existir
  const cleanType = emotionType.replace(/^custom_/, '');
  
  // Busca nas configurações do usuário
  if (userConfigs) {
    const config = userConfigs.find(c => c.emotion_type === emotionType);
    if (config?.display_name) {
      return config.display_name;
    }
  }
  
  // Fallback para nomes padrão
  if (DEFAULT_EMOTION_NAMES[cleanType]) {
    return DEFAULT_EMOTION_NAMES[cleanType];
  }
  
  // Último fallback: capitaliza e remove underscores
  return cleanType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Calcula média de valores, ignorando nulls
 */
export const calculateAverage = (values: (number | null | undefined)[]): number => {
  const validValues = values.filter(v => v !== null && v !== undefined) as number[];
  if (validValues.length === 0) return 0;
  return validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
};

/**
 * Formata média com 1 casa decimal
 */
export const formatAverage = (values: (number | null | undefined)[]): string => {
  const avg = calculateAverage(values);
  return formatValue(avg);
};

/**
 * Get color class for an emotion value based on scale
 */
export const getEmotionColor = (value: number, scale: number = 5): string => {
  const percentage = (value / scale) * 100;
  if (percentage >= 80) return 'bg-emerald-500';
  if (percentage >= 60) return 'bg-yellow-500';
  if (percentage >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

/**
 * Get label for an emotion value based on scale
 */
export const getEmotionLabel = (value: number, scale: number = 5): string => {
  const percentage = (value / scale) * 100;
  if (percentage >= 80) return 'Excelente';
  if (percentage >= 60) return 'Bom';
  if (percentage >= 40) return 'Regular';
  return 'Ruim';
};

/**
 * Obtém todas as emoções disponíveis em uma entrada
 */
export const getAllEmotions = (
  entry: EmotionEntry,
  userConfigs?: Array<{ emotion_type: string; display_name?: string }>
): Array<{ key: string; value: number; emoji: string; name: string }> => {
  const emotions: Array<{ key: string; value: number; emoji: string; name: string }> = [];

  // Busca em emotion_values (dinâmico) - filtra apenas valores numéricos válidos.
  // Metadados de IA (risk_level, buddy_message, source, etc.) são armazenados em
  // mood_entry_analyses e nunca devem aparecer como emoção aqui.
  if ('emotion_values' in entry && entry.emotion_values && typeof entry.emotion_values === 'object') {
    const emotionValues = entry.emotion_values as Record<string, any>;
    Object.entries(emotionValues).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      const numeric = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(numeric)) return;
      emotions.push({
        key,
        value: numeric,
        emoji: getDefaultEmoji(key),
        name: getEmotionDisplayName(key, userConfigs)
      });
    });
  }

  // Fallback para campos legados se emotion_values estiver vazio
  if (emotions.length === 0) {
    const legacyFields: Array<{ key: keyof EmotionEntry; name: string; maxScale: number }> = [
      { key: 'mood_score', name: 'Humor', maxScale: 5 },
      { key: 'energy_level', name: 'Energia', maxScale: 5 },
      { key: 'anxiety_level', name: 'Ansiedade', maxScale: 5 },
    ];

    legacyFields.forEach(({ key, name }) => {
      const value = entry[key];
      if (value !== null && value !== undefined) {
        emotions.push({
          key: String(key),
          value: Number(value),
          emoji: getDefaultEmoji(String(key)),
          name
        });
      }
    });
  }

  return emotions;
};
