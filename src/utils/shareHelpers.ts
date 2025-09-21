import { DemoMoodEntry } from '@/hooks/useMoodExperience';

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

export const generateWhatsAppMessage = (entry: DemoMoodEntry, stats?: any, config?: ShareConfig) => {
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
  
  // Métricas principais
  message += `${shareConfig.metricsTitle}\n`;
  message += `😊 Humor: ${entry.mood_score}/10\n`;
  message += `⚡ Energia: ${entry.energy_level}/5\n`;
  message += `😰 Ansiedade: ${entry.anxiety_level}/5\n\n`;
  
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
    message += `📊 ${stats.totalEntries} entradas registradas\n`;
    message += `😊 Humor médio: ${stats.avgMood}/10\n`;
    message += `⚡ Energia média: ${stats.avgEnergy}/5\n`;
    message += `😰 Ansiedade média: ${stats.avgAnxiety}/5\n\n`;
  }
  
  message += replaceVariables(shareConfig.shareFooter, variables);
  
  return message;
};

export const shareWhatsApp = (message: string) => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

export const shareTelegram = (message: string) => {
  const encodedMessage = encodeURIComponent(message);
  const telegramUrl = `https://t.me/share/url?text=${encodedMessage}`;
  window.open(telegramUrl, '_blank');
};

export const shareEmail = (subject: string, body: string) => {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  const emailUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
  window.open(emailUrl);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
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