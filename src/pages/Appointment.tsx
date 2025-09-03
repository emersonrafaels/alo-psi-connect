import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { CalendarWidget } from "@/components/CalendarWidget"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, DollarSign, Clock, MapPin, Star } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Professional {
  id: number
  display_name: string
  profissao: string | null
  resumo_profissional: string | null
  foto_perfil_url: string | null
  preco_consulta: number | null
  tempo_consulta: number | null
  crp_crm: string | null
  servicos_raw: string | null
  user_id: string | number
}

interface Session {
  id: number
  day: string
  start_time: string
  end_time: string
  time_slot: number
}

const Appointment = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const professionalId = searchParams.get('professionalId')

  useEffect(() => {
    if (!professionalId) {
      toast({
        title: "Erro",
        description: "ID do profissional não encontrado",
        variant: "destructive"
      })
      navigate('/profissionais')
      return
    }

    fetchProfessionalData()
  }, [professionalId, navigate, toast])

  const fetchProfessionalData = async () => {
    if (!professionalId) return

    try {
      setLoading(true)

      // Buscar dados do profissional
      const { data: professionalData, error: profError } = await supabase
        .from('profissionais')
        .select(`
          id,
          display_name,
          profissao,
          resumo_profissional,
          foto_perfil_url,
          preco_consulta,
          tempo_consulta,
          crp_crm,
          servicos_raw,
          user_id
        `)
        .eq('id', parseInt(professionalId))
        .eq('ativo', true)
        .single()

      if (profError) throw profError

      // Buscar sessões do profissional
      const { data: sessionsData, error: sessError } = await supabase
        .from('profissionais_sessoes')
        .select('id, day, start_time, end_time, time_slot')
        .eq('user_id', professionalData.user_id)

      if (sessError) throw sessError

      setProfessional(professionalData as Professional)
      setSessions(sessionsData || [])
    } catch (error) {
      console.error('Erro ao buscar dados do profissional:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do profissional",
        variant: "destructive"
      })
      navigate('/profissionais')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      'hsl(var(--avatar-bg-1))',
      'hsl(var(--avatar-bg-2))',
      'hsl(var(--avatar-bg-3))',
      'hsl(var(--avatar-bg-4))',
      'hsl(var(--avatar-bg-5))'
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const parseSpecialties = (servicos: string | null) => {
    if (!servicos) return []
    
    try {
      return JSON.parse(servicos)
    } catch {
      return servicos
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => s.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()))
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price || price === 0) return 'Consultar'
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
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Professional Info Skeleton */}
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-32 w-full" />
              </div>
              {/* Calendar Skeleton */}
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-80 w-full" />
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Profissional não encontrado</h1>
            <p className="text-muted-foreground mb-8">
              O profissional que você está procurando não foi encontrado ou não está mais disponível.
            </p>
            <Button onClick={() => navigate('/profissionais')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Profissionais
            </Button>
          </div>
        </section>
      </div>
    )
  }

  const specialties = parseSpecialties(professional.servicos_raw)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Breadcrumb */}
      <section className="bg-muted py-4">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profissionais')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Profissionais
          </Button>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Professional Information */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Agendar Consulta</h1>
                <p className="text-muted-foreground">
                  Selecione uma data e horário disponível para sua consulta
                </p>
              </div>

              {/* Professional Card */}
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar 
                      className="h-20 w-20 shadow-md"
                      style={{ backgroundColor: getAvatarColor(professional.display_name) }}
                    >
                      <AvatarImage src={professional.foto_perfil_url || undefined} alt={professional.display_name} />
                      <AvatarFallback className="text-white font-bold text-lg">
                        {getInitials(professional.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{professional.display_name}</CardTitle>
                      <CardDescription className="text-base mb-2">
                        {professional.profissao} - {professional.crp_crm}
                      </CardDescription>
                      
                      {/* Price and Duration */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-primary">
                            {formatPrice(professional.preco_consulta)}
                          </span>
                        </div>
                        {professional.tempo_consulta && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span>{professional.tempo_consulta} min</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span>5.0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                {professional.resumo_profissional && (
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {professional.resumo_profissional}
                    </p>
                    
                    {/* Specialties */}
                    {specialties.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Especialidades:</h4>
                        <div className="flex flex-wrap gap-2">
                          {specialties.map((specialty, index) => (
                            <Badge key={index} variant="secondary">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Calendar Widget */}
            <div className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Selecione Data e Horário</CardTitle>
                  <CardDescription>
                    Escolha o melhor dia e horário para sua consulta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CalendarWidget
                    sessions={sessions}
                    professionalId={professional.id.toString()}
                    professionalName={professional.display_name}
                    price={professional.preco_consulta?.toString()}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Appointment