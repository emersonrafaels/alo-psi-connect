import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Tenant {
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
    header_color: "",
    primary_color: "#0ea5e9",
    accent_color: "#06b6d4",
    secondary_color: "#6366f1",
    hero_title: "",
    hero_subtitle: "",
    hero_images: [] as string[],
    hero_autoplay: true,
    hero_autoplay_delay: 3000,
    meta_title: "",
    meta_description: "",
    meta_favicon: "",
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      setFormData({
        slug: tenant.slug || "",
        name: tenant.name || "",
        base_path: tenant.base_path || "",
        logo_url: tenant.logo_url || "",
        header_color: tenant.header_color || "",
        primary_color: tenant.primary_color || "#0ea5e9",
        accent_color: tenant.accent_color || "#06b6d4",
        secondary_color: tenant.secondary_color || tenant.theme_config?.secondary_color || "#6366f1",
        hero_title: tenant.hero_title || "",
        hero_subtitle: tenant.hero_subtitle || "",
        hero_images: tenant.hero_images || [],
        hero_autoplay: tenant.hero_autoplay ?? true,
        hero_autoplay_delay: tenant.hero_autoplay_delay || 3000,
        meta_title: tenant.meta_config?.title || "",
        meta_description: tenant.meta_config?.description || "",
        meta_favicon: tenant.meta_config?.favicon || "",
        is_active: tenant.is_active ?? true
      });
    } else {
      setFormData({
        slug: "",
        name: "",
        base_path: "",
        logo_url: "",
        header_color: "",
        primary_color: "#0ea5e9",
        accent_color: "#06b6d4",
        secondary_color: "#6366f1",
        hero_title: "",
        hero_subtitle: "",
        hero_images: [] as string[],
        hero_autoplay: true,
        hero_autoplay_delay: 3000,
        meta_title: "",
        meta_description: "",
        meta_favicon: "",
        is_active: true
      });
    }
  }, [tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tenantData = {
        slug: formData.slug,
        name: formData.name,
        base_path: formData.base_path || `/${formData.slug}`,
        logo_url: formData.logo_url || null,
        header_color: formData.header_color || null,
        primary_color: formData.primary_color,
        accent_color: formData.accent_color,
        secondary_color: formData.secondary_color,
        hero_title: formData.hero_title || null,
        hero_subtitle: formData.hero_subtitle || null,
        hero_images: formData.hero_images.length > 0 ? formData.hero_images : null,
        hero_autoplay: formData.hero_autoplay,
        hero_autoplay_delay: formData.hero_autoplay_delay,
        theme_config: {
          secondary_color: formData.secondary_color
        },
        meta_config: {
          title: formData.meta_title || formData.name,
          description: formData.meta_description || `${formData.name} - Plataforma de Saúde Mental`,
          favicon: formData.meta_favicon || "/favicon.ico"
        },
        is_active: formData.is_active
      };

      if (tenant) {
        // Update existing tenant
        const { error } = await supabase
          .from('tenants')
          .update(tenantData)
          .eq('id', tenant.id);

        if (error) throw error;
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="theme">Tema</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="meta">SEO/Meta</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Alô, Psi!"
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

              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://exemplo.com/logo.png"
                />
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

              <div>
                <Label htmlFor="hero_title">Título do Hero</Label>
                <Input
                  id="hero_title"
                  value={formData.hero_title}
                  onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                  placeholder="Bem-vindo ao AloPsi"
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

            <TabsContent value="meta" className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Título SEO</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="Alô, Psi! - Plataforma de Saúde Mental"
                />
              </div>

              <div>
                <Label htmlFor="meta_description">Descrição SEO</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="Encontre profissionais de saúde mental qualificados..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="meta_favicon">Favicon URL</Label>
                <Input
                  id="meta_favicon"
                  value={formData.meta_favicon}
                  onChange={(e) => setFormData({ ...formData, meta_favicon: e.target.value })}
                  placeholder="/favicon.ico"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : tenant ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};