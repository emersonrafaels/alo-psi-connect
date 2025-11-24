import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2, AlertCircle } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface UserTenantEditorProps {
  userId: string;
  currentTenantId: string | null;
  userName: string;
  onSuccess?: () => void;
}

export function UserTenantEditor({ userId, currentTenantId, userName, onSuccess }: UserTenantEditorProps) {
  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(currentTenantId);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchTenants();
    }
  }, [open]);

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
        variant: 'destructive'
      });
      return;
    }
    
    setTenants(data || []);
  };

  const handleSave = async () => {
    if (!selectedTenantId) {
      toast({
        title: 'Atenção',
        description: 'Selecione um tenant',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ tenant_id: selectedTenantId })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: 'Tenant atualizado com sucesso!'
      });
      
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar tenant',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const currentTenant = tenants.find(t => t.id === currentTenantId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-auto px-2 py-1.5 font-normal">
          <Building2 className="h-4 w-4" />
          Gerenciar Tenant
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Tenant - {userName}</DialogTitle>
          <DialogDescription>
            Altere o tenant associado a este usuário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tenant Atual */}
          <div>
            <Label className="text-sm font-medium">Tenant Atual</Label>
            {currentTenant ? (
              <Card className="mt-2 p-3 bg-muted/50">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{currentTenant.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {currentTenant.slug}
                  </Badge>
                </div>
              </Card>
            ) : (
              <Card className="mt-2 p-3 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Nenhum tenant atribuído
                </p>
              </Card>
            )}
          </div>

          <Separator />

          {/* Selecionar Novo Tenant */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Alterar para:
            </Label>
            <RadioGroup
              value={selectedTenantId || ''}
              onValueChange={setSelectedTenantId}
              className="space-y-2"
            >
              {tenants.map(tenant => (
                <div
                  key={tenant.id}
                  className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                >
                  <RadioGroupItem value={tenant.id} id={`tenant-${tenant.id}`} />
                  <Label
                    htmlFor={`tenant-${tenant.id}`}
                    className="flex-1 cursor-pointer flex items-center gap-2"
                  >
                    <span className="font-medium">{tenant.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {tenant.slug}
                    </Badge>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Aviso */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Cada usuário pode estar vinculado a apenas 1 tenant por vez.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !selectedTenantId || selectedTenantId === currentTenantId}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alteração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
