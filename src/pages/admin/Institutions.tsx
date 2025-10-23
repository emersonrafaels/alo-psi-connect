import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Edit, Users, Trash2, GraduationCap, Building2, Handshake } from 'lucide-react';
import { useInstitutions, EducationalInstitution } from '@/hooks/useInstitutions';
import { EditInstitutionModal } from '@/components/admin/EditInstitutionModal';
import { InstitutionPatientsModal } from '@/components/admin/InstitutionPatientsModal';
import { useInstitutionPatients } from '@/hooks/useInstitutionPatients';

export default function Institutions() {
  const {
    institutions,
    isLoading,
    stats,
    createInstitution,
    updateInstitution,
    deleteInstitution,
    isUpdating,
  } = useInstitutions();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'public' | 'private'>('all');
  const [partnershipFilter, setPartnershipFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const [editingInstitution, setEditingInstitution] = useState<EducationalInstitution | null>(null);
  const [viewingPatients, setViewingPatients] = useState<EducationalInstitution | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Contar pacientes por instituição
  const { patientInstitutions: allPatientInstitutions } = useInstitutionPatients();
  const getPatientCount = (institutionId: string) => {
    return allPatientInstitutions?.filter(
      (pi: any) => pi.institution_id === institutionId
    ).length || 0;
  };

  const filteredInstitutions = institutions.filter((institution) => {
    const matchesSearch = institution.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType =
      typeFilter === 'all' || institution.type === typeFilter;
    const matchesPartnership =
      partnershipFilter === 'all' ||
      (partnershipFilter === 'yes' && institution.has_partnership) ||
      (partnershipFilter === 'no' && !institution.has_partnership);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && institution.is_active) ||
      (statusFilter === 'inactive' && !institution.is_active);

    return matchesSearch && matchesType && matchesPartnership && matchesStatus;
  });

  const handleCreate = (data: Omit<EducationalInstitution, 'id' | 'created_at' | 'updated_at'>) => {
    createInstitution(data);
    setIsCreateModalOpen(false);
  };

  const handleToggleActive = (institution: EducationalInstitution) => {
    updateInstitution({
      id: institution.id,
      is_active: !institution.is_active,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Instituições de Ensino</h1>
            <p className="text-muted-foreground">
              Gerencie as instituições de ensino cadastradas no sistema
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Instituição
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Públicas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.public}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Privadas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.private}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Parceria</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withPartnership}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="public">Públicas</SelectItem>
                  <SelectItem value="private">Privadas</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={partnershipFilter}
                onValueChange={(value: any) => setPartnershipFilter(value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="yes">Com parceria</SelectItem>
                  <SelectItem value="no">Sem parceria</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <p>Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Parceria</TableHead>
                    <TableHead>Pacientes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstitutions.map((institution) => (
                    <TableRow key={institution.id}>
                      <TableCell className="font-medium">{institution.name}</TableCell>
                      <TableCell>
                        <Badge variant={institution.type === 'public' ? 'default' : 'secondary'}>
                          {institution.type === 'public' ? 'Pública' : 'Privada'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {institution.has_partnership ? (
                          <Badge variant="default">Sim</Badge>
                        ) : (
                          <Badge variant="outline">Não</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingPatients(institution)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          {getPatientCount(institution.id)}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={institution.is_active}
                          onCheckedChange={() => handleToggleActive(institution)}
                          disabled={isUpdating}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingInstitution(institution)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteInstitution(institution.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modais */}
      <EditInstitutionModal
        institution={editingInstitution}
        isOpen={!!editingInstitution}
        onClose={() => setEditingInstitution(null)}
        onSave={updateInstitution}
        isSaving={isUpdating}
      />

      <EditInstitutionModal
        institution={null}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(data) => handleCreate(data as any)}
        isSaving={isUpdating}
      />

      <InstitutionPatientsModal
        institution={viewingPatients}
        isOpen={!!viewingPatients}
        onClose={() => setViewingPatients(null)}
      />
    </AdminLayout>
  );
}
