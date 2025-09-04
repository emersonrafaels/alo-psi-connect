import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, Clock, User, ArrowLeft, Home } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

interface AppointmentData {
  id: string
  nome_paciente: string
  email_paciente: string
  data_consulta: string
  horario: string
  valor: number
  status: string
  profissionais?: {
    display_name: string
    profissao: string
  } | null
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams()
  const [appointment, setAppointment] = useState<AppointmentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const agendamentoId = searchParams.get('agendamento')
    
    if (agendamentoId) {
      fetchAppointment(agendamentoId)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  const fetchAppointment = async (agendamentoId: string) => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          profissionais:professional_id (
            display_name,
            profissao
          )
        `)
        .eq('id', agendamentoId)
        .single()

      if (error) {
        console.error('Erro ao buscar agendamento:', error)
      } else {
        setAppointment({
          id: data.id,
          nome_paciente: data.nome_paciente,
          email_paciente: data.email_paciente,
          data_consulta: data.data_consulta,
          horario: data.horario,
          valor: data.valor,
          status: data.status,
          profissionais: Array.isArray(data.profissionais) ? data.profissionais[0] : data.profissionais
        })
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando informações...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Pagamento Realizado com Sucesso! 🎉
            </h1>
            <p className="text-lg text-muted-foreground">
              Seu agendamento foi confirmado e você receberá um email de confirmação.
            </p>
          </div>

          {/* Appointment Details */}
          {appointment && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Detalhes da Consulta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Profissional</p>
                      <p className="text-lg font-semibold">{appointment.profissionais?.display_name}</p>
                      <p className="text-sm text-muted-foreground">{appointment.profissionais?.profissao}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Paciente</p>
                      <p className="text-lg font-semibold">{appointment.nome_paciente}</p>
                      <p className="text-sm text-muted-foreground">{appointment.email_paciente}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Data</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appointment.data_consulta).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Horário</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.horario.substring(0, 5)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Valor Pago</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatPrice(appointment.valor)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground text-center">
                    ID do Agendamento: <span className="font-mono">{appointment.id}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Email de Confirmação</p>
                    <p className="text-sm text-muted-foreground">
                      Você receberá um email com todos os detalhes da consulta.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Contato do Profissional</p>
                    <p className="text-sm text-muted-foreground">
                      O profissional entrará em contato para confirmar detalhes e link da consulta.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Aguarde a Consulta</p>
                    <p className="text-sm text-muted-foreground">
                      Fique atento ao horário agendado e prepare-se para sua consulta.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/profissionais">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Agendar Outra Consulta
              </Link>
            </Button>
            <Button size="lg" asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default PaymentSuccess