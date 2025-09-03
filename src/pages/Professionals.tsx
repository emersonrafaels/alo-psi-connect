import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { MapPin, Star, Clock, DollarSign, Search, ChevronLeft, ChevronRight } from "lucide-react"
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
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const professionalsPerPage = 9

  useEffect(() => {
    fetchProfessionals()
  }, [])

  useEffect(() => {
    filterProfessionals()
  }, [professionals, searchTerm])

  const filterProfessionals = () => {
    if (!searchTerm) {
      setFilteredProfessionals(professionals)
    } else {
      const filtered = professionals.filter(prof => 
        prof.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.profissao?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProfessionals(filtered)
    }
    setCurrentPage(1) // Reset to first page when filtering
  }

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

  const capitalizeText = (text: string | null) => {
    if (!text) return ''
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
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

  // Pagination logic
  const indexOfLastProfessional = currentPage * professionalsPerPage
  const indexOfFirstProfessional = indexOfLastProfessional - professionalsPerPage
  const currentProfessionals = filteredProfessionals.slice(indexOfFirstProfessional, indexOfLastProfessional)
  const totalPages = Math.ceil(filteredProfessionals.length / professionalsPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
        <section className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Nossos Profissionais
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Conheça nossa equipe de profissionais especializados em saúde mental, 
            prontos para oferecer o melhor atendimento para você.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por nome ou profissão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </section>

        {/* Results Summary */}
        {!loading && (
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-muted-foreground">
              {filteredProfessionals.length} profissional{filteredProfessionals.length !== 1 ? 'is' : ''} encontrado{filteredProfessionals.length !== 1 ? 's' : ''}
            </p>
            {totalPages > 1 && (
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
            )}
          </div>
        )}

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
          ) : filteredProfessionals.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-muted-foreground mb-4">
                {searchTerm ? 'Nenhum profissional encontrado' : 'Nenhum profissional cadastrado'}
              </h2>
              <p className="text-muted-foreground">
                {searchTerm ? 'Tente ajustar os termos da busca.' : 'No momento não há profissionais cadastrados em nossa plataforma.'}
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm('')}
                  className="mt-4"
                >
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentProfessionals.map((professional) => (
                <Card key={professional.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center pb-4">
                    <Avatar className="w-16 h-16 mx-auto mb-3">
                      <AvatarImage 
                        src={professional.foto_perfil_url || undefined} 
                        alt={professional.display_name}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(professional.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <CardTitle className="text-lg leading-tight">{professional.display_name}</CardTitle>
                    
                    {professional.profissao && (
                      <CardDescription className="font-medium text-primary">
                        {capitalizeText(professional.profissao)}
                      </CardDescription>
                    )}
                    
                    <div className="flex justify-center">
                      {professional.crp_crm && (
                        <Badge variant="secondary" className="text-xs">
                          {professional.crp_crm}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">
                            {formatPrice(professional.preco_consulta)}
                          </span>
                        </div>
                        
                        {professional.tempo_consulta && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{professional.tempo_consulta}min</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          asChild 
                          className="h-9"
                        >
                          <Link to={`/profissional/${professional.id}`}>
                            Ver Perfil
                          </Link>
                        </Button>
                        
                        <Button 
                          size="sm"
                          asChild 
                          className="h-9"
                        >
                          <Link to="/agendar">
                            Agendar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-9 w-9 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(page)}
                    className="h-9 w-9 p-0"
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-9 w-9 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>
      </main>

      <Footer />
    </div>
  )
}

export default Professionals