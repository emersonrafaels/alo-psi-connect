import { useState, useEffect } from 'react';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Info, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Institution {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  anonymize_students: boolean | null;
}

export function AnonymizationConfig() {
  const { getConfig, updateConfig, loading: configLoading } = useSystemConfig(['institution']);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const globalDefault = getConfig('institution', 'default_anonymize_students', true);
  const isGlobalEnabled = globalDefault === true || globalDefault === 'true';

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('educational_institutions')
        .select('id, name, type, is_active, anonymize_students')
        .order('name');
      if (error) throw error;
      setInstitutions((data as Institution[]) || []);
    } catch (err) {
      console.error('Error fetching institutions:', err);
    } finally {
      setLoadingInstitutions(false);
    }
  };

  const handleGlobalToggle = async (checked: boolean) => {
    await updateConfig('institution', 'default_anonymize_students', checked);
  };

  const handleInstitutionChange = async (institutionId: string, value: string) => {
    setUpdatingId(institutionId);
    try {
      const anonymizeValue = value === 'null' ? null : value === 'true';
      const { error } = await supabase
        .from('educational_institutions')
        .update({ anonymize_students: anonymizeValue } as any)
        .eq('id', institutionId);
      if (error) throw error;
      setInstitutions(prev =>
        prev.map(i => i.id === institutionId ? { ...i, anonymize_students: anonymizeValue } : i)
      );
      toast({ title: 'Sucesso', description: 'Configuração da instituição atualizada.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao atualizar.', variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const getEffectiveStatus = (inst: Institution) => {
    if (inst.anonymize_students === true) return { label: 'Anonimizado', variant: 'default' as const };
    if (inst.anonymize_students === false) return { label: 'Nomes visíveis', variant: 'secondary' as const };
    return {
      label: isGlobalEnabled ? 'Anonimizado (global)' : 'Nomes visíveis (global)',
      variant: 'outline' as const,
    };
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info alert */}
      <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm">
          Quando ativada, a anonimização substitui os nomes dos alunos por identificadores genéricos (ex: "Aluno #1") no portal institucional.
          O padrão global se aplica a todas as instituições que não possuem configuração específica.
        </AlertDescription>
      </Alert>

      {/* Global default */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Padrão Global
          </CardTitle>
          <CardDescription>
            Valor padrão aplicado a todas as instituições sem configuração específica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="global-anon">Anonimizar nomes de alunos por padrão</Label>
              <p className="text-xs text-muted-foreground">
                {isGlobalEnabled
                  ? 'Nomes serão anonimizados em todas as instituições (a menos que sobrescrito)'
                  : 'Nomes reais serão exibidos em todas as instituições (a menos que sobrescrito)'}
              </p>
            </div>
            <Switch
              id="global-anon"
              checked={isGlobalEnabled}
              onCheckedChange={handleGlobalToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Per-institution config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuração por Instituição</CardTitle>
          <CardDescription>
            Sobrescreva o padrão global para instituições específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInstitutions ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : institutions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma instituição cadastrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instituição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status Efetivo</TableHead>
                  <TableHead className="w-[200px]">Configuração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institutions.map(inst => {
                  const status = getEffectiveStatus(inst);
                  const selectValue = inst.anonymize_students === null ? 'null' : String(inst.anonymize_students);

                  return (
                    <TableRow key={inst.id}>
                      <TableCell className="font-medium">
                        {inst.name}
                        {!inst.is_active && (
                          <Badge variant="outline" className="ml-2 text-[10px]">Inativa</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground capitalize">{inst.type}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={selectValue}
                          onValueChange={(v) => handleInstitutionChange(inst.id, v)}
                          disabled={updatingId === inst.id}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="null">Usar padrão global</SelectItem>
                            <SelectItem value="true">Anonimizar</SelectItem>
                            <SelectItem value="false">Mostrar nomes</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
