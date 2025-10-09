import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface ProfessionalTenant {
  tenant_id: string;
  is_featured: boolean;
  featured_order: number | null;
}

interface Props {
  professionalId: number;
  onSuccess?: () => void;
}

export const ProfessionalTenantsEditor = ({ professionalId, onSuccess }: Props) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [professionalTenants, setProfessionalTenants] = useState<ProfessionalTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [professionalId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

      if (tenantsError) throw tenantsError;

      // Fetch current professional-tenant associations
      const { data: ptData, error: ptError } = await supabase
        .from('professional_tenants')
        .select('tenant_id, is_featured, featured_order')
        .eq('professional_id', professionalId);

      if (ptError) throw ptError;

      setTenants(tenantsData || []);
      setProfessionalTenants(ptData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (tenantId: string) => {
    return professionalTenants.some(pt => pt.tenant_id === tenantId);
  };

  const isFeatured = (tenantId: string) => {
    const pt = professionalTenants.find(pt => pt.tenant_id === tenantId);
    return pt?.is_featured || false;
  };

  const getFeaturedOrder = (tenantId: string) => {
    const pt = professionalTenants.find(pt => pt.tenant_id === tenantId);
    return pt?.featured_order || '';
  };

  const toggleTenant = (tenantId: string) => {
    if (isSelected(tenantId)) {
      setProfessionalTenants(professionalTenants.filter(pt => pt.tenant_id !== tenantId));
    } else {
      setProfessionalTenants([
        ...professionalTenants,
        { tenant_id: tenantId, is_featured: false, featured_order: null },
      ]);
    }
  };

  const toggleFeatured = (tenantId: string) => {
    setProfessionalTenants(
      professionalTenants.map(pt =>
        pt.tenant_id === tenantId ? { ...pt, is_featured: !pt.is_featured } : pt
      )
    );
  };

  const updateFeaturedOrder = (tenantId: string, order: string) => {
    const orderValue = order === '' ? null : parseInt(order) || null;
    setProfessionalTenants(
      professionalTenants.map(pt =>
        pt.tenant_id === tenantId ? { ...pt, featured_order: orderValue } : pt
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Delete all current associations
      const { error: deleteError } = await supabase
        .from('professional_tenants')
        .delete()
        .eq('professional_id', professionalId);

      if (deleteError) throw deleteError;

      // Insert new associations
      if (professionalTenants.length > 0) {
        const inserts = professionalTenants.map(pt => ({
          professional_id: professionalId,
          tenant_id: pt.tenant_id,
          is_featured: pt.is_featured,
          featured_order: pt.featured_order,
        }));

        const { error: insertError } = await supabase
          .from('professional_tenants')
          .insert(inserts);

        if (insertError) throw insertError;
      }

      toast({
        title: 'Sucesso',
        description: 'Associações atualizadas com sucesso!',
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar associações',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Sites onde o profissional aparecerá</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Selecione em quais sites este profissional estará disponível e se deve aparecer em destaque.
        </p>
      </div>

      <div className="space-y-4">
        {tenants.map(tenant => (
          <div key={tenant.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id={`tenant-${tenant.id}`}
                checked={isSelected(tenant.id)}
                onCheckedChange={() => toggleTenant(tenant.id)}
              />
              <Label htmlFor={`tenant-${tenant.id}`} className="font-medium cursor-pointer">
                {tenant.name} ({tenant.slug})
              </Label>
            </div>

            {isSelected(tenant.id) && (
              <div className="ml-7 space-y-3 pt-2 border-t">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`featured-${tenant.id}`}
                    checked={isFeatured(tenant.id)}
                    onCheckedChange={() => toggleFeatured(tenant.id)}
                  />
                  <Label htmlFor={`featured-${tenant.id}`} className="text-sm cursor-pointer">
                    Exibir em destaque na página inicial
                  </Label>
                </div>

                {isFeatured(tenant.id) && (
                  <div className="ml-7">
                    <Label htmlFor={`order-${tenant.id}`} className="text-sm">
                      Ordem de destaque (menor = primeiro)
                    </Label>
                    <Input
                      id={`order-${tenant.id}`}
                      type="number"
                      min="1"
                      placeholder="Ex: 1, 2, 3..."
                      value={getFeaturedOrder(tenant.id)}
                      onChange={(e) => updateFeaturedOrder(tenant.id, e.target.value)}
                      className="w-32 mt-1"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
};
