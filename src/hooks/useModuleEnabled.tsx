import { useTenant } from './useTenant';

export type ModuleName = 'blog' | 'mood_diary' | 'ai_assistant' | 'professionals' | 'appointments';

/**
 * Hook para verificar se um módulo específico está habilitado para o tenant atual
 * @param moduleName - Nome do módulo a verificar
 * @returns boolean - true se o módulo está habilitado
 */
export const useModuleEnabled = (moduleName: ModuleName): boolean => {
  const { tenant, loading } = useTenant();
  
  // Se ainda está carregando, assume que está habilitado para evitar flash
  if (loading) {
    return true;
  }
  
  // Se não há tenant ou modules_enabled, assume que está habilitado (fallback seguro)
  if (!tenant || !tenant.modules_enabled) {
    return true;
  }
  
  // Verifica se o módulo está explicitamente habilitado
  return tenant.modules_enabled[moduleName] !== false;
};
