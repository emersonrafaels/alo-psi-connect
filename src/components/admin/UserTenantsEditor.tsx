import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Building2, Loader2, AlertCircle, Star } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface UserTenant {
  tenant_id: string;
  is_primary: boolean;
}

interface UserTenantsEditorProps {
  userId: string;
  currentTenantIds: string[];
  primaryTenantId: string | null;
  userName: string;
  onSuccess?: () => void;
}

export function UserTenantsEditor({
  userId,
  currentTenantIds = [],
  primaryTenantId,
  userName,
  onSuccess,
}: UserTenantsEditorProps) {
  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenants, setSelectedTenants] = useState<Set<string>>(
    new Set(currentTenantIds)
  );
  const [primaryTenant, setPrimaryTenant] = useState<string | null>(primaryTenantId);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchTenants();
    }
  }, [open]);

  useEffect(() => {
    // Reset state when dialog opens
    if (open) {
      setSelectedTenants(new Set(currentTenantIds));
      setPrimaryTenant(primaryTenantId);
    }
  }, [open, currentTenantIds, primaryTenantId]);

  const fetchTenants = async () => {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os tenants',
        variant: 'destructive',
      });
      return;
    }

    setTenants(data || []);
  };

  const handleTenantToggle = (tenantId: string, checked: boolean) => {
    const newSelected = new Set(selectedTenants);
    
    if (checked) {
      newSelected.add(tenantId);
      // Se é o primeiro tenant selecionado, marcar como primário
      if (newSelected.size === 1) {
        setPrimaryTenant(tenantId);
      }
    } else {
      newSelected.delete(tenantId);
      // Se era o primário, limpar seleção de primário
      if (primaryTenant === tenantId) {
        setPrimaryTenant(newSelected.size > 0 ? Array.from(newSelected)[0] : null);
      }
    }
    
    setSelectedTenants(newSelected);
  };

  const handlePrimaryChange = (tenantId: string) => {
    if (selectedTenants.has(tenantId)) {
      setPrimaryTenant(tenantId);
    }
  };

  const handleSave = async () => {
    // Validações
    if (selectedTenants.size === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos 1 tenant',
        variant: 'destructive',
      });
      return;
    }

    if (!primaryTenant || !selectedTenants.has(primaryTenant)) {
      toast({
        title: 'Erro',
        description: 'Marque exatamente 1 tenant como principal',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Deletar todas as associações existentes
      const { error: deleteError } = await supabase
        .from('user_tenants')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // 2. Inserir novas associações
      const inserts = Array.from(selectedTenants).map(tenantId => ({
        user_id: userId,
        tenant_id: tenantId,
        is_primary: tenantId === primaryTenant,
      }));

      const { error: insertError } = await supabase
        .from('user_tenants')
        .insert(inserts);

      if (insertError) throw insertError;

      toast({
        title: 'Sucesso',
        description: 'Tenants atualizados com sucesso!',
      });

      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error updating user tenants:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar tenants',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const currentTenantObjects = tenants.filter(t => currentTenantIds.includes(t.id));
  const primaryTenantObj = tenants.find(t => t.id === primaryTenantId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
          <Building2 className="h-4 w-4" />
          Gerenciar Tenants
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Tenants - {userName}</DialogTitle>
          <DialogDescription>
            Selecione os tenants aos quais este usuário terá acesso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tenants Atuais */}
          {currentTenantObjects.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Tenants Atuais</Label>
              <Card className="p-3 bg-muted/50">
                <div className="flex flex-wrap gap-2">
                  {currentTenantObjects.map(tenant => {
                    const isPrimary = tenant.id === primaryTenantId;
                    return (
                      <Badge
                        key={tenant.id}
                        variant={isPrimary ? "default" : "outline"}
                        className="gap-1"
                      >
                        {tenant.name}
                        {isPrimary && <Star className="h-3 w-3 fill-current" />}
                      </Badge>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          <Separator />

          {/* Selecionar Tenants */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Selecionar Tenants:
            </Label>
            <div className="space-y-2">
              {tenants.map(tenant => {
                const isSelected = selectedTenants.has(tenant.id);
                const isPrimary = primaryTenant === tenant.id;

                return (
                  <Card
                    key={tenant.id}
                    className={`p-4 transition-colors ${
                      isSelected ? 'bg-accent/50 border-primary' : 'hover:bg-accent/30'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Checkbox para selecionar tenant */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`tenant-${tenant.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleTenantToggle(tenant.id, checked === true)
                          }
                        />
                        <Label
                          htmlFor={`tenant-${tenant.id}`}
                          className="flex-1 cursor-pointer flex items-center gap-2"
                        >
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{tenant.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {tenant.slug}
                          </Badge>
                        </Label>
                      </div>

                      {/* Radio para marcar como primário */}
                      {isSelected && (
                        <div className="ml-9 flex items-center space-x-2 text-sm">
                          <RadioGroup
                            value={primaryTenant || ''}
                            onValueChange={handlePrimaryChange}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value={tenant.id}
                                id={`primary-${tenant.id}`}
                              />
                              <Label
                                htmlFor={`primary-${tenant.id}`}
                                className="cursor-pointer flex items-center gap-1 text-muted-foreground"
                              >
                                <Star
                                  className={`h-3.5 w-3.5 ${
                                    isPrimary ? 'fill-current text-primary' : ''
                                  }`}
                                />
                                Marcar como principal
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Avisos */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Informações importantes</AlertTitle>
            <AlertDescription className="text-sm space-y-1">
              <p>• Usuário pode estar em múltiplos tenants simultaneamente</p>
              <p>• Um tenant deve ser marcado como "principal"</p>
              <p>
                • O tenant principal será usado como padrão nas operações do usuário
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              loading ||
              selectedTenants.size === 0 ||
              !primaryTenant ||
              !selectedTenants.has(primaryTenant)
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
