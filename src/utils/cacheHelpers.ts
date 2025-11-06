import { toast } from 'sonner';

/**
 * Limpa o cache de um tenant específico ou de todos os tenants
 * @param slug - Slug do tenant (opcional). Se não fornecido, limpa todos os caches de tenant
 */
export const clearTenantCache = (slug?: string) => {
  if (slug) {
    const key = `tenant_${slug}_cache`;
    localStorage.removeItem(key);
    console.log(`✅ Cache limpo para tenant: ${slug}`);
  } else {
    // Limpar todos os caches de tenant
    const keysToRemove = Object.keys(localStorage)
      .filter(key => key.startsWith('tenant_') && key.endsWith('_cache'));
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`✅ ${keysToRemove.length} caches de tenant limpos`);
  }
};

/**
 * Limpa todos os caches de tenant e recarrega a página
 */
export const clearAllTenantCaches = () => {
  clearTenantCache();
  toast.success('Cache de tenants limpo com sucesso');
  
  // Disparar evento para forçar atualização
  window.dispatchEvent(new Event('tenant-updated'));
  
  // Recarregar página para forçar nova busca
  setTimeout(() => window.location.reload(), 500);
};

/**
 * Dispara evento de atualização de tenant e limpa seu cache
 * @param slug - Slug do tenant atualizado
 */
export const invalidateTenantCache = (slug: string) => {
  clearTenantCache(slug);
  
  // Disparar evento customizado para forçar reload se for o tenant atual
  console.log('[CacheHelpers] Dispatching tenant-updated event for:', slug);
  window.dispatchEvent(new CustomEvent('tenant-updated', { 
    detail: { slug } 
  }));
};
