import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { useTenant } from "@/hooks/useTenant"
import { buildTenantPath } from "@/utils/tenantHelpers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Calendar, Clock, User, ArrowLeft, Home, Mail, Sparkles } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
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
  const [showAccountCreation, setShowAccountCreation] = useState(false)
  const [email, setEmail] = useState("")
  const [loadingMagicLink, setLoadingMagicLink] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const { tenant } = useTenant()
  const tenantSlug = tenant?.slug || 'alopsi'

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
        const appointmentData = {
          id: data.id,
          nome_paciente: data.nome_paciente,
          email_paciente: data.email_paciente,
          data_consulta: data.data_consulta,
          horario: data.horario,
          valor: data.valor,
          status: data.status,
          profissionais: Array.isArray(data.profissionais) ? data.profissionais[0] : data.profissionais
        }
        
        setAppointment(appointmentData)
        
        // Notificar sucesso do pagamento via n8n
        try {
          console.log('🔔 Enviando notificação de pagamento bem-sucedido para n8n...');
          const { data: notifyResult, error: notifyError } = await supabase.functions.invoke('notify-booking-status', {
            body: {
              tipo_evento: 'pagamento_sucesso',
              paciente: {
                nome: data.nome_paciente,
                email: data.email_paciente,
                telefone: data.telefone_paciente || 'N/A',
                esta_logado: !!user,
                user_id: user?.id || 'guest'
              },
              profissional: {
                nome: appointmentData.profissionais?.display_name || 'N/A',
                especialidade: appointmentData.profissionais?.profissao || 'N/A'
              },
              agendamento: {
                data: data.data_consulta,
                horario: data.horario,
                valor: data.valor,
                status: 'confirmado',
                id: data.id
              },
              notificacao_para: ['paciente', 'profissional', 'admin']
            }
          });
          
          if (notifyError) {
            console.error('❌ Erro ao invocar função n8n:', notifyError);
          } else {
            console.log('✅ Notificação de pagamento enviada:', notifyResult);
          }
        } catch (notifyError) {
          console.error('❌ Erro ao notificar sucesso de pagamento via n8n:', notifyError);
        }
        
        // Se não é usuário logado mas temos email, oferecer criação de conta
        if (!user && data.email_paciente) {
          setEmail(data.email_paciente)
          setShowAccountCreation(true)
        }
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMagicLink = async () => {
    if (!email || !appointment?.id) return
    
    setLoadingMagicLink(true)
    try {
      const { error } = await supabase.functions.invoke('send-magic-link', {
        body: {
          email,
          agendamentoId: appointment.id,
          type: 'account_creation'
        }
      })

      if (error) throw error

      toast({
        title: "Magic link enviado! ✨",
        description: "Verifique seu e-mail para criar sua conta em 1 clique.",
      })
      
      setShowAccountCreation(false)
    } catch (error: any) {
      console.error('Erro ao enviar magic link:', error)
      toast({
        title: "Erro ao enviar link",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      })
    } finally {
      setLoadingMagicLink(false)
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
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Success Message */}
          <div className="text-center">
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

          {/* Account Creation Offer for Guests */}
          {showAccountCreation && !user && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Sparkles className="h-5 w-5" />
                  Crie sua conta em 1 clique!
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Gerencie seus agendamentos, histórico e muito mais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Benefícios da conta:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>📅 Histórico completo de agendamentos</li>
                    <li>📝 Reagendamento fácil e rápido</li>
                    <li>🧾 Acesso a recibos e notas da consulta</li>
                    <li>⚡ Processo de agendamento simplificado</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Seu e-mail:</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSendMagicLink}
                    disabled={!email || loadingMagicLink}
                    className="flex-1"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {loadingMagicLink ? "Enviando..." : "Criar conta"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAccountCreation(false)}
                  >
                    Agora não
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appointment Details */}
          {appointment && (
            <Card>
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
          <Card>
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
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1">
              <Link to={buildTenantPath(tenantSlug, '/profissionais')}>
                <Calendar className="mr-2 h-4 w-4" />
                Novo Agendamento
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="flex-1">
              <Link to={buildTenantPath(tenantSlug, '/')}>
                <Home className="mr-2 h-4 w-4" />
                Página Inicial
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