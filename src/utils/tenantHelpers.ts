import { DEFAULT_TENANT_SLUG } from '@/types/tenant';

export { DEFAULT_TENANT_SLUG };

/**
 * Retorna o nome do tenant para exibição ao usuário
 * Normaliza "Medcos" para "MEDCOS" em uppercase
 * @param tenant - Objeto do tenant ou undefined
 * @param fallback - Nome padrão caso tenant seja undefined
 * @returns Nome normalizado para exibição
 */
export const getTenantDisplayName = (
  tenant: { slug?: string; name?: string } | null | undefined,
  fallback: string = 'Rede Bem Estar'
): string => {
  if (!tenant?.name) return fallback;
  
  // Normalizar MEDCOS para uppercase
  if (tenant.slug === 'medcos') {
    return 'MEDCOS';
  }
  
  return tenant.name;
};

/**
 * Detecta o slug do tenant baseado no pathname
 * @param pathname - window.location.pathname
 * @returns 'alopsi' ou 'medcos'
 */
export const getTenantSlugFromPath = (pathname: string): string => {
  if (pathname.startsWith('/medcos')) return 'medcos';
  return DEFAULT_TENANT_SLUG;
};

/**
 * Retorna o base path do tenant
 * @param tenantSlug - 'alopsi' ou 'medcos'
 * @returns '/' ou '/medcos'
 */
export const getBasePath = (tenantSlug: string): string => {
  return tenantSlug === 'medcos' ? '/medcos' : '';
};

/**
 * Constrói uma URL com o prefixo do tenant
 * @param tenantSlug - 'alopsi' ou 'medcos'
 * @param path - '/profissionais', '/blog', etc
 * @returns '/profissionais' ou '/medcos/profissionais'
 */
export const buildTenantPath = (tenantSlug: string, path: string): string => {
  const base = getBasePath(tenantSlug);
  // Remove barra duplicada se path já começar com /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

/**
 * Remove o prefixo do tenant do pathname
 * @param pathname - '/medcos/profissionais' ou '/profissionais'
 * @returns '/profissionais'
 */
export const stripTenantPath = (pathname: string): string => {
  return pathname.replace(/^\/medcos/, '') || '/';
};

/**
 * Verifica se o pathname pertence a um tenant específico
 * @param pathname - window.location.pathname
 * @param tenantSlug - 'alopsi' ou 'medcos'
 */
export const isPathForTenant = (pathname: string, tenantSlug: string): boolean => {
  const detectedSlug = getTenantSlugFromPath(pathname);
  return detectedSlug === tenantSlug;
};

/**
 * Limpa cache local de profissionais ao mudar de tenant
 */
export const clearTenantCache = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('professional_')) {
      localStorage.removeItem(key);
    }
  });
};
