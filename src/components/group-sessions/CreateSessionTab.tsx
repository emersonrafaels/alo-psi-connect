import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { FacilitatorSessionForm } from '@/components/group-sessions/facilitator/FacilitatorSessionForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const CreateSessionTab = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('group_sessions').insert({
        ...data,
        status: 'pending_approval',
        created_by: user!.id,
        submitted_by: user!.id,
        submitted_at: new Date().toISOString(),
        tenant_id: tenant?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilitator-sessions'] });
      toast({ title: 'Encontro enviado para aprovação!' });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar encontro', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Criar Novo Encontro</h3>
          <p className="text-muted-foreground text-center mb-4">
            Crie um encontro e envie para aprovação dos administradores.
          </p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Encontro
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Encontro</DialogTitle>
          </DialogHeader>
          <FacilitatorSessionForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
