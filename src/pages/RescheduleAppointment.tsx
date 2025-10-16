import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, User, DollarSign, ArrowLeft, ArrowRight, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { RescheduleCalendar } from "@/components/RescheduleCalendar"
import { useTenant } from "@/hooks/useTenant"
import { buildTenantPath } from "@/utils/tenantHelpers"

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
  profissionais?: {
    display_name: string
    profissao: string
    telefone: string
    email_secundario: string
  } | null
}

interface Professional {
  id: number
  display_name: string
  profissao: string
  preco_consulta: number
  tempo_consulta: number
  resumo_profissional: string
  foto_perfil_url: string
}

interface Session {
  id: number
  day: string
  start_time: string
  end_time: string
  time_slot: number
}

const RescheduleAppointment = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [rescheduling, setRescheduling] = useState(false)
  const [step, setStep] = useState<'appointment' | 'professional' | 'datetime'>('appointment')
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const tenantSlug = tenant?.slug || 'alopsi'

  useEffect(() => {
    if (user && appointmentId) {
      fetchAppointment()
    }
  }, [user, appointmentId])

  useEffect(() => {
    if (step === 'professional') {
      fetchProfessionals()
    }
  }, [step])

  useEffect(() => {
    if (selectedProfessional) {
      fetchSessions(selectedProfessional.id)
    }
  }, [selectedProfessional])

  const fetchAppointment = async () => {
    if (!user || !appointmentId) return

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
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        console.error('Erro ao buscar agendamento:', error)
        toast({
          title: "Agendamento não encontrado",
          description: "Verifique se o ID está correto.",
          variant: "destructive"
        })
        navigate('/agendamentos')
        return
      }

      const appointmentData = {
        ...data,
        profissionais: Array.isArray(data.profissionais) ? data.profissionais[0] : data.profissionais
      }

      // Verificar se pode reagendar (24h de antecedência)
      const appointmentDateTime = new Date(`${data.data_consulta}T${data.horario}`)
      const now = new Date()
      const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      if (diffHours < 24) {
        toast({
          title: "Reagendamento não permitido",
          description: "Só é possível reagendar até 24h antes da consulta.",
          variant: "destructive"
        })
        navigate('/agendamentos')
        return
      }

      if (data.status === 'cancelado') {
        toast({
          title: "Agendamento cancelado",
          description: "Não é possível reagendar um agendamento cancelado.",
          variant: "destructive"
        })
        navigate('/agendamentos')
        return
      }

      setAppointment(appointmentData)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select('id, display_name, profissao, preco_consulta, tempo_consulta, resumo_profissional, foto_perfil_url')
        .eq('ativo', true)

      if (error) {
        console.error('Erro ao buscar profissionais:', error)
        return
      }

      setProfessionals(data || [])
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const fetchSessions = async (professionalId: number) => {
    try {
      const { data, error } = await supabase
        .from('profissionais_sessoes')
        .select('*')
        .eq('user_id', professionalId)

      if (error) {
        console.error('Erro ao buscar sessões:', error)
        return
      }

      setSessions(data || [])
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const handleReschedule = async (newDate: string, newTime: string) => {
    if (!appointment || !selectedProfessional) return

    setRescheduling(true)

    try {
      const { error } = await supabase.functions.invoke('reschedule-appointment', {
        body: {
          appointmentId: appointment.id,
          newProfessionalId: selectedProfessional.id,
          newDate,
          newTime,
          originalValue: appointment.valor,
          newValue: selectedProfessional.preco_consulta
        }
      })

      if (error) throw error

      toast({
        title: "Reagendamento realizado! ✅",
        description: "Sua consulta foi reagendada com sucesso.",
      })

      navigate('/agendamentos')
    } catch (error: any) {
      console.error('Erro ao reagendar:', error)
      toast({
        title: "Erro ao reagendar",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive"
      })
    } finally {
      setRescheduling(false)
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
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculatePriceDifference = () => {
    if (!appointment || !selectedProfessional) return 0
    return selectedProfessional.preco_consulta - appointment.valor
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
            <p className="text-muted-foreground mb-6">
              Você precisa estar logado para reagendar consultas.
            </p>
            <Button asChild>
              <Link to={buildTenantPath(tenantSlug, '/auth')}>Fazer Login</Link>
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
            <p className="mt-4 text-muted-foreground">Carregando informações...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Agendamento não encontrado</h1>
            <Button asChild>
              <Link to={buildTenantPath(tenantSlug, '/agendamentos')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar aos Agendamentos
              </Link>
            </Button>
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="sm" asChild>
              <Link to={buildTenantPath(tenantSlug, '/agendamentos')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Reagendar Consulta
              </h1>
              <p className="text-muted-foreground">
                Escolha um novo profissional e horário
              </p>
            </div>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${step === 'appointment' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'appointment' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  1
                </div>
                <span className="ml-2">Consulta Atual</span>
              </div>
              
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              
              <div className={`flex items-center ${step === 'professional' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'professional' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  2
                </div>
                <span className="ml-2">Novo Profissional</span>
              </div>
              
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              
              <div className={`flex items-center ${step === 'datetime' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'datetime' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  3
                </div>
                <span className="ml-2">Nova Data/Hora</span>
              </div>
            </div>
          </div>

          {/* Step 1: Current Appointment */}
          {step === 'appointment' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Consulta Atual</CardTitle>
                  <CardDescription>
                    Detalhes da consulta que será reagendada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Profissional</p>
                        <p className="text-lg font-semibold">{appointment.profissionais?.display_name}</p>
                        <p className="text-sm text-muted-foreground">{appointment.profissionais?.profissao}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Data</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(appointment.data_consulta)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
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
                          <p className="text-sm font-medium">Valor Pago</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatPrice(appointment.valor)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button onClick={() => setStep('professional')} size="lg">
                  Escolher Novo Profissional
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Choose Professional */}
          {step === 'professional' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Escolha o Novo Profissional</CardTitle>
                  <CardDescription>
                    Selecione um profissional para reagendar sua consulta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {professionals.map((professional) => {
                      const priceDiff = professional.preco_consulta - appointment.valor
                      
                      return (
                        <Card 
                          key={professional.id} 
                          className={`cursor-pointer transition-all ${
                            selectedProfessional?.id === professional.id 
                              ? 'ring-2 ring-primary bg-primary/5' 
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => setSelectedProfessional(professional)}
                        >
                          <CardContent className="p-4">
                            <div className="text-center space-y-3">
                              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                <User className="h-8 w-8 text-primary" />
                              </div>
                              
                              <div>
                                <h3 className="font-semibold">{professional.display_name}</h3>
                                <p className="text-sm text-muted-foreground">{professional.profissao}</p>
                              </div>
                              
                              <div className="space-y-2">
                                <p className="text-lg font-bold">
                                  {formatPrice(professional.preco_consulta)}
                                </p>
                                
                                {priceDiff !== 0 && (
                                  <Badge variant={priceDiff > 0 ? "destructive" : "default"}>
                                    {priceDiff > 0 ? '+' : ''}{formatPrice(priceDiff)}
                                  </Badge>
                                )}
                              </div>
                              
                              {professional.resumo_profissional && (
                                <p className="text-xs text-muted-foreground line-clamp-3">
                                  {professional.resumo_profissional}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {selectedProfessional && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Profissional selecionado: <strong>{selectedProfessional.display_name}</strong>
                      {calculatePriceDifference() !== 0 && (
                        <span className="ml-2">
                          (Diferença: {calculatePriceDifference() > 0 ? '+' : ''}{formatPrice(calculatePriceDifference())})
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>

                  <div className="text-center">
                    <Button onClick={() => setStep('datetime')} size="lg">
                      Escolher Data e Hora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Choose Date/Time */}
          {step === 'datetime' && selectedProfessional && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Escolha a Nova Data e Hora</CardTitle>
                  <CardDescription>
                    Profissional: {selectedProfessional.display_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RescheduleCalendar 
                    sessions={sessions}
                    professionalName={selectedProfessional.display_name}
                    price={formatPrice(selectedProfessional.preco_consulta)}
                    onBooking={handleReschedule}
                    loading={rescheduling}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default RescheduleAppointment