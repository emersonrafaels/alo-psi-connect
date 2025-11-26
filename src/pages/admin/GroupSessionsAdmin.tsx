import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useGroupSessions, GroupSession } from '@/hooks/useGroupSessions';
import { GroupSessionsTable } from '@/components/group-sessions/admin/GroupSessionsTable';
import { GroupSessionForm } from '@/components/group-sessions/admin/GroupSessionForm';
import { SessionRegistrantsModal } from '@/components/group-sessions/admin/SessionRegistrantsModal';
import { AdminTenantSelector } from '@/components/admin/AdminTenantSelector';
import { useAdminTenant } from '@/contexts/AdminTenantContext';

export default function GroupSessionsAdmin() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRegistrantsOpen, setIsRegistrantsOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<GroupSession | undefined>();
  const [selectedSession, setSelectedSession] = useState<GroupSession | null>(null);
  
  const { tenantFilter } = useAdminTenant();

  const { 
    sessions, 
    isLoading,
    createSession,
    updateSession,
    deleteSession,
    isCreating,
    isUpdating,
  } = useGroupSessions({ tenantId: tenantFilter });

  const scheduledSessions = sessions.filter(s => s.status === 'scheduled');
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const draftSessions = sessions.filter(s => s.status === 'draft');

  const handleCreate = () => {
    setEditingSession(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (session: GroupSession) => {
    setEditingSession(session);
    setIsFormOpen(true);
  };

  const handleSubmit = (data: Partial<GroupSession>) => {
    if (editingSession) {
      updateSession({ ...data, id: editingSession.id });
    } else {
      createSession(data);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (sessionId: string) => {
    if (confirm('Tem certeza que deseja excluir este encontro?')) {
      deleteSession(sessionId);
    }
  };

  const handleViewRegistrants = (session: GroupSession) => {
    setSelectedSession(session);
    setIsRegistrantsOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Encontros</h1>
            <p className="text-muted-foreground">
              Gerencie as sessões em grupo da plataforma
            </p>
          </div>

          <div className="flex items-center gap-3">
            <AdminTenantSelector />
            
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Encontro
            </Button>
          </div>
        </div>

        <Tabs defaultValue="scheduled">
          <TabsList>
            <TabsTrigger value="scheduled">
              Agendados ({scheduledSessions.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Realizados ({completedSessions.length})
            </TabsTrigger>
            <TabsTrigger value="drafts">
              Rascunhos ({draftSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="mt-6">
            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : (
              <GroupSessionsTable
                sessions={scheduledSessions}
                onEdit={handleEdit}
                onViewRegistrants={handleViewRegistrants}
                onDelete={handleDelete}
              />
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <GroupSessionsTable
              sessions={completedSessions}
              onEdit={handleEdit}
              onViewRegistrants={handleViewRegistrants}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="drafts" className="mt-6">
            <GroupSessionsTable
              sessions={draftSessions}
              onEdit={handleEdit}
              onViewRegistrants={handleViewRegistrants}
              onDelete={handleDelete}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? 'Editar Encontro' : 'Novo Encontro'}
            </DialogTitle>
          </DialogHeader>

          <GroupSessionForm
            session={editingSession}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Inscritos */}
      <SessionRegistrantsModal
        session={selectedSession}
        open={isRegistrantsOpen}
        onOpenChange={setIsRegistrantsOpen}
      />
    </AdminLayout>
  );
}
