import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { useTenant } from "@/hooks/useTenant"
import { buildTenantPath } from "@/utils/tenantHelpers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Mail, Phone, MapPin, CheckCircle, AlertCircle, Sparkles, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"

interface AppointmentData {
  id: string
  nome_paciente: string
  email_paciente: string
  telefone_paciente: string
  data_consulta: string
  horario: string
  valor: number
  status: string
  observacoes: string | null
  profissionais?: {
    display_name: string
    profissao: string
    telefone: string
    email_secundario: string
  } | null
}

const AppointmentAccess = () => {
  const { token } = useParams<{ token: string }>()
  const [appointment, setAppointment] = useState<AppointmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAccountCreation, setShowAccountCreation] = useState(false)
  const [loadingMagicLink, setLoadingMagicLink] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const { tenant } = useTenant()
  const tenantSlug = tenant?.slug || 'alopsi'

  useEffect(() => {
    if (token) {
      fetchAppointmentByToken(token)
    }
  }, [token])

  const fetchAppointmentByToken = async (tokenValue: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('redeem-appointment-token', {
        body: { token: tokenValue },
      })

      if (error || !data || (data as any).error) {
        const code = (data as any)?.error
        if (code === 'appointment_not_found') {
          setError('Agendamento não encontrado')
        } else if (code === 'email_mismatch') {
          setError('Token não corresponde ao agendamento')
        } else {
          setError('Token inválido ou expirado')
        }
        setLoading(false)
        return
      }

      const appointmentPayload = (data as any).appointment
      setAppointment({
        id: appointmentPayload.id,
        nome_paciente: appointmentPayload.nome_paciente,
        email_paciente: appointmentPayload.email_paciente,
        telefone_paciente: appointmentPayload.telefone_paciente,
        data_consulta: appointmentPayload.data_consulta,
        horario: appointmentPayload.horario,
        valor: appointmentPayload.valor,
        status: appointmentPayload.status,
        observacoes: appointmentPayload.observacoes,
        profissionais: Array.isArray(appointmentPayload.profissionais)
          ? appointmentPayload.profissionais[0]
          : appointmentPayload.profissionais,
      })

      // Se não é usuário logado, oferecer criação de conta
      if (!user) {
        setShowAccountCreation(true)
      }
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error)
      setError('Erro interno do servidor')
    } finally {
      setLoading(false)
    }
  }


  const handleSendMagicLink = async () => {
    if (!appointment?.email_paciente) return
    
    setLoadingMagicLink(true)
    try {
      const { error } = await supabase.functions.invoke('send-magic-link', {
        body: {
          email: appointment.email_paciente,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-green-100 text-green-800'
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Verificando acesso...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button asChild>
                <Link to={buildTenantPath(tenantSlug, '/profissionais')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Fazer Novo Agendamento
                </Link>
              </Button>
            </div>
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
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Título */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Seu Agendamento 📅
            </h1>
            <p className="text-muted-foreground">
              Detalhes da sua consulta agendada
            </p>
          </div>

          {/* Account Creation Offer */}
          {showAccountCreation && !user && (
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Sparkles className="h-5 w-5" />
                  💡 Crie sua conta para mais benefícios!
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Gerencie todos os seus agendamentos em um só lugar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Histórico completo
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Reagendamento fácil
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Recibos organizados
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Notas da consulta
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSendMagicLink}
                    disabled={loadingMagicLink}
                    className="flex-1"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {loadingMagicLink ? "Enviando..." : "Criar conta em 1 clique"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAccountCreation(false)}
                  >
                    Depois
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appointment Details */}
          {appointment && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Detalhes da Consulta
                  </CardTitle>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Professional Info */}
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profissional
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">{appointment.profissionais?.display_name}</p>
                      <p className="text-sm text-muted-foreground">{appointment.profissionais?.profissao}</p>
                    </div>
                    <div className="space-y-1">
                      {appointment.profissionais?.telefone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4" />
                          <span>{appointment.profissionais.telefone}</span>
                        </div>
                      )}
                      {appointment.profissionais?.email_secundario && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4" />
                          <span>{appointment.profissionais.email_secundario}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Appointment Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Paciente</p>
                      <p className="text-lg font-semibold">{appointment.nome_paciente}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{appointment.email_paciente}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{appointment.telefone_paciente}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Data</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(appointment.data_consulta)}
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
                          <p className="text-sm font-medium">Valor</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatPrice(appointment.valor)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {appointment.observacoes && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Observações</p>
                    <p className="text-sm">{appointment.observacoes}</p>
                  </div>
                )}

                {/* Appointment ID */}
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground text-center">
                    ID do Agendamento: <span className="font-mono">{appointment.id}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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
                <ArrowLeft className="mr-2 h-4 w-4" />
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

export default AppointmentAccess