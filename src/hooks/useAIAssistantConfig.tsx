import { usePublicConfig } from "./usePublicConfig";
import { useEffect, useMemo } from "react";
import { logConfigState, setConfigCacheVersion } from "@/utils/configCache";
import { useTenant } from "./useTenant";

export interface AIAssistantConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  initialMessage: string;
}

export const useAIAssistantConfig = () => {
  const { getConfig, loading } = usePublicConfig(['ai_assistant']);
  const { tenant } = useTenant();

  const getAIAssistantConfig = (): AIAssistantConfig => {
    const config = {
      enabled: getConfig('ai_assistant', 'enabled', true),
      title: tenant?.ai_match_button_text || getConfig('ai_assistant', 'title', 'Alô Psi Match'),
      subtitle: getConfig('ai_assistant', 'subtitle', 'Assistente de Saúde Mental • Te ajudo a encontrar o profissional ideal'),
      initialMessage: getConfig('ai_assistant', 'initial_message', '👋 Olá! Sou seu assistente de saúde mental especializado da AloPsi. Estou aqui para te ajudar a encontrar o profissional ideal para suas consultas online.\n\nComo posso te ajudar hoje?\n\n🔍 Sobre o que você gostaria de conversar:\n• Que tipo de apoio psicológico você está buscando?\n• Alguma especialidade específica (ansiedade, depressão, relacionamentos, etc.)?\n• Prefere Psicólogo(a), Psiquiatra(a) ou Psicoterapeuta(a)?\n\n⏰ Horários e disponibilidade:\n• Qual período prefere? (manhã, tarde ou noite)\n• Que dias da semana funcionam melhor para você?\n\n💰 Investimento:\n• Qual sua faixa de orçamento para as consultas?\n• Busca valores mais acessíveis ou tem flexibilidade?\n\n📱 Todas as consultas são realizadas online - você pode ter sessões de qualquer lugar')
    };

    // Log current state for debugging
    logConfigState('useAIAssistantConfig', config);
    
    return config;
  };

  // Memoize config to prevent unnecessary re-renders
  const aiConfig = useMemo(() => getAIAssistantConfig(), [getConfig, tenant?.id]);

  // Force cache refresh on config changes
  useEffect(() => {
    if (!loading) {
      const configVersion = Date.now().toString();
      setConfigCacheVersion(configVersion);
    }
  }, [loading, tenant?.id]);

  return {
    getAIAssistantConfig,
    aiConfig,
    loading
  };
};