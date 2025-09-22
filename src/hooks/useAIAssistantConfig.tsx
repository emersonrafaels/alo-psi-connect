import { usePublicConfig } from "./usePublicConfig";
import { useEffect, useMemo } from "react";
import { logConfigState, setConfigCacheVersion } from "@/utils/configCache";

export interface AIAssistantConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  initialMessage: string;
}

export const useAIAssistantConfig = () => {
  const { getConfig, loading } = usePublicConfig(['ai_assistant']);

  const getAIAssistantConfig = (): AIAssistantConfig => {
    const config = {
      enabled: getConfig('ai_assistant', 'enabled', true),
      title: getConfig('ai_assistant', 'title', 'Alô Psi Match'),
      subtitle: getConfig('ai_assistant', 'subtitle', 'Assistente de Saúde Mental'),
      initialMessage: getConfig('ai_assistant', 'initial_message', 'Olá! Como posso te ajudar a encontrar o profissional ideal?')
    };

    // Log current state for debugging
    logConfigState('useAIAssistantConfig', config);
    
    return config;
  };

  // Memoize config to prevent unnecessary re-renders
  const aiConfig = useMemo(() => getAIAssistantConfig(), [getConfig]);

  // Force cache refresh on config changes
  useEffect(() => {
    if (!loading) {
      const configVersion = Date.now().toString();
      setConfigCacheVersion(configVersion);
    }
  }, [loading]);

  return {
    getAIAssistantConfig,
    aiConfig,
    loading
  };
};