import { usePublicConfig } from "./usePublicConfig";

export interface ShareConfig {
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

export const useShareConfig = () => {
  const { getConfig, loading } = usePublicConfig(['diary_sharing']);

  const getShareConfig = (): ShareConfig => {
    return {
      shareTitle: getConfig('diary_sharing', 'share_title', '🌟 *Meu Diário Emocional - {date}*'),
      shareFooter: getConfig('diary_sharing', 'share_footer', '🌟 *Criado com {brand_name}* - Sua plataforma de bem-estar emocional\n💙 Experimente também: {website}'),
      brandName: getConfig('diary_sharing', 'brand_name', 'Rede Bem Estar'),
      website: getConfig('diary_sharing', 'website', 'alopsi.com.br'),
      metricsTitle: getConfig('diary_sharing', 'metrics_title', '📊 *Métricas do dia:*'),
      sleepTitle: getConfig('diary_sharing', 'sleep_title', '😴 *Sono:*'),
      tagsTitle: getConfig('diary_sharing', 'tags_title', '🏷️ *Tags:*'),
      reflectionsTitle: getConfig('diary_sharing', 'reflections_title', '📝 *Reflexões:*'),
      statsTitle: getConfig('diary_sharing', 'stats_title', '📈 *Minhas estatísticas:*')
    };
  };

  return {
    getShareConfig,
    loading
  };
};