/**
 * Utility functions for managing configuration cache
 */

export const clearConfigCache = () => {
  try {
    // Clear all AI assistant related cache
    const keysToRemove = [
      'ai_assistant_config_version',
      'public_config_cache',
      'config_last_update'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    console.log('✅ Configuration cache cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing configuration cache:', error);
    return false;
  }
};

export const forceConfigRefresh = () => {
  clearConfigCache();
  
  // Force page refresh if needed
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

export const getConfigCacheVersion = (): string => {
  return localStorage.getItem('ai_assistant_config_version') || '0';
};

export const setConfigCacheVersion = (version: string) => {
  localStorage.setItem('ai_assistant_config_version', version);
};

export const logConfigState = (context: string, config: any) => {
  console.log(`🔧 [${context}] AI Assistant Config:`, {
    enabled: config.enabled,
    title: config.title,
    cacheVersion: getConfigCacheVersion(),
    timestamp: new Date().toISOString()
  });
};