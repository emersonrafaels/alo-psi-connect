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
  
  // Fase 1: Contato e Footer
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  contact_whatsapp?: string;
  social_instagram?: string;
  social_facebook?: string;
  social_linkedin?: string;
  cnpj?: string;
  razao_social?: string;
  footer_bg_color_light?: string;
  footer_bg_color_dark?: string;
  footer_text_color_light?: string;
  footer_text_color_dark?: string;
  
  // Fase 2: Módulos, CTAs e Tipografia
  modules_enabled?: {
    blog?: boolean;
    mood_diary?: boolean;
    ai_assistant?: boolean;
    professionals?: boolean;
    appointments?: boolean;
    [key: string]: boolean | undefined;
  };
  cta_primary_text?: string;
  cta_secondary_text?: string;
  hero_cta_text?: string;
  font_family_headings?: string;
  font_family_body?: string;
  
  // Fase 3: SEO, Email e Agendamento
  meta_keywords?: string[];
  social_share_image?: string;
  google_analytics_id?: string;
  google_tag_manager_id?: string;
  email_sender_name?: string;
  email_sender_email?: string;
  email_support_email?: string;
  booking_min_hours_notice?: number;
  booking_max_days_ahead?: number;
  payment_methods?: {
    mercadopago?: boolean;
    stripe?: boolean;
    [key: string]: boolean | undefined;
  };
  welcome_message?: string;
  empty_state_message?: string;
  fallback_professional_image?: string;
  terms_url?: string;
  privacy_url?: string;
  
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
