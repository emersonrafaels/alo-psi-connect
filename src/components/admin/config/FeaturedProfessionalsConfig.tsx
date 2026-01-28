import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminTenant } from '@/contexts/AdminTenantContext';
import { Users, Star, Eye, AlertCircle, CheckCircle, Building2 } from 'lucide-react';

interface Professional {
  id: number;
  display_name: string;
  profissao: string;
  foto_perfil_url: string | null;
  ativo: boolean;
  is_featured: boolean;
  featured_order: number | null;
  preco_consulta: number | null;
}

export const FeaturedProfessionalsConfig = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const { toast } = useToast();
  const { hasRole } = useAdminAuth();
  const { tenantFilter, tenants, selectedTenantId } = useAdminTenant();

  // Check permissions
  const hasPermission = hasRole('admin') || hasRole('super_admin');

  // Get current tenant name for display
  const currentTenantName = tenants.find(t => t.id === tenantFilter)?.name || 'Todos';

  const fetchProfessionals = async () => {
    if (!tenantFilter) {
      setProfessionals([]);
      setLoading(false);
      return;
    }

    try {
      // Query professionals with tenant-specific featured data
      const { data, error } = await supabase
        .from('profissionais')
        .select(`
          id, 
          display_name, 
          profissao, 
          foto_perfil_url, 
          ativo, 
          preco_consulta,
          professional_tenants!inner(is_featured, featured_order, tenant_id)
        `)
        .eq('ativo', true)
        .eq('professional_tenants.tenant_id', tenantFilter)
        .order('display_name');

      if (error) throw error;

      // Map data to local interface using tenant-specific values
      const mappedData: Professional[] = (data || []).map(p => ({
        id: p.id,
        display_name: p.display_name,
        profissao: p.profissao,
        foto_perfil_url: p.foto_perfil_url,
        ativo: p.ativo,
        preco_consulta: p.preco_consulta,
        is_featured: p.professional_tenants?.[0]?.is_featured || false,
        featured_order: p.professional_tenants?.[0]?.featured_order || null,
      }));

      setProfessionals(mappedData);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar profissionais",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission) {
      setLoading(true);
      fetchProfessionals();
    }
  }, [hasPermission, tenantFilter]);

  const updateProfessionalFeatured = async (professionalId: number, featured: boolean, order?: number) => {
    if (!tenantFilter) {
      toast({
        title: "Selecione um tenant",
        description: "Selecione um tenant específico para gerenciar profissionais em destaque",
        variant: "destructive"
      });
      return;
    }

    setUpdating(professionalId);
    try {
      // Check if we're trying to add more than 3 featured professionals
      const currentFeatured = professionals.filter(p => p.is_featured && p.id !== professionalId);
      if (featured && currentFeatured.length >= 3) {
        toast({
          title: "Limite excedido",
          description: "Máximo de 3 profissionais podem estar em destaque",
          variant: "destructive"
        });
        return;
      }

      // If featuring a professional, assign next available order
      let finalOrder = order;
      if (featured && !finalOrder) {
        const usedOrders = currentFeatured.map(p => p.featured_order).filter(Boolean) as number[];
        finalOrder = [1, 2, 3].find(num => !usedOrders.includes(num)) || 1;
      }

      // Update professional_tenants table (tenant-specific - for homepage)
      const { error: ptError } = await supabase
        .from('professional_tenants')
        .update({
          is_featured: featured,
          featured_order: featured ? finalOrder : null
        })
        .eq('professional_id', professionalId)
        .eq('tenant_id', tenantFilter);

      if (ptError) throw ptError;

      // Also update profissionais table (legacy compatibility)
      const { error } = await supabase
        .from('profissionais')
        .update({
          em_destaque: featured,
          ordem_destaque: featured ? finalOrder : null
        })
        .eq('id', professionalId);

      if (error) {
        console.error('Error updating legacy profissionais:', error);
      }

      // Update local state
      setProfessionals(prev => prev.map(p => 
        p.id === professionalId 
          ? { ...p, is_featured: featured, featured_order: featured ? finalOrder! : null }
          : p
      ));

      toast({
        title: "Sucesso",
        description: `Profissional ${featured ? 'adicionado ao' : 'removido do'} destaque`,
      });
    } catch (error) {
      console.error('Erro ao atualizar profissional:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar profissional",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const updateProfessionalOrder = async (professionalId: number, newOrder: number) => {
    if (!tenantFilter) {
      toast({
        title: "Selecione um tenant",
        description: "Selecione um tenant específico para gerenciar profissionais em destaque",
        variant: "destructive"
      });
      return;
    }

    setUpdating(professionalId);
    try {
      // Check if order is already taken
      const orderTaken = professionals.find(p => p.featured_order === newOrder && p.id !== professionalId);
      if (orderTaken) {
        toast({
          title: "Ordem já utilizada",
          description: `A posição ${newOrder} já está ocupada por ${orderTaken.display_name}`,
          variant: "destructive"
        });
        return;
      }

      // Update professional_tenants table (tenant-specific - for homepage)
      const { error: ptError } = await supabase
        .from('professional_tenants')
        .update({ featured_order: newOrder })
        .eq('professional_id', professionalId)
        .eq('tenant_id', tenantFilter);

      if (ptError) throw ptError;

      // Also update profissionais table (legacy compatibility)
      const { error } = await supabase
        .from('profissionais')
        .update({ ordem_destaque: newOrder })
        .eq('id', professionalId);

      if (error) {
        console.error('Error updating legacy profissionais order:', error);
      }

      // Update local state
      setProfessionals(prev => prev.map(p => 
        p.id === professionalId 
          ? { ...p, featured_order: newOrder }
          : p
      ));

      toast({
        title: "Sucesso",
        description: "Ordem atualizada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar ordem",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  if (!hasPermission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Restrito</CardTitle>
          <CardDescription>
            Você não tem permissão para gerenciar profissionais em destaque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta seção está disponível apenas para Administradores
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show message if no tenant is selected
  if (!tenantFilter || selectedTenantId === 'all') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Selecione um Tenant
          </CardTitle>
          <CardDescription>
            Para gerenciar profissionais em destaque, selecione um tenant específico no seletor acima
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Os profissionais em destaque são configurados por tenant. Selecione "Rede Bem Estar" ou "Alopsi" para continuar.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const featuredProfessionals = professionals.filter(p => p.is_featured);
  const availableSlots = 3 - featuredProfessionals.length;

  return (
    <div className="space-y-6">
      {/* Current Tenant Indicator */}
      <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          Gerenciando profissionais em destaque para: <strong>{currentTenantName}</strong>
        </span>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Destaque</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featuredProfessionals.length}</div>
            <p className="text-xs text-muted-foreground">de 3 profissionais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vagas Disponíveis</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableSlots}</div>
            <p className="text-xs text-muted-foreground">slots restantes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total no Tenant</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{professionals.length}</div>
            <p className="text-xs text-muted-foreground">profissionais vinculados</p>
          </CardContent>
        </Card>
      </div>

      {/* Featured Professionals Preview */}
      {featuredProfessionals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview da Homepage ({currentTenantName})
            </CardTitle>
            <CardDescription>
              Como os profissionais aparecerão na seção em destaque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredProfessionals
                .sort((a, b) => (a.featured_order || 0) - (b.featured_order || 0))
                .map((professional) => (
                  <div key={professional.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={professional.foto_perfil_url || ''} />
                        <AvatarFallback>
                          {professional.display_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{professional.display_name}</h3>
                        <p className="text-sm text-muted-foreground">{professional.profissao}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      Posição {professional.featured_order}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Professionals Management Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Profissionais em Destaque
          </CardTitle>
          <CardDescription>
            Configure quais profissionais aparecerão na homepage de {currentTenantName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableSlots === 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Limite máximo atingido. Remova um profissional do destaque para adicionar outro.
              </span>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead>Profissão</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Em Destaque</TableHead>
                <TableHead>Ordem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Carregando profissionais...
                  </TableCell>
                </TableRow>
              ) : professionals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum profissional vinculado a este tenant
                  </TableCell>
                </TableRow>
              ) : (
                professionals.map((professional) => (
                  <TableRow key={professional.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={professional.foto_perfil_url || ''} />
                          <AvatarFallback>
                            {professional.display_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{professional.display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{professional.profissao || 'Não informado'}</TableCell>
                    <TableCell>
                      {professional.preco_consulta 
                        ? `R$ ${professional.preco_consulta.toFixed(2)}`
                        : 'Não informado'
                      }
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={professional.is_featured || false}
                        disabled={updating === professional.id || (!professional.is_featured && availableSlots === 0)}
                        onCheckedChange={(checked) => 
                          updateProfessionalFeatured(professional.id, checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {professional.is_featured ? (
                        <Select
                          value={professional.featured_order?.toString() || ''}
                          disabled={updating === professional.id}
                          onValueChange={(value) => 
                            updateProfessionalOrder(professional.id, parseInt(value))
                          }
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1º</SelectItem>
                            <SelectItem value="2">2º</SelectItem>
                            <SelectItem value="3">3º</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
