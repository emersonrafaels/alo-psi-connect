/**
 * Utility functions for managing configuration cache
 */

// Tipos de cache que podem ser limpos
export type CacheType = 'config' | 'mood' | 'forms' | 'session' | 'theme' | 'all';

export interface ClearCacheOptions {
  preserveTheme?: boolean;
  preserveAuth?: boolean;
  preserveLanguage?: boolean;
}

// Mapeamento de tipos de cache para suas chaves no localStorage/sessionStorage
const CACHE_KEYS = {
  config: [
    'ai_assistant_config_version',
    'public_config_cache',
    'config_last_update',
    'system_config_cache'
  ],
  mood: [
    'mood_entries_cache',
    'mood_analytics_cache',
    'mood_experience_cache'
  ],
  forms: [
    'form_drafts',
    'appointment_form_data',
    'profile_form_data'
  ],
  session: [
    'temp_session_data',
    'navigation_history',
    'scroll_positions'
  ],
  theme: [
    'theme',
    'ui-theme'
  ],
  auth: [
    'supabase.auth.token',
    'auth_session',
    'user_preferences'
  ],
  language: [
    'i18n-language',
    'preferred_language'
  ]
};

export const clearConfigCache = () => {
  try {
    // Clear all AI assistant related cache
    const keysToRemove = CACHE_KEYS.config;
    
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

export const clearAllCache = (options: ClearCacheOptions = {}) => {
  try {
    const {
      preserveTheme = false,
      preserveAuth = true, // Por segurança, preservamos auth por padrão
      preserveLanguage = true
    } = options;

    let clearedKeys = 0;
    const skipCategories: (keyof typeof CACHE_KEYS)[] = [];
    
    if (preserveTheme) skipCategories.push('theme');
    if (preserveAuth) skipCategories.push('auth');
    if (preserveLanguage) skipCategories.push('language');

    // Limpa todas as categorias exceto as preservadas
    Object.entries(CACHE_KEYS).forEach(([category, keys]) => {
      if (!skipCategories.includes(category as keyof typeof CACHE_KEYS)) {
        keys.forEach(key => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            clearedKeys++;
          }
          if (sessionStorage.getItem(key)) {
            sessionStorage.removeItem(key);
            clearedKeys++;
          }
        });
      }
    });

    console.log(`✅ All cache cleared successfully! ${clearedKeys} items removed`);
    return { success: true, itemsCleared: clearedKeys };
  } catch (error) {
    console.error('❌ Error clearing all cache:', error);
    return { success: false, itemsCleared: 0 };
  }
};

export const clearSpecificCache = (types: CacheType[], options: ClearCacheOptions = {}) => {
  try {
    let clearedKeys = 0;
    
    types.forEach(type => {
      if (type === 'all') {
        const result = clearAllCache(options);
        clearedKeys += result.itemsCleared;
        return;
      }

      const keys = CACHE_KEYS[type] || [];
      keys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          clearedKeys++;
        }
        if (sessionStorage.getItem(key)) {
          sessionStorage.removeItem(key);
          clearedKeys++;
        }
      });
    });

    console.log(`✅ Specific cache types cleared: ${types.join(', ')} - ${clearedKeys} items removed`);
    return { success: true, itemsCleared: clearedKeys };
  } catch (error) {
    console.error('❌ Error clearing specific cache:', error);
    return { success: false, itemsCleared: 0 };
  }
};

export const getCacheInfo = () => {
  const info: Record<string, { localStorage: number; sessionStorage: number }> = {};
  
  Object.entries(CACHE_KEYS).forEach(([category, keys]) => {
    info[category] = {
      localStorage: keys.filter(key => localStorage.getItem(key)).length,
      sessionStorage: keys.filter(key => sessionStorage.getItem(key)).length
    };
  });

  return info;
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