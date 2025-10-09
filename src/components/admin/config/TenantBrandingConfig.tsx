import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useTenantBranding, TenantBrandingData } from '@/hooks/useTenantBranding';
import { supabase } from '@/integrations/supabase/client';
import { Tenant } from '@/types/tenant';
import { Loader2, Image as ImageIcon } from 'lucide-react';

export const TenantBrandingConfig = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [branding, setBranding] = useState<TenantBrandingData>({
    logo_url: '',
    hero_title: '',
    hero_subtitle: '',
    header_color: '',
    primary_color: '#000000',
    accent_color: '#000000',
    secondary_color: '#000000',
    hero_images: [],
    hero_autoplay: true,
    hero_autoplay_delay: 5000,
  });

  const { loading, fetchBranding, updateBranding } = useTenantBranding();

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      loadBranding(selectedTenantId);
    }
  }, [selectedTenantId]);

  const loadTenants = async () => {
    const { data } = await supabase.from('tenants').select('*').eq('is_active', true);
    if (data) {
      setTenants(data as unknown as Tenant[]);
      if (data.length > 0) {
        setSelectedTenantId(data[0].id);
      }
    }
  };

  const loadBranding = async (tenantId: string) => {
    const data = await fetchBranding(tenantId);
    if (data) {
      setBranding(data);
    }
  };

  const handleSave = async () => {
    if (!selectedTenantId) return;
    await updateBranding(selectedTenantId, branding);
  };

  const handleImagesChange = (value: string) => {
    const urls = value
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    setBranding(prev => ({ ...prev, hero_images: urls }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Branding de Tenants</h2>
        <p className="text-muted-foreground">
          Configure logo, cores, textos e imagens para cada tenant
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Tenant</CardTitle>
          <CardDescription>Escolha o tenant que deseja configurar</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map(tenant => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.slug})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTenantId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>URL da logo do tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logo_url">URL da Logo</Label>
                <Input
                  id="logo_url"
                  value={branding.logo_url}
                  onChange={e => setBranding(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              {branding.logo_url && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                  <img 
                    src={branding.logo_url} 
                    alt="Logo preview" 
                    className="h-16 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Texto do Hero</CardTitle>
              <CardDescription>Título e subtítulo da página inicial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hero_title">Título Principal</Label>
                <Input
                  id="hero_title"
                  value={branding.hero_title}
                  onChange={e => setBranding(prev => ({ ...prev, hero_title: e.target.value }))}
                  placeholder="Sua jornada de bem-estar começa aqui"
                />
              </div>
              <div>
                <Label htmlFor="hero_subtitle">Subtítulo</Label>
                <Input
                  id="hero_subtitle"
                  value={branding.hero_subtitle}
                  onChange={e => setBranding(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                  placeholder="Conecte-se com profissionais qualificados"
                />
              </div>
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <h1 className="text-2xl font-bold mb-2">{branding.hero_title}</h1>
                <p className="text-muted-foreground">{branding.hero_subtitle}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cor do Header</CardTitle>
              <CardDescription>Cor de fundo do cabeçalho da página</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="header_color">Cor do Header</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="header_color"
                    type="color"
                    value={branding.header_color || branding.primary_color}
                    onChange={e => setBranding(prev => ({ ...prev, header_color: e.target.value }))}
                    className="w-20 h-10"
                  />
                  <Input
                    value={branding.header_color || branding.primary_color}
                    onChange={e => setBranding(prev => ({ ...prev, header_color: e.target.value }))}
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">Preview do Header:</p>
                <div 
                  className="h-16 rounded flex items-center px-4" 
                  style={{ backgroundColor: branding.header_color || branding.primary_color }}
                >
                  <span className="text-white font-semibold">Header Preview</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cores do Tema</CardTitle>
              <CardDescription>Defina as cores principais do tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primary_color">Cor Primária</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="primary_color"
                      type="color"
                      value={branding.primary_color}
                      onChange={e => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={branding.primary_color}
                      onChange={e => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="accent_color">Cor de Destaque</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="accent_color"
                      type="color"
                      value={branding.accent_color}
                      onChange={e => setBranding(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={branding.accent_color}
                      onChange={e => setBranding(prev => ({ ...prev, accent_color: e.target.value }))}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary_color">Cor Secundária</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={branding.secondary_color}
                      onChange={e => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={branding.secondary_color}
                      onChange={e => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-muted/50 flex gap-4">
                <div className="flex-1 h-20 rounded" style={{ backgroundColor: branding.primary_color }} />
                <div className="flex-1 h-20 rounded" style={{ backgroundColor: branding.accent_color }} />
                <div className="flex-1 h-20 rounded" style={{ backgroundColor: branding.secondary_color }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hero Carousel</CardTitle>
              <CardDescription>Configure as imagens do carousel da página inicial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hero_images">URLs das Imagens (uma por linha)</Label>
                <Textarea
                  id="hero_images"
                  value={branding.hero_images.join('\n')}
                  onChange={e => handleImagesChange(e.target.value)}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  rows={5}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoplay">Autoplay</Label>
                  <p className="text-sm text-muted-foreground">Avançar automaticamente</p>
                </div>
                <Switch
                  id="autoplay"
                  checked={branding.hero_autoplay}
                  onCheckedChange={checked => setBranding(prev => ({ ...prev, hero_autoplay: checked }))}
                />
              </div>
              {branding.hero_autoplay && (
                <div>
                  <Label htmlFor="autoplay_delay">Delay do Autoplay (ms)</Label>
                  <Input
                    id="autoplay_delay"
                    type="number"
                    value={branding.hero_autoplay_delay}
                    onChange={e => setBranding(prev => ({ ...prev, hero_autoplay_delay: parseInt(e.target.value) || 5000 }))}
                    min={1000}
                    step={1000}
                  />
                </div>
              )}
              {branding.hero_images.length > 0 && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">Preview ({branding.hero_images.length} imagens):</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {branding.hero_images.map((url, index) => (
                      <div key={index} className="aspect-video bg-muted rounded overflow-hidden flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
