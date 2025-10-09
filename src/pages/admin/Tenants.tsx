import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, FileText, Plus, Edit, Eye, EyeOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  base_path: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  is_active: boolean;
  meta_config: {
    title: string;
    description: string;
    favicon: string;
  };
}

export default function Tenants() {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const { data: tenants, isLoading } = useQuery({
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

  const { data: stats } = useQuery({
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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Tenant
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants?.map((tenant) => (
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
              <p className="text-sm text-muted-foreground">/{tenant.slug}</p>
            </CardHeader>

            <CardContent className="relative space-y-4">
              {tenant.logo_url && (
                <div className="flex justify-center p-4 bg-muted/20 rounded-lg">
                  <img
                    src={tenant.logo_url}
                    alt={tenant.name}
                    className="h-12 object-contain"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{stats?.professionalsByTenant[tenant.id] || 0} profissionais</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{stats?.postsByTenant[tenant.id] || 0} posts</span>
                </div>
              </div>

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

              <Button variant="outline" className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Editar Configurações
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
