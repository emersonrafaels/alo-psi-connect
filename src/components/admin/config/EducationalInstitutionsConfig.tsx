import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { useToast } from '@/hooks/use-toast';
import { School, Plus, Trash2, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const EducationalInstitutionsConfig = () => {
  const { getConfig, updateConfig, loading, hasPermission } = useSystemConfig(['registration']);
  const { toast } = useToast();
  const [institutions, setInstitutions] = useState<string[]>([]);
  const [newInstitution, setNewInstitution] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  // Carregar instituições existentes
  useEffect(() => {
    if (!loading && hasPermission) {
      const savedInstitutions = getConfig('registration', 'educational_institutions', []);
      setInstitutions(Array.isArray(savedInstitutions) ? savedInstitutions.sort() : []);
    }
  }, [loading, hasPermission, getConfig]);

  // Adicionar nova instituição
  const handleAdd = async () => {
    const trimmed = newInstitution.trim();
    
    if (!trimmed) {
      toast({
        title: "Campo vazio",
        description: "Digite o nome da instituição",
        variant: "destructive"
      });
      return;
    }

    if (institutions.some(inst => inst.toLowerCase() === trimmed.toLowerCase())) {
      toast({
        title: "Instituição duplicada",
        description: "Esta instituição já existe na lista",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    const updated = [...institutions, trimmed].sort();
    
    try {
      await updateConfig('registration', 'educational_institutions', updated);
      setInstitutions(updated);
      setNewInstitution('');
      toast({
        title: "Instituição adicionada",
        description: `"${trimmed}" foi adicionada com sucesso`
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Remover instituição
  const handleRemove = async (institution: string) => {
    setSaving(true);
    const updated = institutions.filter(inst => inst !== institution);
    
    try {
      await updateConfig('registration', 'educational_institutions', updated);
      setInstitutions(updated);
      toast({
        title: "Instituição removida",
        description: `"${institution}" foi removida da lista`
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Filtrar instituições pela busca
  const filteredInstitutions = institutions.filter(inst =>
    inst.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!hasPermission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Restrito</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Você não tem permissão para gerenciar instituições de ensino
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Instituições de Ensino
            </CardTitle>
            <CardDescription>
              Gerencie a lista de instituições exibidas no cadastro de pacientes
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {institutions.length} {institutions.length === 1 ? 'instituição' : 'instituições'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campo para adicionar nova instituição */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="new-institution">Nova Instituição</Label>
            <Input
              id="new-institution"
              value={newInstitution}
              onChange={(e) => setNewInstitution(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Ex: Universidade Federal de São Paulo (UNIFESP)"
              disabled={saving}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} disabled={saving || !newInstitution.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Campo de busca */}
        <div>
          <Label htmlFor="search">Buscar Instituição</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite para filtrar..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de instituições */}
        <div>
          <Label>
            Instituições Cadastradas 
            {searchTerm && ` (${filteredInstitutions.length} de ${institutions.length})`}
          </Label>
          <ScrollArea className="h-[400px] w-full border rounded-md p-4 mt-2">
            {filteredInstitutions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm 
                  ? "Nenhuma instituição encontrada com este termo"
                  : "Nenhuma instituição cadastrada. Adicione a primeira!"
                }
              </p>
            ) : (
              <div className="space-y-2">
                {filteredInstitutions.map((institution, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <span className="text-sm">{institution}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(institution)}
                      disabled={saving}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Informações adicionais */}
        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
          <p><strong>Dicas:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>As instituições são ordenadas alfabeticamente automaticamente</li>
            <li>Inclua a sigla entre parênteses para facilitar identificação</li>
            <li>Não é possível adicionar instituições duplicadas</li>
            <li>Pressione Enter no campo "Nova Instituição" para adicionar rapidamente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
