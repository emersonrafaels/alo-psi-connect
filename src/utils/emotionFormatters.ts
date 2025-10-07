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
  maxScale: number = 10
): string => {
  const value = getEmotionValue(entry, emotionKey, legacyField);
  if (value === null) return 'N/A';
  return `${formatValue(value)}/${maxScale}`;
};

/**
 * Obtém emojis padrão para tipos de emoção conhecidos
 */
export const getDefaultEmoji = (emotionType: string): string => {
  const emojiMap: Record<string, string> = {
    mood: '😊',
    humor: '😊',
    energy: '⚡',
    energia: '⚡',
    anxiety: '😰',
    ansiedade: '😰',
    stress: '😓',
    estresse: '😓',
    sleep_quality: '⭐',
    qualidade_sono: '⭐',
  };

  return emojiMap[emotionType.toLowerCase()] || '💭';
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
 * Obtém todas as emoções disponíveis em uma entrada
 */
export const getAllEmotions = (entry: EmotionEntry): Array<{ key: string; value: number; emoji: string; name: string }> => {
  const emotions: Array<{ key: string; value: number; emoji: string; name: string }> = [];

  // Busca em emotion_values (dinâmico)
  if ('emotion_values' in entry && entry.emotion_values && typeof entry.emotion_values === 'object') {
    const emotionValues = entry.emotion_values as Record<string, any>;
    Object.entries(emotionValues).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        emotions.push({
          key,
          value: Number(value),
          emoji: getDefaultEmoji(key),
          name: key.charAt(0).toUpperCase() + key.slice(1)
        });
      }
    });
  }

  // Fallback para campos legados se emotion_values estiver vazio
  if (emotions.length === 0) {
    const legacyFields: Array<{ key: keyof EmotionEntry; name: string; maxScale: number }> = [
      { key: 'mood_score', name: 'Humor', maxScale: 10 },
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
