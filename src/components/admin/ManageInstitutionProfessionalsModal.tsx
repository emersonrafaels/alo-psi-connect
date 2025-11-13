import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Trash2, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  institution: { id: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

interface LinkedProfessional {
  id: string;
  professional_id: number;
  relationship_type: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  is_active: boolean;
  professional: {
    id: number;
    display_name: string;
    profissao: string | null;
    servicos_normalizados: string[] | null;
    foto_perfil_url: string | null;
  };
}

interface AvailableProfessional {
  id: number;
  display_name: string;
  profissao: string | null;
  servicos_normalizados: string[] | null;
  foto_perfil_url: string | null;
}

const relationshipTypeLabels: Record<string, string> = {
  employee: 'Funcionário',
  consultant: 'Consultor',
  supervisor: 'Supervisor',
  intern: 'Estagiário',
};

export function ManageInstitutionProfessionalsModal({ institution, isOpen, onClose }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('view');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<number | null>(null);
  const [relationshipType, setRelationshipType] = useState<string>('employee');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  // Fetch linked professionals
  const { data: linkedProfessionals, isLoading: isLoadingLinked } = useQuery({
    queryKey: ['institution-professionals', institution?.id],
    queryFn: async () => {
      if (!institution?.id) return [];

      const { data, error } = await supabase
        .from('professional_institutions')
        .select(`
          id,
          professional_id,
          relationship_type,
          start_date,
          end_date,
          notes,
          is_active,
          profissionais:professional_id (
            id,
            display_name,
            profissao,
            servicos_normalizados,
            foto_perfil_url
          )
        `)
        .eq('institution_id', institution.id)
        .order('is_active', { ascending: false })
        .order('start_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        professional_id: item.professional_id,
        relationship_type: item.relationship_type,
        start_date: item.start_date,
        end_date: item.end_date,
        notes: item.notes,
        is_active: item.is_active,
        professional: Array.isArray(item.profissionais) ? item.profissionais[0] : item.profissionais,
      })) as LinkedProfessional[];
    },
    enabled: !!institution?.id && isOpen,
  });

  // Fetch available professionals (not linked)
  const { data: availableProfessionals, isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['available-professionals', institution?.id],
    queryFn: async () => {
      if (!institution?.id) return [];

      const { data: linked } = await supabase
        .from('professional_institutions')
        .select('professional_id')
        .eq('institution_id', institution.id);

      const linkedIds = linked?.map(l => l.professional_id) || [];

      const query = supabase
        .from('profissionais')
        .select('id, display_name, profissao, servicos_normalizados, foto_perfil_url')
        .eq('ativo', true)
        .order('display_name');

      if (linkedIds.length > 0) {
        query.not('id', 'in', `(${linkedIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AvailableProfessional[];
    },
    enabled: !!institution?.id && isOpen && activeTab === 'add',
  });

  // Add professional mutation
  const addProfessionalMutation = useMutation({
    mutationFn: async () => {
      if (!institution?.id || !selectedProfessionalId) {
        throw new Error('Dados inválidos');
      }

      const { error } = await supabase
        .from('professional_institutions')
        .insert({
          professional_id: selectedProfessionalId,
          institution_id: institution.id,
          relationship_type: relationshipType,
          start_date: startDate,
          notes: notes || null,
          is_active: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Profissional vinculado',
        description: 'Profissional vinculado à instituição com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['institution-professionals', institution?.id] });
      queryClient.invalidateQueries({ queryKey: ['available-professionals', institution?.id] });
      setSelectedProfessionalId(null);
      setRelationshipType('employee');
      setStartDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setActiveTab('view');
    },
    onError: (error) => {
      toast({
        title: 'Erro ao vincular profissional',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Remove professional mutation
  const removeProfessionalMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('professional_institutions')
        .update({
          is_active: false,
          end_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Vínculo removido',
        description: 'Profissional desvinculado da instituição.',
      });
      queryClient.invalidateQueries({ queryKey: ['institution-professionals', institution?.id] });
      queryClient.invalidateQueries({ queryKey: ['available-professionals', institution?.id] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao desvincular profissional',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const handleAddProfessional = () => {
    if (!selectedProfessionalId) {
      toast({
        title: 'Selecione um profissional',
        description: 'Por favor, selecione um profissional para vincular.',
        variant: 'destructive',
      });
      return;
    }
    addProfessionalMutation.mutate();
  };

  if (!institution) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Gerenciar Profissionais - {institution.name}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="view">Visualizar</TabsTrigger>
            <TabsTrigger value="add">Adicionar</TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {isLoadingLinked ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !linkedProfessionals || linkedProfessionals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum profissional vinculado a esta instituição.
                </div>
              ) : (
                <div className="space-y-4">
                  {linkedProfessionals.map((link) => (
                    <div
                      key={link.id}
                      className={`p-4 border rounded-lg ${
                        link.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={link.professional.foto_perfil_url || undefined} />
                          <AvatarFallback>
                            {link.professional.display_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-foreground">
                                {link.professional.display_name}
                              </h4>
                              {link.professional.profissao && (
                                <p className="text-sm text-muted-foreground">
                                  {link.professional.profissao}
                                </p>
                              )}
                            </div>
                            {link.is_active && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeProfessionalMutation.mutate(link.id)}
                                disabled={removeProfessionalMutation.isPending}
                                title="Desvincular profissional"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2 items-center">
                            <Badge variant="secondary">
                              {relationshipTypeLabels[link.relationship_type] || link.relationship_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Desde: {format(new Date(link.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            {!link.is_active && link.end_date && (
                              <Badge variant="outline" className="text-destructive">
                                Inativo desde {format(new Date(link.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                              </Badge>
                            )}
                          </div>

                          {link.professional.servicos_normalizados && link.professional.servicos_normalizados.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground">
                                Especialidades: {link.professional.servicos_normalizados.slice(0, 3).join(', ')}
                                {link.professional.servicos_normalizados.length > 3 && '...'}
                              </p>
                            </div>
                          )}

                          {link.notes && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground italic">{link.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="add" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="professional">Profissional *</Label>
                <Select
                  value={selectedProfessionalId?.toString() || ''}
                  onValueChange={(value) => setSelectedProfessionalId(Number(value))}
                >
                  <SelectTrigger id="professional">
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {isLoadingAvailable ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : !availableProfessionals || availableProfessionals.length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          Todos os profissionais já estão vinculados
                        </div>
                      ) : (
                        availableProfessionals.map((prof) => (
                          <SelectItem key={prof.id} value={prof.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span>{prof.display_name}</span>
                              {prof.profissao && (
                                <span className="text-xs text-muted-foreground">
                                  ({prof.profissao})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship">Tipo de Vínculo *</Label>
                <Select value={relationshipType} onValueChange={setRelationshipType}>
                  <SelectTrigger id="relationship">
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

              <div className="space-y-2">
                <Label htmlFor="start-date">Data de Início *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Informações adicionais sobre o vínculo (opcional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddProfessional}
                  disabled={addProfessionalMutation.isPending || !selectedProfessionalId}
                >
                  {addProfessionalMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adicionar Vínculo
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
