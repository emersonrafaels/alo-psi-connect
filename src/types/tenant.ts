export interface Tenant {
  id: string;
  slug: string;
  name: string;
  base_path: string;
  logo_url: string | null;
  header_color?: string;
  primary_color: string;
  accent_color: string;
  secondary_color?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_images?: string[];
  hero_autoplay?: boolean;
  hero_autoplay_delay?: number;
  theme_config: {
    secondary_color?: string;
    muted_color?: string;
    [key: string]: any;
  };
  meta_config: {
    title: string;
    description: string;
    favicon: string;
  };
  is_active: boolean;
}

export interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: Error | null;
  refreshTenant: () => Promise<void>;
}

export const DEFAULT_TENANT_SLUG = 'alopsi';
