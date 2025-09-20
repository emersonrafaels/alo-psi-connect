import { DemoMoodEntry } from '@/hooks/useMoodExperience';

export const generateWhatsAppMessage = (entry: DemoMoodEntry, stats?: any) => {
  const date = new Date(entry.date).toLocaleDateString('pt-BR');
  
  let message = `🌟 *Meu Diário Emocional - ${date}*\n\n`;
  
  // Métricas principais
  message += `📊 *Métricas do dia:*\n`;
  message += `😊 Humor: ${entry.mood_score}/10\n`;
  message += `⚡ Energia: ${entry.energy_level}/5\n`;
  message += `😰 Ansiedade: ${entry.anxiety_level}/5\n\n`;
  
  // Informações do sono
  if (entry.sleep_hours || entry.sleep_quality) {
    message += `😴 *Sono:*\n`;
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
    message += `🏷️ *Tags:* ${entry.tags.join(', ')}\n\n`;
  }
  
  // Reflexões (limitado a 200 caracteres para WhatsApp)
  if (entry.journal_text) {
    const truncatedText = entry.journal_text.length > 200 
      ? entry.journal_text.substring(0, 200) + '...' 
      : entry.journal_text;
    message += `📝 *Reflexões:*\n${truncatedText}\n\n`;
  }
  
  // Estatísticas gerais (se disponível)
  if (stats) {
    message += `📈 *Minhas estatísticas:*\n`;
    message += `📊 ${stats.totalEntries} entradas registradas\n`;
    message += `😊 Humor médio: ${stats.avgMood}/10\n`;
    message += `⚡ Energia média: ${stats.avgEnergy}/5\n`;
    message += `😰 Ansiedade média: ${stats.avgAnxiety}/5\n\n`;
  }
  
  message += `🌟 *Criado com AloPsi* - Sua plataforma de bem-estar emocional\n`;
  message += `💙 Experimente também: alopsi.com.br`;
  
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