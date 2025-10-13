import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useUserRegistrationTests } from "@/hooks/useUserRegistrationTests";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TestUserRegistration() {
  const navigate = useNavigate();
  const {
    runTest,
    runAllTests,
    cleanupTests,
    testResults,
    isRunning,
    overallStats
  } = useUserRegistrationTests();

  const [cleanupLoading, setCleanupLoading] = useState(false);

  const handleCleanup = async () => {
    setCleanupLoading(true);
    await cleanupTests();
    setCleanupLoading(false);
  };

  const getStatusBadge = (status: 'success' | 'failed' | 'running' | null) => {
    if (status === 'success') return <Badge className="bg-green-500">✓ Sucesso</Badge>;
    if (status === 'failed') return <Badge variant="destructive">✗ Falhou</Badge>;
    if (status === 'running') return <Badge variant="outline"><Loader2 className="h-3 w-3 animate-spin mr-1" />Executando</Badge>;
    return <Badge variant="outline">Não executado</Badge>;
  };

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Admin
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">🧪 Testes de Cadastro Multi-Tenant</h1>
              <p className="text-muted-foreground mt-2">
                Valide o cadastro de profissionais e pacientes nos tenants Alopsi e Medcos
              </p>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Status Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{overallStats.total}</div>
                <div className="text-sm text-muted-foreground">Total de Testes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{overallStats.success}</div>
                <div className="text-sm text-muted-foreground">Sucesso</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{overallStats.failed}</div>
                <div className="text-sm text-muted-foreground">Falhas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {overallStats.total > 0 
                    ? `${Math.round((overallStats.success / overallStats.total) * 100)}%`
                    : '0%'
                  }
                </div>
                <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => runAllTests()}
            disabled={isRunning}
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Executar Todos os Testes
              </>
            )}
          </Button>

          <Button
            onClick={handleCleanup}
            disabled={cleanupLoading || testResults.length === 0}
            variant="outline"
            size="lg"
          >
            {cleanupLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Limpando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Dados de Teste
              </>
            )}
          </Button>
        </div>

        {/* Test Cards - Alopsi */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">📋 Alopsi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Professional Test - Alopsi */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Profissional Alopsi
                  {getStatusBadge(testResults.find(r => r.test_type === 'professional_registration' && r.tenant === 'alopsi')?.status || null)}
                </CardTitle>
                <CardDescription>
                  Teste de cadastro de profissional no tenant Alopsi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => runTest('professional', 'alopsi')}
                  disabled={isRunning}
                  className="w-full mb-4"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Executar Teste
                </Button>

                {testResults
                  .filter(r => r.test_type === 'professional_registration' && r.tenant === 'alopsi')
                  .map((result, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Duração: {formatDuration(result.duration_ms)}
                      </div>
                      
                      {result.validations.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-sm font-semibold">Validações:</div>
                          {result.validations.map((v, vIdx) => (
                            <div key={vIdx} className="flex items-center gap-2 text-sm">
                              {v.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className={v.passed ? 'text-green-700' : 'text-red-700'}>
                                {v.check}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {result.errors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertDescription>
                            {result.errors.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))
                }
              </CardContent>
            </Card>

            {/* Patient Test - Alopsi */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Paciente Alopsi
                  {getStatusBadge(testResults.find(r => r.test_type === 'patient_registration' && r.tenant === 'alopsi')?.status || null)}
                </CardTitle>
                <CardDescription>
                  Teste de cadastro de paciente no tenant Alopsi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => runTest('patient', 'alopsi')}
                  disabled={isRunning}
                  className="w-full mb-4"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Executar Teste
                </Button>

                {testResults
                  .filter(r => r.test_type === 'patient_registration' && r.tenant === 'alopsi')
                  .map((result, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Duração: {formatDuration(result.duration_ms)}
                      </div>
                      
                      {result.validations.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-sm font-semibold">Validações:</div>
                          {result.validations.map((v, vIdx) => (
                            <div key={vIdx} className="flex items-center gap-2 text-sm">
                              {v.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className={v.passed ? 'text-green-700' : 'text-red-700'}>
                                {v.check}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {result.errors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertDescription>
                            {result.errors.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))
                }
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Test Cards - Medcos */}
        <div>
          <h2 className="text-2xl font-bold mb-4">📋 Medcos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Professional Test - Medcos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Profissional Medcos
                  {getStatusBadge(testResults.find(r => r.test_type === 'professional_registration' && r.tenant === 'medcos')?.status || null)}
                </CardTitle>
                <CardDescription>
                  Teste de cadastro de profissional no tenant Medcos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => runTest('professional', 'medcos')}
                  disabled={isRunning}
                  className="w-full mb-4"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Executar Teste
                </Button>

                {testResults
                  .filter(r => r.test_type === 'professional_registration' && r.tenant === 'medcos')
                  .map((result, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Duração: {formatDuration(result.duration_ms)}
                      </div>
                      
                      {result.validations.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-sm font-semibold">Validações:</div>
                          {result.validations.map((v, vIdx) => (
                            <div key={vIdx} className="flex items-center gap-2 text-sm">
                              {v.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className={v.passed ? 'text-green-700' : 'text-red-700'}>
                                {v.check}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {result.errors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertDescription>
                            {result.errors.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))
                }
              </CardContent>
            </Card>

            {/* Patient Test - Medcos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Paciente Medcos
                  {getStatusBadge(testResults.find(r => r.test_type === 'patient_registration' && r.tenant === 'medcos')?.status || null)}
                </CardTitle>
                <CardDescription>
                  Teste de cadastro de paciente no tenant Medcos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => runTest('patient', 'medcos')}
                  disabled={isRunning}
                  className="w-full mb-4"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Executar Teste
                </Button>

                {testResults
                  .filter(r => r.test_type === 'patient_registration' && r.tenant === 'medcos')
                  .map((result, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Duração: {formatDuration(result.duration_ms)}
                      </div>
                      
                      {result.validations.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-sm font-semibold">Validações:</div>
                          {result.validations.map((v, vIdx) => (
                            <div key={vIdx} className="flex items-center gap-2 text-sm">
                              {v.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className={v.passed ? 'text-green-700' : 'text-red-700'}>
                                {v.check}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {result.errors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertDescription>
                            {result.errors.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))
                }
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
