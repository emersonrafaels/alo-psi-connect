import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Star, Clock, DollarSign } from "lucide-react"
import { Link } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"

interface Professional {
  id: number
  display_name: string
  resumo_profissional: string | null
  foto_perfil_url: string | null
  profissao: string | null
  crp_crm: string | null
  preco_consulta: number | null
  tempo_consulta: number | null
  user_email: string
  linkedin: string | null
}

const Professionals = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfessionals()
  }, [])

  const fetchProfessionals = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profissionais')
        .select(`
          id,
          display_name,
          resumo_profissional,
          foto_perfil_url,
          profissao,
          crp_crm,
          preco_consulta,
          tempo_consulta,
          user_email,
          linkedin
        `)
        .eq('ativo', true)
        .order('display_name')

      if (error) throw error

      setProfessionals(data || [])
    } catch (err) {
      console.error('Error fetching professionals:', err)
      setError('Erro ao carregar profissionais')
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

  const formatPrice = (price: number | null) => {
    if (!price) return 'Consultar'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Erro</h1>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchProfessionals} className="mt-4">
              Tentar novamente
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
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Nossos Profissionais
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Conheça nossa equipe de profissionais especializados em saúde mental, 
            prontos para oferecer o melhor atendimento para você.
          </p>
        </section>

        {/* Professionals Grid */}
        <section>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="text-center">
                    <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-6 w-32 mx-auto mb-2" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : professionals.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-muted-foreground mb-4">
                Nenhum profissional encontrado
              </h2>
              <p className="text-muted-foreground">
                No momento não há profissionais cadastrados em nossa plataforma.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {professionals.map((professional) => (
                <Card key={professional.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarImage 
                        src={professional.foto_perfil_url || undefined} 
                        alt={professional.display_name}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {getInitials(professional.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <CardTitle className="text-xl">{professional.display_name}</CardTitle>
                    
                    {professional.profissao && (
                      <CardDescription className="font-medium">
                        {professional.profissao}
                      </CardDescription>
                    )}
                    
                    {professional.crp_crm && (
                      <Badge variant="secondary" className="mt-2">
                        {professional.crp_crm}
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {professional.resumo_profissional && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {professional.resumo_profissional}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      {professional.preco_consulta && (
                        <div className="flex items-center gap-1 text-primary">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold">
                            {formatPrice(professional.preco_consulta)}
                          </span>
                        </div>
                      )}
                      
                      {professional.tempo_consulta && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{professional.tempo_consulta}min</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        asChild 
                        className="flex-1"
                      >
                        <Link to={`/profissional/${professional.id}`}>
                          Ver Perfil
                        </Link>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        asChild 
                        className="flex-1"
                      >
                        <Link to="/agendar">
                          Agendar
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Professionals