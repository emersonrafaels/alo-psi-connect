import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/integrations/supabase/client"
import { Loader2, Brain, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UpdateResult {
  id: number
  name: string
  status: 'success' | 'error'
  error?: string
  originalServices: string[]
  standardizedServices: string | null
}

interface UpdateResponse {
  success: boolean
  message: string
  results: UpdateResult[]
  summary: {
    total: number
    successful: number
    errors: number
  }
}

const SpecialtiesUpdater = () => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [results, setResults] = useState<UpdateResponse | null>(null)
  const { toast } = useToast()

  const handleUpdateSpecialties = async () => {
    setIsUpdating(true)
    setResults(null)

    try {
      toast({
        title: "Iniciando atualização",
        description: "Processando especialidades com IA...",
      })

      const { data, error } = await supabase.functions.invoke('update-specialties', {
        body: {}
      })

      if (error) {
        throw new Error(error.message)
      }

      setResults(data)
      
      if (data.success) {
        toast({
          title: "Atualização concluída!",
          description: data.message,
        })
      } else {
        toast({
          title: "Erro na atualização",
          description: data.error || "Erro desconhecido",
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error('Erro ao atualizar especialidades:', error)
      toast({
        title: "Erro na atualização",
        description: "Ocorreu um erro ao processar as especialidades. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Atualização de Especialidades com IA
          </CardTitle>
          <CardDescription>
            Use inteligência artificial para padronizar e organizar as especialidades dos profissionais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              Esta ferramenta irá analisar todas as especialidades cadastradas e padronizá-las 
              usando IA, garantindo consistência e melhor organização dos dados.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button 
              onClick={handleUpdateSpecialties}
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isUpdating ? 'Processando...' : 'Atualizar Especialidades'}
            </Button>
          </div>

          {isUpdating && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando dados com OpenAI... Isso pode levar alguns minutos.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Resultados da Atualização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.summary && (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{results.summary.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{results.summary.successful}</div>
                  <div className="text-sm text-muted-foreground">Sucessos</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{results.summary.errors}</div>
                  <div className="text-sm text-muted-foreground">Erros</div>
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.results.map((result) => (
                <Card key={result.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{result.name}</h4>
                          <Badge 
                            variant={result.status === 'success' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {result.status === 'success' ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {result.status}
                          </Badge>
                        </div>

                        {result.originalServices.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground mb-1">Especialidades Originais:</p>
                            <div className="flex flex-wrap gap-1">
                              {result.originalServices.map((service, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.standardizedServices && (
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground mb-1">Especialidades Padronizadas:</p>
                            <div className="flex flex-wrap gap-1">
                              {result.standardizedServices.split(',').map((service, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {service.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.error && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            Erro: {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SpecialtiesUpdater