import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIDataSources, AIDataSource } from '@/hooks/useAIDataSources';
import { Database, Shield, Eye, Plus, Trash2, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const privacyLevelColors = {
  public: 'bg-green-100 text-green-800',
  basic: 'bg-blue-100 text-blue-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  complete: 'bg-red-100 text-red-800',
};

const privacyLevelDescriptions = {
  public: 'Dados disponíveis publicamente',
  basic: 'Dados básicos sem informações sensíveis',
  moderate: 'Dados pessoais com privacidade moderada',
  complete: 'Acesso completo incluindo dados sensíveis',
};

export function AIDataSourcesConfig() {
  const { dataSources, loading, hasPermission, updateDataSource, addCustomDataSource, deleteDataSource } = useAIDataSources();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSource, setNewSource] = useState({
    source_name: '',
    display_name: '',
    description: '',
    privacy_level: 'basic' as const,
    enabled: false,
    data_fields: { fields: [] as string[] },
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Fontes de Dados do Assistente IA
          </CardTitle>
          <CardDescription>Carregando configurações...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!hasPermission) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-muted-foreground" />
            <div>
              <CardTitle>Acesso Restrito</CardTitle>
              <CardDescription>
                Esta seção está disponível apenas para administradores
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const handleToggleEnabled = async (source: AIDataSource) => {
    await updateDataSource(source.id, { enabled: !source.enabled });
  };

  const handlePrivacyLevelChange = async (source: AIDataSource, level: string) => {
    await updateDataSource(source.id, { privacy_level: level as any });
  };

  const handleAddSource = async () => {
    if (!newSource.source_name || !newSource.display_name) return;
    
    const result = await addCustomDataSource(newSource);
    if (result) {
      setShowAddDialog(false);
      setNewSource({
        source_name: '',
        display_name: '',
        description: '',
        privacy_level: 'basic',
        enabled: false,
        data_fields: { fields: [] },
      });
    }
  };

  const enabledSources = dataSources.filter(source => source.enabled);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <div>
                <CardTitle>Fontes de Dados do Assistente IA</CardTitle>
                <CardDescription>
                  Configure quais dados o assistente pode acessar para ajudar os usuários
                </CardDescription>
              </div>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Fonte
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Fonte de Dados</DialogTitle>
                  <DialogDescription>
                    Configure uma nova fonte de dados personalizada
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="source_name">Nome Técnico</Label>
                    <Input
                      id="source_name"
                      value={newSource.source_name}
                      onChange={(e) => setNewSource(prev => ({ ...prev, source_name: e.target.value }))}
                      placeholder="ex: custom_data"
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_name">Nome de Exibição</Label>
                    <Input
                      id="display_name"
                      value={newSource.display_name}
                      onChange={(e) => setNewSource(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="ex: Dados Personalizados"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={newSource.description}
                      onChange={(e) => setNewSource(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva que tipo de dados esta fonte contém"
                    />
                  </div>
                  <div>
                    <Label htmlFor="privacy_level">Nível de Privacidade</Label>
                    <Select
                      value={newSource.privacy_level}
                      onValueChange={(value) => setNewSource(prev => ({ ...prev, privacy_level: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Público</SelectItem>
                        <SelectItem value="basic">Básico</SelectItem>
                        <SelectItem value="moderate">Moderado</SelectItem>
                        <SelectItem value="complete">Completo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddSource} className="w-full">
                    Adicionar Fonte
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sources">Fontes de Dados</TabsTrigger>
          <TabsTrigger value="preview">Preview dos Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Fontes</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dataSources.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fontes Ativas</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{enabledSources.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nível Médio de Privacidade</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {enabledSources.length > 0 ? 'Moderado' : 'N/A'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dados Pessoais</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {enabledSources.filter(s => s.privacy_level === 'complete' || s.privacy_level === 'moderate').length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          {dataSources.map((source) => (
            <Card key={source.id} className={`transition-all ${source.enabled ? 'border-green-200 bg-green-50/50' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{source.display_name}</CardTitle>
                      <Badge className={privacyLevelColors[source.privacy_level]}>
                        {source.privacy_level}
                      </Badge>
                      {source.enabled && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Ativo
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{source.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={source.enabled}
                      onCheckedChange={() => handleToggleEnabled(source)}
                    />
                    {!['professionals', 'mood_entries', 'appointments'].includes(source.source_name) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDataSource(source.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {source.enabled && (
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Nível de Privacidade</Label>
                      <Select
                        value={source.privacy_level}
                        onValueChange={(value) => handlePrivacyLevelChange(source, value)}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">
                            <div>
                              <div className="font-medium">Público</div>
                              <div className="text-sm text-muted-foreground">
                                {privacyLevelDescriptions.public}
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="basic">
                            <div>
                              <div className="font-medium">Básico</div>
                              <div className="text-sm text-muted-foreground">
                                {privacyLevelDescriptions.basic}
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="moderate">
                            <div>
                              <div className="font-medium">Moderado</div>
                              <div className="text-sm text-muted-foreground">
                                {privacyLevelDescriptions.moderate}
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="complete">
                            <div>
                              <div className="font-medium">Completo</div>
                              <div className="text-sm text-muted-foreground">
                                {privacyLevelDescriptions.complete}
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Campos Incluídos</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {source.data_fields.fields.map((field) => (
                          <Badge key={field} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview dos Dados Disponíveis</CardTitle>
              <CardDescription>
                Aqui você pode ver quais dados o assistente IA terá acesso baseado nas suas configurações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enabledSources.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma fonte de dados ativa</p>
                    <p className="text-sm">Ative algumas fontes para ver o preview</p>
                  </div>
                ) : (
                  enabledSources.map((source) => (
                    <div key={source.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{source.display_name}</h4>
                      <div className="text-sm text-muted-foreground">
                        <p>Nível: <Badge className={privacyLevelColors[source.privacy_level]}>
                          {source.privacy_level}
                        </Badge></p>
                        <p>Campos: {source.data_fields.fields.join(', ')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}