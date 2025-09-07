import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, User, MapPin, Phone, Mail, DollarSign, CalendarX, RotateCcw, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useNavigate } from "react-router-dom"

interface Appointment {
  id: string
  nome_paciente: string
  email_paciente: string
  telefone_paciente: string
  data_consulta: string
  horario: string
  valor: number
  status: string
  observacoes: string | null
  created_at: string
  mercado_pago_preference_id: string | null
  profissionais?: {
    display_name: string
    profissao: string
    telefone: string
    email_secundario: string
  } | null
}

const MyAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      fetchAppointments()
    }
  }, [user])

  const fetchAppointments = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          profissionais:professional_id (
            display_name,
            profissao,
            telefone,
            email_secundario
          )
        `)
        .eq('user_id', user.id)
        .order('data_consulta', { ascending: true })

      if (error) {
        console.error('Erro ao buscar agendamentos:', error)
        toast({
          title: "Erro ao carregar agendamentos",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive"
        })
        return
      }

      const formattedData = data?.map(item => ({
        ...item,
        profissionais: Array.isArray(item.profissionais) ? item.profissionais[0] : item.profissionais
      })) || []

      setAppointments(formattedData)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const canModifyAppointment = (dataConsulta: string, horario: string) => {
    const appointmentDateTime = new Date(`${dataConsulta}T${horario}`)
    const now = new Date()
    const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    return diffHours >= 24
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    setCancelingId(appointmentId)
    
    try {
      const { error } = await supabase.functions.invoke('cancel-appointment', {
        body: { appointmentId }
      })

      if (error) throw error

      toast({
        title: "Agendamento cancelado! ✅",
        description: "O reembolso será processado em até 5 dias úteis.",
      })

      // Atualizar a lista
      await fetchAppointments()
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error)
      toast({
        title: "Erro ao cancelar",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive"
      })
    } finally {
      setCancelingId(null)
    }
  }

  const handleReschedule = (appointmentId: string) => {
    // Redirecionar para página de reagendamento
    navigate(`/reagendar/${appointmentId}`)
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
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'cancelado':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filterAppointments = (status: 'all' | 'upcoming' | 'past' | 'cancelled') => {
    const now = new Date()
    
    return appointments.filter(appointment => {
      const appointmentDateTime = new Date(`${appointment.data_consulta}T${appointment.horario}`)
      
      switch (status) {
        case 'upcoming':
          return appointmentDateTime > now && appointment.status !== 'cancelado'
        case 'past':
          return appointmentDateTime <= now && appointment.status !== 'cancelado'
        case 'cancelled':
          return appointment.status === 'cancelado'
        default:
          return true
      }
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
            <p className="text-muted-foreground mb-6">
              Você precisa estar logado para ver seus agendamentos.
            </p>
            <Button asChild>
              <Link to="/auth">Fazer Login</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando seus agendamentos...</p>
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
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Meus Agendamentos 📅
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas consultas, cancele ou reagende quando necessário
            </p>
          </div>

          {/* Alerta sobre regra de 24h */}
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <strong>Importante:</strong> Cancelamentos e reagendamentos só são permitidos até 24 horas antes da consulta.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Todos ({appointments.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Próximos ({filterAppointments('upcoming').length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Realizados ({filterAppointments('past').length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelados ({filterAppointments('cancelled').length})
              </TabsTrigger>
            </TabsList>

            {['all', 'upcoming', 'past', 'cancelled'].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {filterAppointments(tab as any).length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        Nenhum agendamento encontrado
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {tab === 'all' && "Você ainda não possui agendamentos."}
                        {tab === 'upcoming' && "Não há consultas agendadas."}
                        {tab === 'past' && "Não há consultas realizadas."}
                        {tab === 'cancelled' && "Não há consultas canceladas."}
                      </p>
                      {tab === 'all' && (
                        <Button asChild>
                          <Link to="/professionals">
                            Agendar Consulta
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  filterAppointments(tab as any).map((appointment) => {
                    const canModify = canModifyAppointment(appointment.data_consulta, appointment.horario)
                    const isPending = appointment.status === 'pendente'
                    
                    return (
                      <Card key={appointment.id} className="overflow-hidden">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <User className="h-5 w-5 text-primary" />
                              {appointment.profissionais?.display_name}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(appointment.status)}
                              <Badge className={getStatusColor(appointment.status)}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          <CardDescription>
                            {appointment.profissionais?.profissao}
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Detalhes da Consulta */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-foreground">Detalhes da Consulta</h4>
                              
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
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  <div>
                                    <p className="text-sm font-medium">Valor</p>
                                    <p className="text-lg font-bold text-green-600">
                                      {formatPrice(appointment.valor)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Contato do Profissional */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-foreground">Contato</h4>
                              
                              <div className="space-y-3">
                                {appointment.profissionais?.telefone && (
                                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <Phone className="h-4 w-4 text-primary" />
                                    <div>
                                      <p className="text-sm font-medium">Telefone</p>
                                      <p className="text-sm text-muted-foreground">
                                        {appointment.profissionais.telefone}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {appointment.profissionais?.email_secundario && (
                                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <Mail className="h-4 w-4 text-primary" />
                                    <div>
                                      <p className="text-sm font-medium">E-mail</p>
                                      <p className="text-sm text-muted-foreground">
                                        {appointment.profissionais.email_secundario}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Observações */}
                          {appointment.observacoes && (
                            <div className="border-t pt-4">
                              <h4 className="font-medium text-foreground mb-2">Observações</h4>
                              <p className="text-sm text-muted-foreground">
                                {appointment.observacoes}
                              </p>
                            </div>
                          )}

                          {/* Ações */}
                          {appointment.status !== 'cancelado' && (
                            <div className="border-t pt-4">
                              <div className="flex flex-col sm:flex-row gap-3">
                                {canModify ? (
                                  <>
                                    <Button
                                      onClick={() => handleReschedule(appointment.id)}
                                      variant="outline"
                                      className="flex-1"
                                    >
                                      <RotateCcw className="mr-2 h-4 w-4" />
                                      Reagendar
                                    </Button>
                                    
                                    <Button
                                      onClick={() => handleCancelAppointment(appointment.id)}
                                      variant="destructive"
                                      className="flex-1"
                                      disabled={cancelingId === appointment.id}
                                    >
                                      <CalendarX className="mr-2 h-4 w-4" />
                                      {cancelingId === appointment.id ? "Cancelando..." : "Cancelar"}
                                    </Button>
                                  </>
                                ) : (
                                  <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                      Não é mais possível cancelar ou reagendar esta consulta 
                                      (menos de 24h de antecedência).
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            </div>
                          )}

                          {/* ID do Agendamento */}
                          <div className="border-t pt-4">
                            <p className="text-xs text-muted-foreground text-center">
                              ID: <span className="font-mono">{appointment.id}</span>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Ação para novo agendamento */}
          <div className="text-center mt-8">
            <Button asChild size="lg">
              <Link to="/professionals">
                <Calendar className="mr-2 h-5 w-5" />
                Agendar Nova Consulta
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default MyAppointments