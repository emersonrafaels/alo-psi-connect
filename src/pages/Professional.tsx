import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, MapPin, ArrowLeft, Star, DollarSign } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { CalendarWidget } from "@/components/CalendarWidget"

interface Professional {
  id: number
  display_name: string
  profissao: string
  crp_crm: string
  resumo: string
  resumo_profissional: string
  foto_perfil_url: string
  preco_consulta: number
  servicos_raw: string
  formacao_raw: string
  telefone: string
  user_email: string
  profile_id: string
}

interface Session {
  id: number
  day: string
  start_time: string
  end_time: string
  time_slot: number
}

const Professional = () => {
  const { id } = useParams()
  const { toast } = useToast()
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchProfessional()
      fetchSessions()
    }
  }, [id])

  const fetchProfessional = async () => {
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select('*')
        .eq('id', parseInt(id))
        .eq('ativo', true)
        .single()

      if (error) throw error
      setProfessional(data)
    } catch (error) {
      console.error('Error fetching professional:', error)
      toast({
        title: "Erro",
        description: "Profissional não encontrado.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('vw_profissionais_sessoes')
        .select('*')
        .eq('user_id', parseInt(id))

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
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
      'bg-gradient-to-br from-primary to-primary/80',
      'bg-gradient-to-br from-teal to-teal/80',
      'bg-gradient-to-br from-accent to-accent/80',
      'bg-gradient-to-br from-secondary to-secondary/80'
    ]
    const index = name.length % colors.length
    return colors[index]
  }

  const parseSpecialties = (raw: string): string[] => {
    if (!raw) return []
    try {
      // Try to parse as JSON first (updated specialties)
      return JSON.parse(raw)
    } catch {
      // Fallback for PHP serialized data with proper capitalize
      return raw.split(',').map(s => s.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase())).filter(Boolean)
    }
  }

  const formatPrice = (price: number) => {
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
        <div className="container mx-auto px-4 py-12">
          <div className="skeleton-modern h-96 rounded-lg"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Profissional não encontrado</h1>
            <Button asChild>
              <Link to="/profissionais">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar aos Profissionais
              </Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const specialties = parseSpecialties(professional.servicos_raw)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-teal/10 py-16">
        <div className="absolute inset-0 bg-gradient-subtle opacity-50"></div>
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/profissionais" className="hover:text-primary transition-colors">
              Profissionais
            </Link>
            <span>›</span>
            <span className="text-foreground">Perfil</span>
          </div>
          
          <div className="flex flex-col md:flex-row items-start gap-8">
            <Avatar className={`h-24 w-24 ${getAvatarColor(professional.display_name)} shadow-elegant`}>
              <AvatarImage src={professional.foto_perfil_url} alt={professional.display_name} />
              <AvatarFallback className="text-white text-xl font-bold">
                {getInitials(professional.display_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">
                {professional.display_name}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                {professional.profissao} • {professional.crp_crm}
              </p>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">5.0</span>
                  <span className="text-sm text-muted-foreground">(48 avaliações)</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(professional.preco_consulta)}
                  </span>
                </div>
              </div>
              <Button size="lg" className="btn-gradient shadow-lg" asChild>
                <Link to={`/confirmacao-agendamento?professionalId=${professional.id}&professionalName=${professional.display_name}&price=${professional.preco_consulta}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Consulta
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95">
              <CardHeader>
                <CardTitle className="text-2xl">Sobre o Profissional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  {professional.resumo && (
                    <p>{professional.resumo}</p>
                  )}
                  {professional.resumo_profissional && (
                    <p>{professional.resumo_profissional}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Professional Documents */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95">
              <CardHeader>
                <CardTitle className="text-2xl">Espaço do Profissional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline" size="sm" className="filter-badge">
                    📄 Curriculum
                  </Button>
                  <Button variant="outline" size="sm" className="filter-badge">
                    📄 Artigos e Publicações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Calendar */}
            <Card className="shadow-elegant border-0 bg-gradient-to-br from-card via-card to-card/95">
              <CardHeader className="bg-gradient-primary text-white rounded-t-lg">
                <CardTitle className="text-center flex items-center justify-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Agenda Disponível
                </CardTitle>
                <p className="text-center text-sm opacity-90">
                  Selecione um horário disponível
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <CalendarWidget 
                  sessions={sessions}
                  professionalId={professional.id.toString()}
                  professionalName={professional.display_name}
                  price={professional.preco_consulta?.toString()}
                />
              </CardContent>
            </Card>

            {/* Specialties */}
            <Card className="shadow-elegant border-0 bg-gradient-to-br from-card via-card to-card/95">
              <CardHeader className="bg-gradient-primary text-white rounded-t-lg">
                <CardTitle>Especializações</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2">
                  {specialties.length > 0 ? (
                    specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="filter-badge">
                        {specialty}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Especializações não informadas
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="shadow-elegant border-0 bg-gradient-to-br from-card via-card to-card/95">
              <CardHeader className="bg-gradient-primary text-white rounded-t-lg">
                <CardTitle>Contato</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Online/Presencial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">50 minutos por sessão</span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Professional