import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useBulkUserImport, ParsedUserWithValidation } from '@/hooks/useBulkUserImport';
import { useAdminTenant } from '@/contexts/AdminTenantContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { BulkImportReviewTable } from '@/components/admin/BulkImportReviewTable';
import { useToast } from '@/hooks/use-toast';

type ReviewStep = 'upload' | 'review' | 'results';

const BulkImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [reviewStep, setReviewStep] = useState<ReviewStep>('upload');
  const [parsedUsers, setParsedUsers] = useState<ParsedUserWithValidation[]>([]);
  const [results, setResults] = useState<any>(null);
  const { loading, progress, parseAndValidate, importUsers, downloadTemplate } = useBulkUserImport();
  const { selectedTenantId, tenants } = useAdminTenant();
  const { toast } = useToast();
  
  const selectedTenant = tenants.find(t => t.id === selectedTenantId);
  const tenantSlug = selectedTenantId === 'all' ? 'alopsi' : (selectedTenant?.slug || 'alopsi');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
      setParsedUsers([]);
      setReviewStep('upload');
    }
  };

  const handleParseFile = async () => {
    if (!file) return;

    try {
      const usersWithValidation = await parseAndValidate(file);
      setParsedUsers(usersWithValidation);
      setReviewStep('review');
    } catch (error) {
      console.error('Error parsing file:', error);
    }
  };

  const handleEditUser = (id: string, updatedUser: Partial<ParsedUserWithValidation>) => {
    setParsedUsers(prev =>
      prev.map(user => (user.id === id ? { ...user, ...updatedUser } : user))
    );
  };

  const handleRemoveUser = (id: string) => {
    setParsedUsers(prev => prev.filter(user => user.id !== id));
    toast({
      title: 'Usuário removido',
      description: 'O usuário foi removido da lista de importação',
    });
  };

  const handleAddUser = () => {
    const newUser: ParsedUserWithValidation = {
      id: `temp-${Date.now()}`,
      nome: '',
      email: '',
      tipo_usuario: 'paciente',
      validation: {
        isValid: false,
        errors: ['Preencha os campos obrigatórios'],
        warnings: []
      }
    };
    setParsedUsers(prev => [...prev, newUser]);
    toast({
      title: 'Usuário adicionado',
      description: 'Preencha os dados do novo usuário',
    });
  };

  const handleConfirmImport = async () => {
    const validUsers = parsedUsers.filter(u => u.validation.isValid);

    if (validUsers.length === 0) {
      toast({
        title: 'Nenhum usuário válido',
        description: 'Corrija os erros antes de importar',
        variant: 'destructive',
      });
      return;
    }

    const result = await importUsers(validUsers, tenantSlug);
    if (result.success) {
      setResults(result.data);
      setReviewStep('results');
    }
  };

  const handleBackToUpload = () => {
    setReviewStep('upload');
    setFile(null);
    setParsedUsers([]);
    setResults(null);
  };

  const validUsersCount = parsedUsers.filter(u => u.validation.isValid).length;
  const errorUsersCount = parsedUsers.filter(u => !u.validation.isValid).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8" />
            Importação em Massa
          </h1>
          <p className="text-muted-foreground mt-2">
            Importe múltiplos usuários e profissionais via planilha Excel
          </p>
        </div>

        {reviewStep === 'upload' && (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Formato do arquivo:</strong> Excel (.xlsx ou .xls) com colunas: 
                Nome, Email, CPF, Data de Nascimento, Gênero, Telefone, Tipo (paciente/profissional), 
                Senha (opcional), Instituição (opcional), CRP/CRM, Profissão, Preço Consulta
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>1. Baixar Template</CardTitle>
                <CardDescription>
                  Baixe o modelo de planilha para preencher com os dados dos usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={downloadTemplate} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Template Excel
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Fazer Upload</CardTitle>
                <CardDescription>
                  Selecione a planilha preenchida para análise
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file">Arquivo Excel</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                </div>

                {file && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileSpreadsheet className="h-5 w-5" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                )}

                <Button
                  onClick={handleParseFile}
                  disabled={!file || loading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Analisar Planilha
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {reviewStep === 'review' && (
          <>
            <Button
              variant="outline"
              onClick={handleBackToUpload}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Upload
            </Button>

            <BulkImportReviewTable
              users={parsedUsers}
              onEdit={handleEditUser}
              onRemove={handleRemoveUser}
              onAdd={handleAddUser}
            />

            <Card>
              <CardHeader>
                <CardTitle>3. Confirmar Importação</CardTitle>
                <CardDescription>
                  Revise o resumo e confirme para importar os usuários válidos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{parsedUsers.length}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Válidos
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {validUsersCount}
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Com Erros
                    </p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {errorUsersCount}
                    </p>
                  </div>
                </div>

                {errorUsersCount > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {errorUsersCount} usuário(s) com erros não serão importados. 
                      Apenas os {validUsersCount} usuários válidos serão processados.
                    </AlertDescription>
                  </Alert>
                )}

                {loading && (
                  <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-sm text-muted-foreground text-center">
                      Importando... {progress}%
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={handleBackToUpload}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmImport}
                    disabled={validUsersCount === 0 || loading}
                    className="w-full sm:flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {loading ? 'Importando...' : `Confirmar Importação (${validUsersCount} usuários)`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {reviewStep === 'results' && results && (
          <>
            <Button
              variant="outline"
              onClick={handleBackToUpload}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Nova Importação
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  Importação Concluída
                </CardTitle>
                <CardDescription>
                  Resumo dos resultados da importação realizada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-muted-foreground">Total Processados</p>
                      <p className="text-2xl font-bold">{results.length}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Importados com Sucesso
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {results.filter((r: any) => r.success).length}
                      </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Erros
                      </p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {results.filter((r: any) => !r.success).length}
                      </p>
                    </div>
                  </div>

                  {results.filter((r: any) => !r.success).length > 0 && (
                    <div className="border rounded-lg p-4 bg-destructive/5">
                      <h4 className="font-semibold mb-3 text-destructive flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Erros Encontrados Durante a Importação:
                      </h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {results
                          .filter((r: any) => !r.success)
                          .map((r: any, i: number) => (
                            <div key={i} className="text-sm border-l-2 border-destructive pl-3 py-2 bg-background rounded-r">
                              <p className="font-medium">{r.nome} ({r.email})</p>
                              <p className="text-muted-foreground mt-1">{r.error}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {results.filter((r: any) => r.success).length > 0 && (
                    <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        <strong>{results.filter((r: any) => r.success).length} usuário(s)</strong> foram 
                        importados com sucesso e já podem acessar o sistema!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default BulkImport;
