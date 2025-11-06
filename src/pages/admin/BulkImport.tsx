import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useBulkUserImport } from '@/hooks/useBulkUserImport';
import { useAdminTenant } from '@/contexts/AdminTenantContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const BulkImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<any>(null);
  const { loading, progress, importUsers, downloadTemplate } = useBulkUserImport();
  const { selectedTenantId, tenants } = useAdminTenant();
  
  const selectedTenant = tenants.find(t => t.id === selectedTenantId);
  const tenantSlug = selectedTenantId === 'all' ? 'alopsi' : (selectedTenant?.slug || 'alopsi');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    const result = await importUsers(file, tenantSlug);
    if (result.success) {
      setResults(result.data);
    }
  };

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
              Selecione a planilha preenchida para importação
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

            {loading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground text-center">
                  Processando... {progress}%
                </p>
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!file || loading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {loading ? 'Importando...' : 'Iniciar Importação'}
            </Button>
          </CardContent>
        </Card>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>3. Resultados</CardTitle>
              <CardDescription>
                Resumo da importação realizada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{results.length}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Sucesso</p>
                    <p className="text-2xl font-bold text-green-600">
                      {results.filter((r: any) => r.success).length}
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Erros</p>
                    <p className="text-2xl font-bold text-red-600">
                      {results.filter((r: any) => !r.success).length}
                    </p>
                  </div>
                </div>

                {results.filter((r: any) => !r.success).length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-red-600">Erros Encontrados:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {results
                        .filter((r: any) => !r.success)
                        .map((r: any, i: number) => (
                          <div key={i} className="text-sm border-l-2 border-red-500 pl-3 py-1">
                            <p className="font-medium">{r.nome} ({r.email})</p>
                            <p className="text-muted-foreground">{r.error}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default BulkImport;
