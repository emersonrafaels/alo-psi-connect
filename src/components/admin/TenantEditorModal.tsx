import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { FieldWithTooltip } from "@/components/register/FieldWithTooltip";
import { invalidateTenantCache } from "@/utils/cacheHelpers";
import {
  ContactConfigTab,
  FooterConfigTab,
  ModulesConfigTab,
  CTAConfigTab,
  TypographyConfigTab,
  SEOConfigTab,
  EmailConfigTab,
  BookingConfigTab
} from "./TenantConfigTabs";

interface Tenant {
  id: string;
  slug: string;
  name: string;
  base_path: string;
  logo_url: string | null;
  logo_url_dark?: string | null;
  switcher_logo_url?: string | null;
  switcher_logo_url_dark?: string | null;
  header_color?: string;
  primary_color: string;
  accent_color: string;
  secondary_color?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_images?: string[];
  hero_autoplay?: boolean;
  hero_autoplay_delay?: number;
  about_images?: string[];
  about_autoplay?: boolean;
  about_autoplay_delay?: number;
  header_text_color_light?: string;
  header_text_color_dark?: string;
  logo_size?: number;
  button_bg_color_light?: string;
  button_bg_color_dark?: string;
  button_text_color_light?: string;
  button_text_color_dark?: string;
  specialty_tag_bg_light?: string;
  specialty_tag_text_light?: string;
  specialty_tag_bg_dark?: string;
  specialty_tag_text_dark?: string;
  ai_match_button_text?: string;
  favicon_url?: string;
  fallback_professional_image?: string;
  // Contact information
  contact_phone?: string;
  contact_whatsapp?: string;
  contact_email?: string;
  contact_address?: string;
  cnpj?: string;
  razao_social?: string;
  // Social media
  social_instagram?: string;
  social_facebook?: string;
  social_linkedin?: string;
  // Domain redirect configuration
  domain_redirect_enabled?: boolean;
  domain_redirect_from?: string[];
  domain_redirect_to?: string;
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

interface TenantEditorModalProps {
  tenant: Tenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const TenantEditorModal = ({ tenant, open, onOpenChange, onSuccess }: TenantEditorModalProps) => {
  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    base_path: "",
    logo_url: "",
    logo_url_dark: "",
    switcher_logo_url: "",
    switcher_logo_url_dark: "",
    footer_logo_url: "",
    footer_logo_url_dark: "",
    feature_logo_url: "",
    feature_logo_url_dark: "",
    header_color: "",
    primary_color: "#0ea5e9",
    accent_color: "#06b6d4",
    secondary_color: "#6366f1",
    hero_title: "",
    hero_subtitle: "",
    hero_images: [] as string[],
    hero_autoplay: true,
    hero_autoplay_delay: 3000,
    about_images: [] as string[],
    about_autoplay: true,
    about_autoplay_delay: 5000,
    header_text_color_light: "#ffffff",
    header_text_color_dark: "#ffffff",
    logo_size: 40,
    button_bg_color_light: "#0ea5e9",
    button_bg_color_dark: "#0ea5e9",
    button_text_color_light: "#ffffff",
    button_text_color_dark: "#ffffff",
    specialty_tag_bg_light: "#e0f2fe",
    specialty_tag_text_light: "#0ea5e9",
    specialty_tag_bg_dark: "#1e3a8a",
    specialty_tag_text_dark: "#93c5fd",
    ai_match_button_text: "Rede Bem-Estar Match",
    // Contact information
    contact_phone: "",
    contact_whatsapp: "",
    contact_email: "",
    contact_address: "",
    cnpj: "",
    razao_social: "",
    // Social media
    social_instagram: "",
    social_facebook: "",
    social_linkedin: "",
    meta_title: "",
    meta_description: "",
    meta_favicon: "",
    favicon_url: "",
    fallback_professional_image: "",
    is_active: true,
    // Domain redirect configuration
    domain_redirect_enabled: false,
    domain_redirect_from: [] as string[],
    domain_redirect_to: ""
  });
  const [loading, setLoading] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState<'light' | 'dark' | 'switcher-light' | 'switcher-dark' | 'footer-light' | 'footer-dark' | 'feature-light' | 'feature-dark' | 'fallback' | null>(null);

  useEffect(() => {
    if (tenant) {
      setFormData({
        slug: tenant.slug || "",
        name: tenant.name || "",
        base_path: tenant.base_path || "",
        logo_url: tenant.logo_url || "",
        logo_url_dark: tenant.logo_url_dark || "",
        switcher_logo_url: tenant.switcher_logo_url || "",
        switcher_logo_url_dark: tenant.switcher_logo_url_dark || "",
        footer_logo_url: (tenant as any).footer_logo_url || "",
        footer_logo_url_dark: (tenant as any).footer_logo_url_dark || "",
        feature_logo_url: (tenant as any).feature_logo_url || "",
        feature_logo_url_dark: (tenant as any).feature_logo_url_dark || "",
        header_color: tenant.header_color || "",
        primary_color: tenant.primary_color || "#0ea5e9",
        accent_color: tenant.accent_color || "#06b6d4",
        secondary_color: tenant.secondary_color || tenant.theme_config?.secondary_color || "#6366f1",
        hero_title: tenant.hero_title || "",
        hero_subtitle: tenant.hero_subtitle || "",
        hero_images: tenant.hero_images || [],
        hero_autoplay: tenant.hero_autoplay ?? true,
        hero_autoplay_delay: tenant.hero_autoplay_delay || 3000,
        about_images: tenant.about_images || [],
        about_autoplay: tenant.about_autoplay ?? true,
        about_autoplay_delay: tenant.about_autoplay_delay || 5000,
        header_text_color_light: tenant.header_text_color_light || "#ffffff",
        header_text_color_dark: tenant.header_text_color_dark || "#ffffff",
        logo_size: tenant.logo_size || 40,
        button_bg_color_light: tenant.button_bg_color_light || "#0ea5e9",
        button_bg_color_dark: tenant.button_bg_color_dark || "#0ea5e9",
        button_text_color_light: tenant.button_text_color_light || "#ffffff",
        button_text_color_dark: tenant.button_text_color_dark || "#ffffff",
        specialty_tag_bg_light: tenant.specialty_tag_bg_light || "#e0f2fe",
        specialty_tag_text_light: tenant.specialty_tag_text_light || "#0ea5e9",
        specialty_tag_bg_dark: tenant.specialty_tag_bg_dark || "#1e3a8a",
        specialty_tag_text_dark: tenant.specialty_tag_text_dark || "#93c5fd",
        ai_match_button_text: tenant.ai_match_button_text || "Rede Bem-Estar Match",
        // Contact information
        contact_phone: tenant.contact_phone || "",
        contact_whatsapp: tenant.contact_whatsapp || "",
        contact_email: tenant.contact_email || "",
        contact_address: tenant.contact_address || "",
        cnpj: tenant.cnpj || "",
        razao_social: tenant.razao_social || "",
        // Social media
        social_instagram: tenant.social_instagram || "",
        social_facebook: tenant.social_facebook || "",
        social_linkedin: tenant.social_linkedin || "",
        meta_title: tenant.meta_config?.title || "",
        meta_description: tenant.meta_config?.description || "",
        meta_favicon: tenant.meta_config?.favicon || "",
        favicon_url: tenant.favicon_url || "",
        fallback_professional_image: tenant.fallback_professional_image || "",
        is_active: tenant.is_active ?? true,
        // Domain redirect configuration
        domain_redirect_enabled: tenant.domain_redirect_enabled ?? false,
        domain_redirect_from: tenant.domain_redirect_from || [],
        domain_redirect_to: tenant.domain_redirect_to || ""
      });
    } else {
      setFormData({
        slug: "",
        name: "",
        base_path: "",
        logo_url: "",
        logo_url_dark: "",
        switcher_logo_url: "",
        switcher_logo_url_dark: "",
        footer_logo_url: "",
        footer_logo_url_dark: "",
        feature_logo_url: "",
        feature_logo_url_dark: "",
        header_color: "",
        primary_color: "#0ea5e9",
        accent_color: "#06b6d4",
        secondary_color: "#6366f1",
        hero_title: "",
        hero_subtitle: "",
        hero_images: [] as string[],
        hero_autoplay: true,
        hero_autoplay_delay: 3000,
        about_images: [] as string[],
        about_autoplay: true,
        about_autoplay_delay: 5000,
        header_text_color_light: "#ffffff",
        header_text_color_dark: "#ffffff",
        logo_size: 40,
        button_bg_color_light: "#0ea5e9",
        button_bg_color_dark: "#0ea5e9",
        button_text_color_light: "#ffffff",
        button_text_color_dark: "#ffffff",
        specialty_tag_bg_light: "#e0f2fe",
        specialty_tag_text_light: "#0ea5e9",
        specialty_tag_bg_dark: "#1e3a8a",
        specialty_tag_text_dark: "#93c5fd",
        ai_match_button_text: "Rede Bem-Estar Match",
        // Contact information
        contact_phone: "",
        contact_whatsapp: "",
        contact_email: "",
        contact_address: "",
        cnpj: "",
        razao_social: "",
        // Social media
        social_instagram: "",
        social_facebook: "",
        social_linkedin: "",
        meta_title: "",
        meta_description: "",
        meta_favicon: "",
        favicon_url: "",
        fallback_professional_image: "",
        is_active: true,
        // Domain redirect configuration
        domain_redirect_enabled: false,
        domain_redirect_from: [] as string[],
        domain_redirect_to: ""
      });
    }
  }, [tenant]);

  const handleFaviconUpload = async (file: File) => {
    if (!tenant?.id) {
      toast.error("Salve o tenant antes de fazer upload do favicon");
      return;
    }
    
    try {
      setUploadingFavicon(true);
      
      // Validar tipo de arquivo
      const validTypes = ['image/x-icon', 'image/png', 'image/jpeg', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast.error('Formato inválido. Use arquivos .ico, .png, .jpg ou .svg');
        return;
      }
      
      // Validar tamanho (máx 512KB)
      if (file.size > 512 * 1024) {
        toast.error('Arquivo muito grande. O favicon deve ter no máximo 512KB');
        return;
      }
      
      // Converter file para base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        // Upload via edge function
        const { data, error } = await supabase.functions.invoke('upload-to-s3', {
          body: {
            file: base64Data,
            filename: file.name,
            type: file.type,
            professionalId: tenant.id
          }
        });
        
        if (error) throw error;
        
        // Atualizar state com a URL do S3
        setFormData(prev => ({ ...prev, favicon_url: data.url }));
        
        toast.success('Favicon enviado com sucesso!');
      };
      
      reader.onerror = () => {
        throw new Error('Erro ao ler arquivo');
      };
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Não foi possível enviar o favicon');
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleLogoUpload = async (file: File, type: 'light' | 'dark' | 'switcher-light' | 'switcher-dark' | 'footer-light' | 'footer-dark' | 'feature-light' | 'feature-dark' | 'fallback') => {
    if (!tenant?.id) {
      toast.error("Salve o tenant antes de fazer upload de imagens");
      return;
    }
    
    try {
      setUploadingLogo(type);
      
      // Validar tipo de arquivo
      const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Formato inválido. Use arquivos .png, .jpg, .svg ou .webp');
        return;
      }
      
      // Validar tamanho (máx 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Arquivo muito grande. A imagem deve ter no máximo 2MB');
        return;
      }
      
      // Converter file para base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        // Upload via edge function
        const { data, error } = await supabase.functions.invoke('upload-to-s3', {
          body: {
            file: base64Data,
            filename: file.name,
            type: file.type,
            professionalId: tenant.id,
            uploadType: `tenant-logo-${type}`
          }
        });
        
        if (error) throw error;
        
        // Atualizar state com a URL do S3
        const fieldMap: Record<string, string> = {
          light: 'logo_url',
          dark: 'logo_url_dark',
          'switcher-light': 'switcher_logo_url',
          'switcher-dark': 'switcher_logo_url_dark',
          'footer-light': 'footer_logo_url',
          'footer-dark': 'footer_logo_url_dark',
          'feature-light': 'feature_logo_url',
          'feature-dark': 'feature_logo_url_dark',
          fallback: 'fallback_professional_image'
        };
        
        setFormData(prev => ({ ...prev, [fieldMap[type]]: data.url }));
        
        toast.success('Imagem enviada com sucesso!');
        setUploadingLogo(null);
      };
      
      reader.onerror = () => {
        throw new Error('Erro ao ler arquivo');
      };
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Não foi possível enviar a imagem');
      setUploadingLogo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tenantData = {
        slug: formData.slug,
        name: formData.name,
        base_path: formData.base_path || `/${formData.slug}`,
        logo_url: formData.logo_url || null,
        logo_url_dark: formData.logo_url_dark || null,
        switcher_logo_url: formData.switcher_logo_url || null,
        switcher_logo_url_dark: formData.switcher_logo_url_dark || null,
        footer_logo_url: formData.footer_logo_url || null,
        footer_logo_url_dark: formData.footer_logo_url_dark || null,
        feature_logo_url: formData.feature_logo_url || null,
        feature_logo_url_dark: formData.feature_logo_url_dark || null,
        header_color: formData.header_color || null,
        primary_color: formData.primary_color,
        accent_color: formData.accent_color,
        secondary_color: formData.secondary_color,
        hero_title: formData.hero_title || null,
        hero_subtitle: formData.hero_subtitle || null,
        hero_images: formData.hero_images.length > 0 ? formData.hero_images : null,
        hero_autoplay: formData.hero_autoplay,
        hero_autoplay_delay: formData.hero_autoplay_delay,
        about_images: formData.about_images.length > 0 ? formData.about_images : null,
        about_autoplay: formData.about_autoplay,
        about_autoplay_delay: formData.about_autoplay_delay,
        header_text_color_light: formData.header_text_color_light,
        header_text_color_dark: formData.header_text_color_dark,
        logo_size: formData.logo_size,
        button_bg_color_light: formData.button_bg_color_light,
        button_bg_color_dark: formData.button_bg_color_dark,
        button_text_color_light: formData.button_text_color_light,
        button_text_color_dark: formData.button_text_color_dark,
        specialty_tag_bg_light: formData.specialty_tag_bg_light,
        specialty_tag_text_light: formData.specialty_tag_text_light,
        specialty_tag_bg_dark: formData.specialty_tag_bg_dark,
        specialty_tag_text_dark: formData.specialty_tag_text_dark,
        ai_match_button_text: formData.ai_match_button_text,
        // Contact information
        contact_phone: formData.contact_phone || null,
        contact_whatsapp: formData.contact_whatsapp || null,
        contact_email: formData.contact_email || null,
        contact_address: formData.contact_address || null,
        cnpj: formData.cnpj || null,
        razao_social: formData.razao_social || null,
        // Social media
        social_instagram: formData.social_instagram || null,
        social_facebook: formData.social_facebook || null,
        social_linkedin: formData.social_linkedin || null,
        // Domain redirect configuration
        domain_redirect_enabled: formData.domain_redirect_enabled,
        domain_redirect_from: formData.domain_redirect_from.length > 0 ? formData.domain_redirect_from : null,
        domain_redirect_to: formData.domain_redirect_to || null,
        theme_config: {
          secondary_color: formData.secondary_color
        },
        meta_config: {
          title: formData.meta_title || formData.name,
          description: formData.meta_description || `${formData.name} - Plataforma de Saúde Emocional`,
          favicon: formData.meta_favicon || "/favicon.ico"
        },
        favicon_url: formData.favicon_url || null,
        fallback_professional_image: formData.fallback_professional_image || null,
        is_active: formData.is_active
      };

      if (tenant) {
        // Update existing tenant
        const { error } = await supabase
          .from('tenants')
          .update(tenantData)
          .eq('id', tenant.id);

        if (error) throw error;
        
        // Invalidar cache através da edge function
        try {
          const { data: cacheData } = await supabase.functions.invoke('invalidate-tenant-cache', {
            body: { slug: formData.slug }
          });
          console.log('[TenantEditorModal] Cache invalidation response:', cacheData);
        } catch (cacheError) {
          console.error('[TenantEditorModal] Cache invalidation error:', cacheError);
        }
        
        // Invalidar cache local e disparar evento de atualização
        invalidateTenantCache(formData.slug);
        
        // Atualizar o favicon dinamicamente se foi alterado
        if (formData.favicon_url) {
          // Remover TODAS as tags de favicon existentes antes de criar nova
          const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
          existingFavicons.forEach(el => el.remove());

          const favicon = document.createElement('link');
          favicon.setAttribute('rel', 'icon');
          const cacheBuster = `?v=${Date.now()}`;
          const finalUrl = formData.favicon_url.includes('?')
            ? `${formData.favicon_url}&v=${Date.now()}`
            : `${formData.favicon_url}${cacheBuster}`;
          favicon.setAttribute('href', finalUrl);
          document.head.appendChild(favicon);
          console.log('[TenantEditorModal] Favicon updated:', finalUrl);
        }
        
        toast.success("Tenant atualizado com sucesso!");
      } else {
        // Create new tenant
        const { error } = await supabase
          .from('tenants')
          .insert([tenantData]);

        if (error) throw error;
        toast.success("Tenant criado com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving tenant:', error);
      toast.error(tenant ? "Erro ao atualizar tenant" : "Erro ao criar tenant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tenant ? "Editar Tenant" : "Novo Tenant"}</DialogTitle>
          <DialogDescription>
            {tenant ? "Atualize as informações do tenant" : "Crie um novo tenant na plataforma"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-6 h-auto flex-wrap">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="logos">Logos</TabsTrigger>
              <TabsTrigger value="theme">Tema</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="favicon">Favicon</TabsTrigger>
              <TabsTrigger value="about">Página Sobre</TabsTrigger>
              <TabsTrigger value="contact">Contato</TabsTrigger>
              <TabsTrigger value="footer">Footer</TabsTrigger>
              <TabsTrigger value="modules">Módulos</TabsTrigger>
              <TabsTrigger value="cta">CTAs</TabsTrigger>
              <TabsTrigger value="typography">Tipografia</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="booking">Agendamento</TabsTrigger>
              <TabsTrigger value="domain">Domínio</TabsTrigger>
              <TabsTrigger value="meta">Meta</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Rede Bem-Estar"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                    placeholder="alopsi"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="base_path">Base Path</Label>
                <Input
                  id="base_path"
                  value={formData.base_path}
                  onChange={(e) => setFormData({ ...formData, base_path: e.target.value })}
                  placeholder="/"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe vazio para usar "/{formData.slug}"
                </p>
              </div>
            </TabsContent>

            {/* Logos Tab */}
            <TabsContent value="logos" className="space-y-6">
              {/* Section: Logos do Próprio Tenant */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-semibold">Logos Deste Tenant</h3>
                  <p className="text-sm text-muted-foreground">
                    Logos que aparecem no header e footer quando o usuário está neste tenant.
                  </p>
                </div>

                {/* Logo Light Mode */}
                <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                  <div>
                    <h4 className="font-medium">🌞 Logo para Fundo Claro (Light Mode)</h4>
                    <p className="text-sm text-muted-foreground">
                      Usado no header e footer deste tenant quando em modo claro.
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://exemplo.com/logo-light.png"
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file, 'light');
                        }}
                      />
                      <Button type="button" variant="outline" disabled={uploadingLogo === 'light'} asChild>
                        <span>
                          {uploadingLogo === 'light' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  {formData.logo_url && (
                    <div className="border rounded-lg p-4 bg-white">
                      <p className="text-sm text-gray-600 mb-2">Preview no Header:</p>
                      <img src={formData.logo_url} alt="Logo light" className="h-12 object-contain" />
                    </div>
                  )}
                </div>
                
                {/* Logo Dark Mode */}
                <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                  <div>
                    <h4 className="font-medium">🌙 Logo para Fundo Escuro (Dark Mode)</h4>
                    <p className="text-sm text-muted-foreground">
                      Usado no header e footer deste tenant quando em modo escuro.
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={formData.logo_url_dark}
                      onChange={(e) => setFormData({ ...formData, logo_url_dark: e.target.value })}
                      placeholder="https://exemplo.com/logo-dark.png"
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file, 'dark');
                        }}
                      />
                      <Button type="button" variant="outline" disabled={uploadingLogo === 'dark'} asChild>
                        <span>
                          {uploadingLogo === 'dark' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  {formData.logo_url_dark && (
                    <div className="border rounded-lg p-4 bg-gray-900">
                      <p className="text-sm text-gray-400 mb-2">Preview no Header:</p>
                      <img src={formData.logo_url_dark} alt="Logo dark" className="h-12 object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Section: Logos que Aparecem em Outros Tenants */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-semibold">Logos no Switcher de Outros Tenants</h3>
                  <p className="text-sm text-muted-foreground">
                    Logos que aparecem no botão de troca de tenant (switcher) quando o usuário está em <strong>outro</strong> tenant.
                    Esses logos aparecem no header de outros sites como botão para navegar até este tenant.
                  </p>
                </div>

                {/* Switcher Logo Light Mode */}
                <div className="border rounded-lg p-4 space-y-4 bg-blue-50 dark:bg-blue-950/30">
                  <div>
                    <h4 className="font-medium">🌞 Logo no Switcher (Light Mode)</h4>
                    <p className="text-sm text-muted-foreground">
                      Exibido no botão do switcher de outros tenants quando em modo claro.
                      Se vazio, usa o logo principal (Light Mode).
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={formData.switcher_logo_url}
                      onChange={(e) => setFormData({ ...formData, switcher_logo_url: e.target.value })}
                      placeholder="https://exemplo.com/switcher-logo-light.png"
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file, 'switcher-light');
                        }}
                      />
                      <Button type="button" variant="outline" disabled={uploadingLogo === 'switcher-light'} asChild>
                        <span>
                          {uploadingLogo === 'switcher-light' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-white">
                    <p className="text-sm text-gray-600 mb-2">Preview no Switcher (fundo claro):</p>
                    <div className="inline-flex bg-white border rounded-lg px-3 py-2 shadow-sm">
                      <img 
                        src={formData.switcher_logo_url || formData.logo_url || '/placeholder.svg'} 
                        alt="Switcher preview light" 
                        className="h-8 object-contain" 
                      />
                    </div>
                    {!formData.switcher_logo_url && formData.logo_url && (
                      <p className="text-xs text-amber-600 mt-2">⚠️ Usando logo principal (Light Mode)</p>
                    )}
                  </div>
                </div>
                
                {/* Switcher Logo Dark Mode */}
                <div className="border rounded-lg p-4 space-y-4 bg-blue-50 dark:bg-blue-950/30">
                  <div>
                    <h4 className="font-medium">🌙 Logo no Switcher (Dark Mode)</h4>
                    <p className="text-sm text-muted-foreground">
                      Exibido no botão do switcher de outros tenants quando em modo escuro.
                      Se vazio, usa o logo principal (Dark Mode).
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={formData.switcher_logo_url_dark}
                      onChange={(e) => setFormData({ ...formData, switcher_logo_url_dark: e.target.value })}
                      placeholder="https://exemplo.com/switcher-logo-dark.png"
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file, 'switcher-dark');
                        }}
                      />
                      <Button type="button" variant="outline" disabled={uploadingLogo === 'switcher-dark'} asChild>
                        <span>
                          {uploadingLogo === 'switcher-dark' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-gray-900">
                    <p className="text-sm text-gray-400 mb-2">Preview no Switcher (fundo escuro):</p>
                    <div className="inline-flex bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                      <img 
                        src={formData.switcher_logo_url_dark || formData.logo_url_dark || '/placeholder.svg'} 
                        alt="Switcher preview dark" 
                        className="h-8 object-contain" 
                      />
                    </div>
                    {!formData.switcher_logo_url_dark && formData.logo_url_dark && (
                      <p className="text-xs text-amber-400 mt-2">⚠️ Usando logo principal (Dark Mode)</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Section: Footer Logos */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-semibold">Logo do Footer</h3>
                  <p className="text-sm text-muted-foreground">
                    Logo específico para o rodapé. Se não configurado, usa o logo principal do header.
                  </p>
                </div>

                {/* Footer Logo Light Mode */}
                <div className="border rounded-lg p-4 space-y-4 bg-green-50 dark:bg-green-950/30">
                  <div>
                    <h4 className="font-medium">🌞 Footer Light Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Se vazio, usa o logo principal (Light Mode).
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={formData.footer_logo_url}
                      onChange={(e) => setFormData({ ...formData, footer_logo_url: e.target.value })}
                      placeholder="https://exemplo.com/footer-logo-light.png"
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file, 'footer-light');
                        }}
                      />
                      <Button type="button" variant="outline" disabled={uploadingLogo === 'footer-light'} asChild>
                        <span>
                          {uploadingLogo === 'footer-light' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-primary text-primary-foreground">
                    <p className="text-sm opacity-80 mb-2">Preview no Footer:</p>
                    <img 
                      src={formData.footer_logo_url || formData.logo_url || '/placeholder.svg'} 
                      alt="Footer preview light" 
                      className="h-10 object-contain opacity-80" 
                    />
                    {!formData.footer_logo_url && formData.logo_url && (
                      <p className="text-xs text-amber-300 mt-2">⚠️ Usando logo principal (Light Mode)</p>
                    )}
                  </div>
                </div>
                
                {/* Footer Logo Dark Mode */}
                <div className="border rounded-lg p-4 space-y-4 bg-green-50 dark:bg-green-950/30">
                  <div>
                    <h4 className="font-medium">🌙 Footer Dark Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Se vazio, usa o logo principal (Dark Mode).
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={formData.footer_logo_url_dark}
                      onChange={(e) => setFormData({ ...formData, footer_logo_url_dark: e.target.value })}
                      placeholder="https://exemplo.com/footer-logo-dark.png"
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file, 'footer-dark');
                        }}
                      />
                      <Button type="button" variant="outline" disabled={uploadingLogo === 'footer-dark'} asChild>
                        <span>
                          {uploadingLogo === 'footer-dark' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-gray-900">
                    <p className="text-sm text-gray-400 mb-2">Preview no Footer (fundo escuro):</p>
                    <img 
                      src={formData.footer_logo_url_dark || formData.logo_url_dark || '/placeholder.svg'} 
                      alt="Footer preview dark" 
                      className="h-10 object-contain opacity-80" 
                    />
                    {!formData.footer_logo_url_dark && formData.logo_url_dark && (
                      <p className="text-xs text-amber-400 mt-2">⚠️ Usando logo principal (Dark Mode)</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Section: Feature Logos */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-semibold">Logo de Features/Ícones</h3>
                  <p className="text-sm text-muted-foreground">
                    Logo usado em páginas como Blog, Encontros, Autores, etc. Se não configurado, usa o logo principal.
                  </p>
                </div>

                {/* Feature Logo Light Mode */}
                <div className="border rounded-lg p-4 space-y-4 bg-purple-50 dark:bg-purple-950/30">
                  <div>
                    <h4 className="font-medium">🌞 Feature Light Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Se vazio, usa o logo principal (Light Mode).
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={formData.feature_logo_url}
                      onChange={(e) => setFormData({ ...formData, feature_logo_url: e.target.value })}
                      placeholder="https://exemplo.com/feature-logo-light.png"
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file, 'feature-light');
                        }}
                      />
                      <Button type="button" variant="outline" disabled={uploadingLogo === 'feature-light'} asChild>
                        <span>
                          {uploadingLogo === 'feature-light' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-white flex items-center gap-3">
                    <img 
                      src={formData.feature_logo_url || formData.logo_url || '/placeholder.svg'} 
                      alt="Feature preview light" 
                      className="w-12 h-12 object-contain" 
                    />
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">Preview como ícone</p>
                      <p className="text-xs">Ex: Autor do sistema em posts</p>
                    </div>
                    {!formData.feature_logo_url && formData.logo_url && (
                      <p className="text-xs text-amber-600">⚠️ Usando logo principal</p>
                    )}
                  </div>
                </div>
                
                {/* Feature Logo Dark Mode */}
                <div className="border rounded-lg p-4 space-y-4 bg-purple-50 dark:bg-purple-950/30">
                  <div>
                    <h4 className="font-medium">🌙 Feature Dark Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Se vazio, usa o logo principal (Dark Mode).
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={formData.feature_logo_url_dark}
                      onChange={(e) => setFormData({ ...formData, feature_logo_url_dark: e.target.value })}
                      placeholder="https://exemplo.com/feature-logo-dark.png"
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file, 'feature-dark');
                        }}
                      />
                      <Button type="button" variant="outline" disabled={uploadingLogo === 'feature-dark'} asChild>
                        <span>
                          {uploadingLogo === 'feature-dark' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-gray-900 flex items-center gap-3">
                    <img 
                      src={formData.feature_logo_url_dark || formData.logo_url_dark || '/placeholder.svg'} 
                      alt="Feature preview dark" 
                      className="w-12 h-12 object-contain" 
                    />
                    <div className="text-sm text-gray-400">
                      <p className="font-medium">Preview como ícone</p>
                      <p className="text-xs">Ex: Autor do sistema em posts</p>
                    </div>
                    {!formData.feature_logo_url_dark && formData.logo_url_dark && (
                      <p className="text-xs text-amber-400">⚠️ Usando logo principal</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />
              
              {/* Fallback Professional Image */}
              <div className="border rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="font-medium">👤 Imagem Padrão de Profissional</h3>
                  <p className="text-sm text-muted-foreground">
                    Exibida quando um profissional não possui foto de perfil.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={formData.fallback_professional_image}
                    onChange={(e) => setFormData({ ...formData, fallback_professional_image: e.target.value })}
                    placeholder="https://exemplo.com/avatar-default.png"
                    className="flex-1"
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, 'fallback');
                      }}
                    />
                    <Button type="button" variant="outline" disabled={uploadingLogo === 'fallback'} asChild>
                      <span>
                        {uploadingLogo === 'fallback' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      </span>
                    </Button>
                  </label>
                </div>
                
                {formData.fallback_professional_image && (
                  <div className="flex justify-center">
                    <img 
                      src={formData.fallback_professional_image} 
                      alt="Fallback professional" 
                      className="w-24 h-24 rounded-full object-cover border"
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="theme" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primary_color">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      placeholder="#0ea5e9"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accent_color">Cor Accent</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent_color"
                      type="color"
                      value={formData.accent_color}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.accent_color}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      placeholder="#06b6d4"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondary_color">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="text-sm font-medium mb-2">Preview</p>
                <div className="flex gap-2">
                  <div 
                    className="w-12 h-12 rounded-md border" 
                    style={{ backgroundColor: formData.primary_color }}
                  />
                  <div 
                    className="w-12 h-12 rounded-md border" 
                    style={{ backgroundColor: formData.accent_color }}
                  />
                  <div 
                    className="w-12 h-12 rounded-md border" 
                    style={{ backgroundColor: formData.secondary_color }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="branding" className="space-y-4">
              <div>
                <Label htmlFor="header_color">Cor do Header</Label>
                <div className="flex gap-2">
                  <Input
                    id="header_color"
                    type="color"
                    value={formData.header_color || formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, header_color: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.header_color || formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, header_color: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Cores dos Textos do Header */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium">Cores dos Textos do Header</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="header_text_color_light">Light Mode</Label>
                    <div className="flex gap-2">
                      <Input
                        id="header_text_color_light"
                        type="color"
                        value={formData.header_text_color_light}
                        onChange={(e) => setFormData({ ...formData, header_text_color_light: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.header_text_color_light}
                        onChange={(e) => setFormData({ ...formData, header_text_color_light: e.target.value })}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="header_text_color_dark">Dark Mode</Label>
                    <div className="flex gap-2">
                      <Input
                        id="header_text_color_dark"
                        type="color"
                        value={formData.header_text_color_dark}
                        onChange={(e) => setFormData({ ...formData, header_text_color_dark: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.header_text_color_dark}
                        onChange={(e) => setFormData({ ...formData, header_text_color_dark: e.target.value })}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tamanho do Logo */}
              <div>
                <Label htmlFor="logo_size">Tamanho do Logo (altura em pixels)</Label>
                <Input
                  id="logo_size"
                  type="number"
                  value={formData.logo_size}
                  onChange={(e) => setFormData({ ...formData, logo_size: parseInt(e.target.value) || 40 })}
                  min={20}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Altura do logo em pixels (padrão: 40px)
                </p>
              </div>

              {/* Cores dos Botões */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium">Cores dos Botões Principais</h3>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">Cor de Preenchimento (Background)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="button_bg_color_light">Light Mode</Label>
                      <div className="flex gap-2">
                        <Input
                          id="button_bg_color_light"
                          type="color"
                          value={formData.button_bg_color_light}
                          onChange={(e) => setFormData({ ...formData, button_bg_color_light: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.button_bg_color_light}
                          onChange={(e) => setFormData({ ...formData, button_bg_color_light: e.target.value })}
                          placeholder="#0ea5e9"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="button_bg_color_dark">Dark Mode</Label>
                      <div className="flex gap-2">
                        <Input
                          id="button_bg_color_dark"
                          type="color"
                          value={formData.button_bg_color_dark}
                          onChange={(e) => setFormData({ ...formData, button_bg_color_dark: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.button_bg_color_dark}
                          onChange={(e) => setFormData({ ...formData, button_bg_color_dark: e.target.value })}
                          placeholder="#0ea5e9"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Cor do Texto (Label)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="button_text_color_light">Light Mode</Label>
                      <div className="flex gap-2">
                        <Input
                          id="button_text_color_light"
                          type="color"
                          value={formData.button_text_color_light}
                          onChange={(e) => setFormData({ ...formData, button_text_color_light: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.button_text_color_light}
                          onChange={(e) => setFormData({ ...formData, button_text_color_light: e.target.value })}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="button_text_color_dark">Dark Mode</Label>
                      <div className="flex gap-2">
                        <Input
                          id="button_text_color_dark"
                          type="color"
                          value={formData.button_text_color_dark}
                          onChange={(e) => setFormData({ ...formData, button_text_color_dark: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.button_text_color_dark}
                          onChange={(e) => setFormData({ ...formData, button_text_color_dark: e.target.value })}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview dos Botões */}
                <div className="pt-4 space-y-2">
                  <p className="text-sm font-medium">Preview:</p>
                  <div className="flex gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Light Mode</p>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-md font-medium"
                        style={{
                          backgroundColor: formData.button_bg_color_light,
                          color: formData.button_text_color_light
                        }}
                      >
                        Botão Exemplo
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Dark Mode</p>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-md font-medium"
                        style={{
                          backgroundColor: formData.button_bg_color_dark,
                          color: formData.button_text_color_dark
                        }}
                      >
                        Botão Exemplo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cores das Tags de Especialidades */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium">Cores das Tags de Especialidades</h3>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">Cor de Fundo (Background)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="specialty_tag_bg_light">Light Mode</Label>
                      <div className="flex gap-2">
                        <Input
                          id="specialty_tag_bg_light"
                          type="color"
                          value={formData.specialty_tag_bg_light}
                          onChange={(e) => setFormData({ ...formData, specialty_tag_bg_light: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.specialty_tag_bg_light}
                          onChange={(e) => setFormData({ ...formData, specialty_tag_bg_light: e.target.value })}
                          placeholder="#e0f2fe"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="specialty_tag_bg_dark">Dark Mode</Label>
                      <div className="flex gap-2">
                        <Input
                          id="specialty_tag_bg_dark"
                          type="color"
                          value={formData.specialty_tag_bg_dark}
                          onChange={(e) => setFormData({ ...formData, specialty_tag_bg_dark: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.specialty_tag_bg_dark}
                          onChange={(e) => setFormData({ ...formData, specialty_tag_bg_dark: e.target.value })}
                          placeholder="#1e3a8a"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Cor do Texto</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="specialty_tag_text_light">Light Mode</Label>
                      <div className="flex gap-2">
                        <Input
                          id="specialty_tag_text_light"
                          type="color"
                          value={formData.specialty_tag_text_light}
                          onChange={(e) => setFormData({ ...formData, specialty_tag_text_light: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.specialty_tag_text_light}
                          onChange={(e) => setFormData({ ...formData, specialty_tag_text_light: e.target.value })}
                          placeholder="#0ea5e9"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="specialty_tag_text_dark">Dark Mode</Label>
                      <div className="flex gap-2">
                        <Input
                          id="specialty_tag_text_dark"
                          type="color"
                          value={formData.specialty_tag_text_dark}
                          onChange={(e) => setFormData({ ...formData, specialty_tag_text_dark: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.specialty_tag_text_dark}
                          onChange={(e) => setFormData({ ...formData, specialty_tag_text_dark: e.target.value })}
                          placeholder="#93c5fd"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview das Tags */}
                <div className="pt-4 space-y-2">
                  <p className="text-sm font-medium">Preview:</p>
                  <div className="flex gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Light Mode</p>
                      <div className="flex gap-2">
                        <span
                          className="text-xs px-3 py-1 rounded-md border"
                          style={{
                            backgroundColor: formData.specialty_tag_bg_light,
                            color: formData.specialty_tag_text_light,
                            borderColor: formData.specialty_tag_text_light + '33'
                          }}
                        >
                          Ansiedade
                        </span>
                        <span
                          className="text-xs px-3 py-1 rounded-md border"
                          style={{
                            backgroundColor: formData.specialty_tag_bg_light,
                            color: formData.specialty_tag_text_light,
                            borderColor: formData.specialty_tag_text_light + '33'
                          }}
                        >
                          Depressão
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Dark Mode</p>
                      <div className="flex gap-2">
                        <span
                          className="text-xs px-3 py-1 rounded-md border"
                          style={{
                            backgroundColor: formData.specialty_tag_bg_dark,
                            color: formData.specialty_tag_text_dark,
                            borderColor: formData.specialty_tag_text_dark + '33'
                          }}
                        >
                          Ansiedade
                        </span>
                        <span
                          className="text-xs px-3 py-1 rounded-md border"
                          style={{
                            backgroundColor: formData.specialty_tag_bg_dark,
                            color: formData.specialty_tag_text_dark,
                            borderColor: formData.specialty_tag_text_dark + '33'
                          }}
                        >
                          Depressão
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Texto do Botão AI Match */}
              <div>
                <Label htmlFor="ai_match_button_text">Texto do Botão AI Match</Label>
                <Input
                  id="ai_match_button_text"
                  value={formData.ai_match_button_text}
                  onChange={(e) => setFormData({ ...formData, ai_match_button_text: e.target.value })}
                  placeholder="Ex: MEDCOS Match, Rede Bem-Estar Match"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Texto personalizado exibido no botão do assistente de IA
                </p>
              </div>

              <div>
                <Label htmlFor="hero_title">Título do Hero</Label>
                <Input
                  id="hero_title"
                  value={formData.hero_title}
                  onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                  placeholder="Bem-vindo ao Rede Bem-Estar"
                />
              </div>

              <div>
                <Label htmlFor="hero_subtitle">Subtítulo do Hero</Label>
                <Textarea
                  id="hero_subtitle"
                  value={formData.hero_subtitle}
                  onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                  placeholder="Sua plataforma de bem-estar emocional"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="hero_images">Imagens do Carrossel (uma URL por linha)</Label>
                <Textarea
                  id="hero_images"
                  value={formData.hero_images.join('\n')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    hero_images: e.target.value.split('\n').filter(url => url.trim()) 
                  })}
                  placeholder="https://example.com/image1.jpg"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hero_autoplay"
                    checked={formData.hero_autoplay}
                    onChange={(e) => setFormData({ ...formData, hero_autoplay: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="hero_autoplay">Autoplay do Carrossel</Label>
                </div>
                <div>
                  <Label htmlFor="hero_autoplay_delay">Delay (ms)</Label>
                  <Input
                    id="hero_autoplay_delay"
                    type="number"
                    value={formData.hero_autoplay_delay}
                    onChange={(e) => setFormData({ ...formData, hero_autoplay_delay: parseInt(e.target.value) })}
                    min={1000}
                    step={1000}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Preview do Header</p>
                <div 
                  className="h-16 rounded flex items-center px-4" 
                  style={{ backgroundColor: formData.header_color || formData.primary_color }}
                >
                  <span className="text-white font-semibold">Header Preview</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="favicon" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Favicon do Tenant</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure o ícone que aparece na aba do navegador. Recomendado: 32x32px ou 64x64px
                  </p>
                </div>

                <div>
                  <Label htmlFor="favicon_url">URL do Favicon</Label>
                  <Input
                    id="favicon_url"
                    value={formData.favicon_url}
                    onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
                    placeholder="https://example.com/favicon.ico"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos aceitos: .ico, .png, .svg, .jpg
                  </p>
                </div>

                <Separator />

                <div>
                  <Label>Ou faça upload</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="file"
                      accept=".ico,.png,.jpg,.jpeg,.svg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFaviconUpload(file);
                      }}
                      disabled={uploadingFavicon || !tenant}
                    />
                    {uploadingFavicon && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Máximo 512KB. {!tenant && "⚠️ Salve o tenant antes de fazer upload."}
                  </p>
                </div>

                {formData.favicon_url && (
                  <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
                    <p className="text-sm font-medium">Preview:</p>
                    <div className="flex items-center gap-3">
                      <img 
                        src={formData.favicon_url} 
                        alt="Favicon preview" 
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="text-xs">
                        <div className="flex items-center gap-2 bg-background border rounded px-3 py-1.5">
                          <img 
                            src={formData.favicon_url} 
                            alt="" 
                            className="w-4 h-4"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="text-muted-foreground">Nome da Página</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="about" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Imagens da Página "Sobre"</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure imagens para a seção hero da página "Sobre Nós". Adicione uma URL para imagem única ou múltiplas URLs para carrossel automático.
                  </p>
                </div>

                <div className="space-y-2">
                  <FieldWithTooltip
                    htmlFor="about_images"
                    label="URLs das Imagens (uma por linha)"
                    tooltip="Configure as imagens da página 'Sobre'. Se adicionar apenas 1 imagem, ela será exibida estaticamente. Com 2 ou mais imagens, um carrossel será criado automaticamente. Cada linha deve conter uma URL completa de imagem (ex: https://exemplo.com/foto.jpg)"
                  >
                    <Textarea
                      id="about_images"
                      value={formData.about_images.join('\n')}
                      onChange={(e) => 
                        setFormData({ ...formData, about_images: e.target.value.split('\n').filter(url => url.trim()) })
                      }
                      placeholder="https://exemplo.com/imagem1.jpg&#10;https://exemplo.com/imagem2.jpg"
                      rows={5}
                    />
                  </FieldWithTooltip>
                </div>

                {formData.about_images.length > 1 && (
                  <>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="about_autoplay"
                        checked={formData.about_autoplay}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, about_autoplay: checked as boolean })
                        }
                      />
                      <FieldWithTooltip
                        htmlFor="about_autoplay"
                        label="Ativar rotação automática"
                        tooltip="Quando ativado, o carrossel de imagens da página Sobre irá trocar automaticamente entre as imagens no intervalo configurado. Os usuários ainda podem navegar manualmente."
                      />
                    </div>

                    {formData.about_autoplay && (
                      <div className="space-y-2">
                        <FieldWithTooltip
                          htmlFor="about_autoplay_delay"
                          label="Intervalo de rotação (milissegundos)"
                          tooltip="Define quanto tempo cada imagem ficará visível antes de passar para a próxima automaticamente. 1000ms = 1 segundo. Recomendado: entre 3000ms (3s) e 8000ms (8s)"
                        >
                          <Input
                            id="about_autoplay_delay"
                            type="number"
                            value={formData.about_autoplay_delay}
                            onChange={(e) => 
                              setFormData({ ...formData, about_autoplay_delay: parseInt(e.target.value) || 5000 })
                            }
                            min={1000}
                            step={500}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Valor atual: {(formData.about_autoplay_delay / 1000).toFixed(1)}s
                          </p>
                        </FieldWithTooltip>
                      </div>
                    )}
                  </>
                )}

                {formData.about_images.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <p className="text-sm font-medium mb-2">
                      Preview ({formData.about_images.length} {formData.about_images.length === 1 ? 'imagem' : 'imagens'})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {formData.about_images.map((url, index) => (
                        <div key={index} className="relative aspect-video rounded overflow-hidden border">
                          <img
                            src={url}
                            alt={`About imagem ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Erro+ao+carregar';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="meta" className="space-y-4">
...
            </TabsContent>

            <TabsContent value="contact">
              <ContactConfigTab formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="footer">
              <FooterConfigTab formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="modules">
              <ModulesConfigTab formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="cta">
              <CTAConfigTab formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="typography">
              <TypographyConfigTab formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="seo">
              <SEOConfigTab formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="email">
              <EmailConfigTab formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="booking">
              <BookingConfigTab formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="domain" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Redirecionamento de Domínio</h3>
                <p className="text-sm text-muted-foreground">
                  Configure redirecionamentos automáticos de domínios alternativos para o domínio principal.
                </p>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="domain_redirect_enabled"
                    checked={formData.domain_redirect_enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, domain_redirect_enabled: checked as boolean })
                    }
                  />
                  <Label htmlFor="domain_redirect_enabled">
                    Habilitar redirecionamento de domínio
                  </Label>
                </div>

                {formData.domain_redirect_enabled && (
                  <>
                    <div>
                      <Label htmlFor="domain_redirect_to">
                        Domínio de Destino (Principal)
                      </Label>
                      <Input
                        id="domain_redirect_to"
                        placeholder="redebemestar.com.br"
                        value={formData.domain_redirect_to}
                        onChange={(e) =>
                          setFormData({ ...formData, domain_redirect_to: e.target.value })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Domínio para onde os usuários serão redirecionados (sem https://)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="domain_redirect_from">
                        Domínios de Origem (um por linha)
                      </Label>
                      <Textarea
                        id="domain_redirect_from"
                        placeholder="alopsi.com.br&#10;www.alopsi.com.br&#10;alopsi.app"
                        value={formData.domain_redirect_from.join('\n')}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            domain_redirect_from: e.target.value
                              .split('\n')
                              .map(d => d.trim())
                              .filter(d => d.length > 0)
                          })
                        }
                        rows={5}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Digite um domínio por linha. Ex: alopsi.com.br (sem https://)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 flex justify-between items-center">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => {
                if (tenant) {
                  const cacheKey = `tenant_${tenant.slug}_cache`;
                  localStorage.removeItem(cacheKey);
                  toast.success("Cache limpo! Recarregue a página para ver as mudanças.");
                }
              }}
              disabled={!tenant}
            >
              🗑️ Limpar Cache
            </Button>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : tenant ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};