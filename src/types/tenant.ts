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
  
  // Advanced branding - Header
  header_text_color_light?: string;
  header_text_color_dark?: string;
  logo_size?: number;
  
  // Advanced branding - Buttons
  button_bg_color_light?: string;
  button_bg_color_dark?: string;
  button_text_color_light?: string;
  button_text_color_dark?: string;
  
  // Specialty tags colors
  specialty_tag_bg_light?: string;
  specialty_tag_text_light?: string;
  specialty_tag_bg_dark?: string;
  specialty_tag_text_dark?: string;
  
  // AI Match button text
  ai_match_button_text?: string;
  
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
