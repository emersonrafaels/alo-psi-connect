import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, User, DollarSign, ArrowLeft, Repeat, Users, Search } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { RescheduleCalendar } from "@/components/RescheduleCalendar"
import { RescheduleStepIndicator } from "@/components/reschedule/RescheduleStepIndicator"
import { ProfessionalRescheduleCard } from "@/components/reschedule/ProfessionalRescheduleCard"
import { RescheduleSummary } from "@/components/reschedule/RescheduleSummary"
import { RescheduleReasonSelect } from "@/components/reschedule/RescheduleReasonSelect"
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
  professional_id: number
  profissionais?: {
    display_name: string
    profissao: string
    telefone: string
    email_secundario: string
  } | null
}

interface Professional {
  id: number
  user_id: number
  display_name: string
  profissao: string
  preco_consulta: number
  tempo_consulta: number
  resumo_profissional: string
  foto_perfil_url: string
  especialidades?: string[]
  genero?: string
  raca?: string
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
  const [rescheduleReason, setRescheduleReason] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [summaryConfirmed, setSummaryConfirmed] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [loadingKeepSame, setLoadingKeepSame] = useState(false)
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
      fetchSessions(selectedProfessional.user_id)
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
        navigate(buildTenantPath(tenantSlug, '/agendamentos'))
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
        navigate(buildTenantPath(tenantSlug, '/agendamentos'))
        return
      }

      if (data.status === 'cancelado') {
        toast({
          title: "Agendamento cancelado",
          description: "Não é possível reagendar um agendamento cancelado.",
          variant: "destructive"
        })
        navigate(buildTenantPath(tenantSlug, '/agendamentos'))
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
        .select('id, user_id, display_name, profissao, preco_consulta, tempo_consulta, resumo_profissional, foto_perfil_url')
        .eq('ativo', true)
        .order('display_name', { ascending: true })

      if (error) {
        console.error('Erro ao buscar profissionais:', error)
        return
      }

      setProfessionals(data || [])
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const fetchSessions = async (userIdProfissional: number) => {
    try {
      const { data, error } = await supabase
        .from('profissionais_sessoes')
        .select('*')
        .eq('user_id', userIdProfissional)

      if (error) {
        console.error('Erro ao buscar sessões:', error)
        return
      }

      setSessions(data || [])
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const handleKeepSameProfessional = async () => {
    if (!appointment?.professional_id) {
      toast({
        title: "Erro",
        description: "Profissional não identificado.",
        variant: "destructive"
      })
      return
    }
    
    setLoadingKeepSame(true)
    
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select('id, user_id, display_name, profissao, preco_consulta, tempo_consulta, resumo_profissional, foto_perfil_url')
        .eq('id', appointment.professional_id)
        .single()
      
      if (error || !data) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar o profissional.",
          variant: "destructive"
        })
        return
      }
      
      setSelectedProfessional(data)
      setStep('datetime')
    } catch (error) {
      console.error('Erro ao buscar profissional:', error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoadingKeepSame(false)
    }
  }

  const handleDateTimeSelect = (newDate: string, newTime: string) => {
    setSelectedDate(newDate)
    setSelectedTime(newTime)
    setSummaryConfirmed(false)
  }

  const handleReschedule = async () => {
    if (!appointment || !selectedProfessional || !selectedDate || !selectedTime || !summaryConfirmed) return

    setRescheduling(true)

    try {
      const { error } = await supabase.functions.invoke('reschedule-appointment', {
        body: {
          appointmentId: appointment.id,
          newProfessionalId: selectedProfessional.id,
          newDate: selectedDate,
          newTime: selectedTime,
          originalValue: appointment.valor,
          newValue: selectedProfessional.preco_consulta,
          reason: rescheduleReason || null
        }
      })

      if (error) throw error

      toast({
        title: "Reagendamento realizado! ✅",
        description: "Sua consulta foi reagendada com sucesso.",
      })

      navigate(buildTenantPath(tenantSlug, '/agendamentos'))
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

  const filteredProfessionals = professionals.filter(prof => 
    prof.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.profissao.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <RescheduleStepIndicator 
            currentStep={step}
            onStepClick={(newStep) => {
              if (newStep === 'appointment') setStep('appointment')
              if (newStep === 'professional' && selectedProfessional) setStep('professional')
            }}
          />

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
                <CardContent className="space-y-6">
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

                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-sm font-medium">Valor Pago</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formatPrice(appointment.valor)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reschedule Reason */}
                  <RescheduleReasonSelect 
                    value={rescheduleReason}
                    onChange={setRescheduleReason}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={handleKeepSameProfessional}
                  size="lg"
                  className="h-auto py-6 flex-col gap-2"
                  variant="default"
                  disabled={loadingKeepSame}
                >
                  <Repeat className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-semibold">
                      {loadingKeepSame ? "Carregando..." : "Manter Mesmo Profissional"}
                    </div>
                    <div className="text-xs opacity-80 font-normal">Pular para escolha de data</div>
                  </div>
                </Button>

                <Button 
                  onClick={() => setStep('professional')}
                  size="lg"
                  className="h-auto py-6 flex-col gap-2"
                  variant="outline"
                >
                  <Users className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-semibold">Trocar de Profissional</div>
                    <div className="text-xs opacity-80 font-normal">Ver outros profissionais</div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Choose Professional */}
          {step === 'professional' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Escolha o Novo Profissional</CardTitle>
                      <CardDescription>
                        Selecione um profissional para reagendar sua consulta
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep('appointment')}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar profissional por nome ou profissão..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Professional Cards */}
                  <div className="space-y-3">
                    {filteredProfessionals.map((professional) => (
                      <ProfessionalRescheduleCard
                        key={professional.id}
                        professional={professional}
                        currentProfessionalId={professionals.find(p => 
                          p.display_name === appointment.profissionais?.display_name
                        )?.id}
                        originalPrice={appointment.valor}
                        isSelected={selectedProfessional?.id === professional.id}
                        onClick={() => setSelectedProfessional(professional)}
                      />
                    ))}

                    {filteredProfessionals.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          Nenhum profissional encontrado com "{searchTerm}"
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {selectedProfessional && (
                <div className="text-center mt-4">
                  <Button onClick={() => setStep('datetime')} size="lg">
                    Escolher Data e Hora →
                  </Button>
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