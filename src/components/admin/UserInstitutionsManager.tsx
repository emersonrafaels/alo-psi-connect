import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Combobox } from '@/components/ui/combobox';
import { useUserInstitutionLinks } from '@/hooks/useUserInstitutionLinks';
import { useInstitutions } from '@/hooks/useInstitutions';
import { Building2, Edit, Trash2, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

interface UserInstitutionsManagerProps {
  user: {
    id: string;
    userId: string;
    nome: string;
    email: string;
    tipo_usuario: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function UserInstitutionsManager({ user, isOpen, onClose }: UserInstitutionsManagerProps) {
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [linkType, setLinkType] = useState<'admin' | 'patient' | 'professional'>('admin');
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer');
  const [relationshipType, setRelationshipType] = useState<'employee' | 'consultant' | 'supervisor' | 'intern'>('employee');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState<'enrolled' | 'graduated' | 'inactive'>('enrolled');
  const [linkToRemove, setLinkToRemove] = useState<{ id: string; type: 'admin' | 'patient' | 'professional' } | null>(null);

  const { institutions } = useInstitutions(true);
  const { links, isLoading, addLink, removeLink, isAdding, isRemoving } = useUserInstitutionLinks({
    userId: user.userId,
    profileId: user.id,
    userType: user.tipo_usuario,
    enabled: isOpen,
  });

  const getLinkTypeVariant = (type: string) => {
    switch (type) {
      case 'admin':
        return 'default';
      case 'patient':
        return 'secondary';
      case 'professional':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getLinkTypeLabel = (type: string) => {
    switch (type) {
      case 'admin':
        return 'Admin Institucional';
      case 'patient':
        return 'Paciente';
      case 'professional':
        return 'Profissional';
      default:
        return type;
    }
  };

  const getRelationshipTypeLabel = (type: string) => {
    switch (type) {
      case 'employee':
        return 'Funcionário';
      case 'consultant':
        return 'Consultor';
      case 'supervisor':
        return 'Supervisor';
      case 'intern':
        return 'Estagiário';
      default:
        return type;
    }
  };

  const handleAddLink = () => {
    if (!selectedInstitution) return;

    const data: any = {
      institutionId: selectedInstitution,
      linkType,
    };

    if (linkType === 'admin') {
      data.role = role;
    } else if (linkType === 'professional') {
      data.relationshipType = relationshipType;
    } else if (linkType === 'patient') {
      data.enrollmentStatus = enrollmentStatus;
      if (enrollmentDate) {
        data.enrollmentDate = enrollmentDate;
      }
    }

    addLink(data, {
      onSuccess: () => {
        setSelectedInstitution('');
        setLinkType('admin');
        setRole('viewer');
        setRelationshipType('employee');
        setEnrollmentDate('');
        setEnrollmentStatus('enrolled');
      },
    });
  };

  const handleRemoveConfirm = () => {
    if (!linkToRemove) return;
    removeLink(
      { linkId: linkToRemove.id, linkType: linkToRemove.type },
      {
        onSuccess: () => {
          setLinkToRemove(null);
        },
      }
    );
  };

  const availableInstitutions = institutions.map(inst => ({
    value: inst.id,
    label: inst.name,
  }));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Gerenciar Instituições - {user.nome}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Usuário: {user.email} | Tipo: {user.tipo_usuario}
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Seção 1: Instituições Vinculadas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Instituições Vinculadas</h3>
                <Badge variant="outline">{links.length} vínculo(s)</Badge>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : links.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma instituição vinculada ainda
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {links.map(link => (
                      <Card key={link.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium">{link.institutionName}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Badge variant={getLinkTypeVariant(link.linkType)}>
                                {getLinkTypeLabel(link.linkType)}
                              </Badge>
                              
                              {link.role && (
                                <Badge variant="outline">Role: {link.role}</Badge>
                              )}
                              
                              {link.relationshipType && (
                                <Badge variant="outline">
                                  {getRelationshipTypeLabel(link.relationshipType)}
                                </Badge>
                              )}
                              
                              {link.enrollmentStatus && (
                                <Badge variant="outline">
                                  Status: {link.enrollmentStatus === 'enrolled' ? 'Matriculado' : link.enrollmentStatus === 'graduated' ? 'Formado' : 'Inativo'}
                                </Badge>
                              )}
                              
                              <Badge variant={link.isActive ? 'default' : 'destructive'}>
                                {link.isActive ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              Vinculado em: {format(new Date(link.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLinkToRemove({ id: link.id, type: link.linkType })}
                              disabled={isRemoving}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <Separator />

            {/* Seção 2: Adicionar Novo Vínculo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Adicionar à Instituição
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Instituição *</Label>
                  <Combobox
                    options={availableInstitutions}
                    value={selectedInstitution}
                    onValueChange={setSelectedInstitution}
                    placeholder="Selecione a instituição..."
                    searchPlaceholder="Buscar instituição..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Vínculo *</Label>
                  <Select value={linkType} onValueChange={(value: any) => setLinkType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin Institucional</SelectItem>
                      {user.tipo_usuario === 'paciente' && (
                        <SelectItem value="patient">Paciente</SelectItem>
                      )}
                      {user.tipo_usuario === 'profissional' && (
                        <SelectItem value="professional">Profissional</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Campos Condicionais */}
              {linkType === 'admin' && (
                <div className="space-y-2">
                  <Label>Role na Instituição *</Label>
                  <Select value={role} onValueChange={(value: any) => setRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {linkType === 'professional' && (
                <div className="space-y-2">
                  <Label>Tipo de Relacionamento *</Label>
                  <Select value={relationshipType} onValueChange={(value: any) => setRelationshipType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Funcionário</SelectItem>
                      <SelectItem value="consultant">Consultor</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="intern">Estagiário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {linkType === 'patient' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status de Matrícula</Label>
                    <Select value={enrollmentStatus} onValueChange={(value: any) => setEnrollmentStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enrolled">Matriculado</SelectItem>
                        <SelectItem value="graduated">Formado</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Matrícula</Label>
                    <Input
                      type="date"
                      value={enrollmentDate}
                      onChange={(e) => setEnrollmentDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleAddLink}
                disabled={!selectedInstitution || !linkType || isAdding}
                className="w-full"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Vínculo
                  </>
                )}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Remoção */}
      <AlertDialog open={!!linkToRemove} onOpenChange={() => setLinkToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este vínculo institucional? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm} disabled={isRemoving}>
              {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
