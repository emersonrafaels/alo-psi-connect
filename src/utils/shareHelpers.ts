import { DemoMoodEntry } from '@/hooks/useMoodExperience';
import { getAllEmotions, formatValue } from './emotionFormatters';

export interface UserEmotionConfig {
  emotion_type: string;
  display_name?: string;
}

interface ShareConfig {
  shareTitle: string;
  shareFooter: string;
  brandName: string;
  website: string;
  metricsTitle: string;
  sleepTitle: string;
  tagsTitle: string;
  reflectionsTitle: string;
  statsTitle: string;
}

const replaceVariables = (template: string, variables: Record<string, string>): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match);
};

export const generateWhatsAppMessage = (entry: DemoMoodEntry, stats?: any, config?: ShareConfig, userConfigs?: UserEmotionConfig[]) => {
  const date = new Date(entry.date).toLocaleDateString('pt-BR');
  
  // Usar configurações padrão se não fornecidas
  const defaultConfig: ShareConfig = {
    shareTitle: '🌟 *Meu Diário Emocional - {date}*',
    shareFooter: '🌟 *Criado com {brand_name}* - Sua plataforma de bem-estar emocional\n💙 Experimente também: {website}',
    brandName: 'AloPsi',
    website: 'alopsi.com.br',
    metricsTitle: '📊 *Métricas do dia:*',
    sleepTitle: '😴 *Sono:*',
    tagsTitle: '🏷️ *Tags:*',
    reflectionsTitle: '📝 *Reflexões:*',
    statsTitle: '📈 *Minhas estatísticas:*'
  };
  
  const shareConfig = config || defaultConfig;
  
  const variables = {
    date,
    brand_name: shareConfig.brandName,
    website: shareConfig.website
  };
  
  let message = replaceVariables(shareConfig.shareTitle, variables) + '\n\n';
  
  // Métricas principais - busca emoções dinâmicas
  const emotions = getAllEmotions(entry, userConfigs);
  if (emotions.length > 0) {
    message += `${shareConfig.metricsTitle}\n`;
    emotions.forEach(emotion => {
      message += `${emotion.emoji} ${emotion.name}: ${formatValue(emotion.value)}\n`;
    });
    message += '\n';
  }
  
  // Informações do sono
  if (entry.sleep_hours || entry.sleep_quality) {
    message += `${shareConfig.sleepTitle}\n`;
    if (entry.sleep_hours) {
      message += `⏰ Horas: ${entry.sleep_hours}h\n`;
    }
    if (entry.sleep_quality) {
      message += `⭐ Qualidade: ${entry.sleep_quality}/5\n`;
    }
    message += `\n`;
  }
  
  // Tags
  if (entry.tags && entry.tags.length > 0) {
    message += `${shareConfig.tagsTitle} ${entry.tags.join(', ')}\n\n`;
  }
  
  // Reflexões (limitado a 200 caracteres para WhatsApp)
  if (entry.journal_text) {
    const truncatedText = entry.journal_text.length > 200 
      ? entry.journal_text.substring(0, 200) + '...' 
      : entry.journal_text;
    message += `${shareConfig.reflectionsTitle}\n${truncatedText}\n\n`;
  }
  
  // Estatísticas gerais (se disponível)
  if (stats) {
    message += `${shareConfig.statsTitle}\n`;
    message += `📊 ${stats.totalEntries} ${stats.totalEntries === 1 ? 'entrada registrada' : 'entradas registradas'}\n`;
    if (stats.avgMood !== undefined && stats.avgMood > 0) {
      message += `😊 Humor médio: ${formatValue(stats.avgMood)}\n`;
    }
    if (stats.avgEnergy !== undefined && stats.avgEnergy > 0) {
      message += `⚡ Energia média: ${formatValue(stats.avgEnergy)}\n`;
    }
    if (stats.avgAnxiety !== undefined && stats.avgAnxiety > 0) {
      message += `😰 Ansiedade média: ${formatValue(stats.avgAnxiety)}\n`;
    }
    message += '\n';
  }
  
  message += replaceVariables(shareConfig.shareFooter, variables);
  
  return message;
};

export const generateEmailMessage = (entry: DemoMoodEntry, stats?: any, config?: ShareConfig, userConfigs?: UserEmotionConfig[]) => {
  const date = new Date(entry.date).toLocaleDateString('pt-BR');
  
  // Configurações padrão para email (sem asteriscos)
  const defaultConfig: ShareConfig = {
    shareTitle: '🌟 Meu Diário Emocional - {date}',
    shareFooter: '🌟 Criado com {brand_name} - Sua plataforma de bem-estar emocional\n💙 Experimente também: {website}',
    brandName: 'AloPsi',
    website: 'alopsi.com.br',
    metricsTitle: '📊 Métricas do dia:',
    sleepTitle: '😴 Sono:',
    tagsTitle: '🏷️ Tags:',
    reflectionsTitle: '📝 Reflexões:',
    statsTitle: '📈 Minhas estatísticas:'
  };
  
  const shareConfig = config || defaultConfig;
  
  const variables = {
    date,
    brand_name: shareConfig.brandName,
    website: shareConfig.website
  };
  
  let message = replaceVariables(shareConfig.shareTitle, variables) + '\n\n';
  
  // Métricas principais - busca emoções dinâmicas
  const emotions = getAllEmotions(entry, userConfigs);
  if (emotions.length > 0) {
    message += `${shareConfig.metricsTitle}\n`;
    emotions.forEach(emotion => {
      message += `${emotion.emoji} ${emotion.name}: ${formatValue(emotion.value)}\n`;
    });
    message += '\n';
  }
  
  // Informações do sono
  if (entry.sleep_hours || entry.sleep_quality) {
    message += `${shareConfig.sleepTitle}\n`;
    if (entry.sleep_hours) {
      message += `⏰ Horas: ${entry.sleep_hours}h\n`;
    }
    if (entry.sleep_quality) {
      message += `⭐ Qualidade: ${entry.sleep_quality}/5\n`;
    }
    message += `\n`;
  }
  
  // Tags
  if (entry.tags && entry.tags.length > 0) {
    message += `${shareConfig.tagsTitle} ${entry.tags.join(', ')}\n\n`;
  }
  
  // Reflexões
  if (entry.journal_text) {
    message += `${shareConfig.reflectionsTitle}\n${entry.journal_text}\n\n`;
  }
  
  // Estatísticas gerais (se disponível)
  if (stats) {
    message += `${shareConfig.statsTitle}\n`;
    message += `📊 ${stats.totalEntries} ${stats.totalEntries === 1 ? 'entrada registrada' : 'entradas registradas'}\n`;
    if (stats.avgMood !== undefined && stats.avgMood > 0) {
      message += `😊 Humor médio: ${formatValue(stats.avgMood)}\n`;
    }
    if (stats.avgEnergy !== undefined && stats.avgEnergy > 0) {
      message += `⚡ Energia média: ${formatValue(stats.avgEnergy)}\n`;
    }
    if (stats.avgAnxiety !== undefined && stats.avgAnxiety > 0) {
      message += `😰 Ansiedade média: ${formatValue(stats.avgAnxiety)}\n`;
    }
    message += '\n';
  }
  
  message += replaceVariables(shareConfig.shareFooter, variables);
  
  return message;
};

export const generateTelegramMessage = (entry: DemoMoodEntry, stats?: any, config?: ShareConfig, userConfigs?: UserEmotionConfig[]) => {
  const date = new Date(entry.date).toLocaleDateString('pt-BR');
  
  // Configurações padrão para Telegram (com markdown)
  const defaultConfig: ShareConfig = {
    shareTitle: '🌟 **Meu Diário Emocional - {date}**',
    shareFooter: '🌟 **Criado com {brand_name}** - Sua plataforma de bem-estar emocional\n💙 Experimente também: {website}',
    brandName: 'AloPsi',
    website: 'alopsi.com.br',
    metricsTitle: '📊 **Métricas do dia:**',
    sleepTitle: '😴 **Sono:**',
    tagsTitle: '🏷️ **Tags:**',
    reflectionsTitle: '📝 **Reflexões:**',
    statsTitle: '📈 **Minhas estatísticas:**'
  };
  
  const shareConfig = config || defaultConfig;
  
  const variables = {
    date,
    brand_name: shareConfig.brandName,
    website: shareConfig.website
  };
  
  let message = replaceVariables(shareConfig.shareTitle, variables) + '\n\n';
  
  // Métricas principais - busca emoções dinâmicas
  const emotions = getAllEmotions(entry, userConfigs);
  if (emotions.length > 0) {
    message += `${shareConfig.metricsTitle}\n`;
    emotions.forEach(emotion => {
      message += `${emotion.emoji} ${emotion.name}: ${formatValue(emotion.value)}\n`;
    });
    message += '\n';
  }
  
  // Informações do sono
  if (entry.sleep_hours || entry.sleep_quality) {
    message += `${shareConfig.sleepTitle}\n`;
    if (entry.sleep_hours) {
      message += `⏰ Horas: ${entry.sleep_hours}h\n`;
    }
    if (entry.sleep_quality) {
      message += `⭐ Qualidade: ${entry.sleep_quality}/5\n`;
    }
    message += `\n`;
  }
  
  // Tags
  if (entry.tags && entry.tags.length > 0) {
    message += `${shareConfig.tagsTitle} ${entry.tags.join(', ')}\n\n`;
  }
  
  // Reflexões (limitado a 4000 caracteres para Telegram)
  if (entry.journal_text) {
    const truncatedText = entry.journal_text.length > 500 
      ? entry.journal_text.substring(0, 500) + '...' 
      : entry.journal_text;
    message += `${shareConfig.reflectionsTitle}\n${truncatedText}\n\n`;
  }
  
  // Estatísticas gerais (se disponível)
  if (stats) {
    message += `${shareConfig.statsTitle}\n`;
    message += `📊 ${stats.totalEntries} ${stats.totalEntries === 1 ? 'entrada registrada' : 'entradas registradas'}\n`;
    if (stats.avgMood !== undefined && stats.avgMood > 0) {
      message += `😊 Humor médio: ${formatValue(stats.avgMood)}\n`;
    }
    if (stats.avgEnergy !== undefined && stats.avgEnergy > 0) {
      message += `⚡ Energia média: ${formatValue(stats.avgEnergy)}\n`;
    }
    if (stats.avgAnxiety !== undefined && stats.avgAnxiety > 0) {
      message += `😰 Ansiedade média: ${formatValue(stats.avgAnxiety)}\n`;
    }
    message += '\n';
  }
  
  message += replaceVariables(shareConfig.shareFooter, variables);
  
  return message;
};

export const shareWhatsApp = (entry: DemoMoodEntry, stats?: any, config?: ShareConfig, userConfigs?: UserEmotionConfig[]) => {
  const message = generateWhatsAppMessage(entry, stats, config, userConfigs);
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

export const shareTelegram = (entry: DemoMoodEntry, stats?: any, config?: ShareConfig, userConfigs?: UserEmotionConfig[]) => {
  const message = generateTelegramMessage(entry, stats, config, userConfigs);
  const encodedMessage = encodeURIComponent(message);
  const telegramUrl = `https://t.me/share/url?text=${encodedMessage}`;
  window.open(telegramUrl, '_blank');
};

export const shareEmail = (entry: DemoMoodEntry, stats?: any, config?: ShareConfig, userConfigs?: UserEmotionConfig[]) => {
  const message = generateEmailMessage(entry, stats, config, userConfigs);
  const subject = `Meu Diário Emocional - ${new Date(entry.date).toLocaleDateString('pt-BR')}`;
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(message);
  const emailUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
  window.open(emailUrl);
};

export const copyToClipboard = async (entry: DemoMoodEntry, stats?: any, config?: ShareConfig, userConfigs?: UserEmotionConfig[]): Promise<boolean> => {
  const text = generateEmailMessage(entry, stats, config, userConfigs);
  return copyTextToClipboard(text);
};

export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback para navegadores mais antigos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};