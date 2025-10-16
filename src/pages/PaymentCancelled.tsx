import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { useTenant } from "@/hooks/useTenant"
import { buildTenantPath } from "@/utils/tenantHelpers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, Home, RefreshCw } from "lucide-react"

const PaymentCancelled = () => {
  const [searchParams] = useSearchParams()
  const [agendamentoId, setAgendamentoId] = useState<string | null>(null)
  const { tenant } = useTenant()
  const tenantSlug = tenant?.slug || 'alopsi'

  useEffect(() => {
    const id = searchParams.get('agendamento')
    setAgendamentoId(id)
  }, [searchParams])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Cancelled Message */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Pagamento Cancelado
            </h1>
            <p className="text-lg text-muted-foreground">
              O pagamento foi cancelado e o agendamento não foi confirmado.
            </p>
          </div>

          {/* Information Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>O que aconteceu?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  O processo de pagamento foi interrompido ou cancelado. Isso pode ter acontecido por alguns motivos:
                </p>
                
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                  <li>Você decidiu cancelar o pagamento</li>
                  <li>Houve um problema com o método de pagamento</li>
                  <li>A sessão de pagamento expirou</li>
                  <li>Ocorreu um erro técnico durante o processo</li>
                </ul>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">Não se preocupe!</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Nenhuma cobrança foi realizada e você pode tentar agendar novamente quando quiser.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>O que fazer agora?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Tente novamente</p>
                    <p className="text-sm text-muted-foreground">
                      Você pode voltar e tentar agendar a consulta novamente com o mesmo profissional.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Verifique os dados</p>
                    <p className="text-sm text-muted-foreground">
                      Certifique-se de que seus dados de pagamento estão corretos antes de tentar novamente.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Entre em contato</p>
                    <p className="text-sm text-muted-foreground">
                      Se o problema persistir, entre em contato conosco pelo suporte.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {agendamentoId && (
            <Card className="mb-8 border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-800 text-center">
                  <strong>ID da tentativa:</strong> <span className="font-mono">{agendamentoId}</span>
                </p>
                <p className="text-xs text-amber-700 text-center mt-1">
                  Use este ID se precisar entrar em contato com o suporte
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button variant="outline" size="lg" asChild>
              <Link to={buildTenantPath(tenantSlug, '/')}>
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Link>
            </Button>
            <Button size="lg" asChild>
              <Link to={buildTenantPath(tenantSlug, '/profissionais')}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default PaymentCancelled