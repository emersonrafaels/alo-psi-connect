import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TenantEditorModal } from '@/components/admin/TenantEditorModal';
import { Building2, Users, FileText, Plus, Edit, Eye, EyeOff, Power, PowerOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { clearAllTenantCaches } from '@/utils/cacheHelpers';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  base_path: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  secondary_color?: string;
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

export default function Tenants() {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const { data: tenants, isLoading, refetch } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as unknown as Tenant[];
    },
  });

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['tenant-stats'],
    queryFn: async () => {
      const { data: professionalsData } = await supabase
        .from('professional_tenants')
        .select('tenant_id, professional_id');

      const { data: postsData } = await supabase
        .from('blog_posts')
        .select('tenant_id, id');

      const professionalsByTenant = professionalsData?.reduce((acc, item) => {
        acc[item.tenant_id] = (acc[item.tenant_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const postsByTenant = postsData?.reduce((acc, item) => {
        if (item.tenant_id) {
          acc[item.tenant_id] = (acc[item.tenant_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      return { professionalsByTenant, postsByTenant };
    },
  });

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: !tenant.is_active })
        .eq('id', tenant.id);

      if (error) throw error;
      
      toast.success(`Tenant ${!tenant.is_active ? 'ativado' : 'desativado'} com sucesso`);
      refetch();
    } catch (error) {
      console.error('Error toggling tenant:', error);
      toast.error('Erro ao alterar status do tenant');
    }
  };

  const handleSuccess = () => {
    refetch();
    refetchStats();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Tenants</h1>
            <p className="text-muted-foreground">Configure os diferentes sites da plataforma</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Tenants</h1>
          <p className="text-muted-foreground">Configure os diferentes sites da plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={clearAllTenantCaches}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Limpar Cache
          </Button>
          <Button onClick={() => { setSelectedTenant(null); setEditorOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Tenant
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants?.map((tenant) => {
          const professionalCount = stats?.professionalsByTenant[tenant.id] || 0;
          const postCount = stats?.postsByTenant[tenant.id] || 0;
          
          return (
            <Card key={tenant.id} className="relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-5"
                style={{ background: `linear-gradient(135deg, ${tenant.primary_color}, ${tenant.accent_color})` }}
              />
              
              <CardHeader className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    <CardTitle>{tenant.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
                      {tenant.is_active ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inativo
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">/{tenant.slug}</p>
              </CardHeader>

              <CardContent className="relative space-y-4">
                {tenant.logo_url && (
                  <div className="flex justify-center p-4 bg-muted/20 rounded-lg">
                    <img
                      src={tenant.logo_url}
                      alt={tenant.name}
                      className="h-12 object-contain"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className={professionalCount === 0 ? 'text-amber-600 font-medium' : ''}>
                      {professionalCount} {professionalCount === 1 ? 'profissional' : 'profissionais'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{postCount} {postCount === 1 ? 'post' : 'posts'}</span>
                  </div>
                </div>

                {professionalCount === 0 && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-950 rounded text-xs text-amber-700 dark:text-amber-300">
                    ⚠️ Adicione profissionais a este tenant
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div 
                      className="h-8 w-1/2 rounded"
                      style={{ backgroundColor: tenant.primary_color }}
                      title="Cor primária"
                    />
                    <div 
                      className="h-8 w-1/2 rounded"
                      style={{ backgroundColor: tenant.accent_color }}
                      title="Cor de destaque"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => { setSelectedTenant(tenant); setEditorOpen(true); }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant={tenant.is_active ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => handleToggleActive(tenant)}
                    title={tenant.is_active ? 'Desativar tenant' : 'Ativar tenant'}
                  >
                    {tenant.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <TenantEditorModal
        tenant={selectedTenant}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
