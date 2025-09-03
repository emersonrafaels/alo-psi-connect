import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, UserCheck, CreditCard, Search, Filter, Star, DollarSign, Clock } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

interface Professional {
  id: number
  display_name: string
  profissao: string
  resumo: string
  foto_perfil_url: string
  preco_consulta: number
  servicos_raw: string
  ativo: boolean
}

const Schedule = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("")

  useEffect(() => {
    fetchProfessionals()
  }, [])

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select('*')
        .eq('ativo', true)
        .limit(20)

      if (error) throw error
      setProfessionals(data || [])
    } catch (error) {
      console.error('Error fetching professionals:', error)
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
      return JSON.parse(raw)
    } catch {
      // Fallback for comma-separated data with proper capitalize
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

  const filteredProfessionals = professionals.filter(prof => {
    const matchesSearch = prof.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prof.profissao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prof.resumo?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const specialties = parseSpecialties(prof.servicos_raw)
    const matchesSpecialty = !selectedSpecialty || 
                            specialties.some(spec => spec.toLowerCase().includes(selectedSpecialty.toLowerCase()))
    
    return matchesSearch && matchesSpecialty
  })

  // Get all unique specialties for filter
  const allSpecialties = Array.from(new Set(
    professionals.flatMap(prof => parseSpecialties(prof.servicos_raw))
  )).filter(Boolean)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-teal/10 py-20">
        <div className="absolute inset-0 bg-gradient-subtle opacity-50"></div>
        <div className="container mx-auto px-4 text-center relative">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">
            Agende Sua Consulta
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Encontre o profissional ideal e agende sua sessão de forma rápida e segura
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar por nome, especialidade ou área..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-6 text-lg border-2 search-modern shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Results */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Specialty Filters */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtrar por especialidade:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedSpecialty === "" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSpecialty("")}
                className="filter-badge"
              >
                Todas
              </Button>
              {allSpecialties.slice(0, 10).map((specialty) => (
                <Button
                  key={specialty}
                  variant={selectedSpecialty === specialty ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSpecialty(specialty)}
                  className="filter-badge"
                >
                  {specialty}
                </Button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-modern h-80 rounded-lg"></div>
              ))
            ) : filteredProfessionals.length > 0 ? (
              filteredProfessionals.map((professional) => {
                const specialties = parseSpecialties(professional.servicos_raw)
                
                return (
                  <Card 
                    key={professional.id} 
                    className="professional-card group hover-scale transition-all duration-300 shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95"
                  >
                    <CardHeader className="text-center">
                      <Avatar className={`h-16 w-16 mx-auto mb-4 ${getAvatarColor(professional.display_name)} shadow-elegant`}>
                        <AvatarImage src={professional.foto_perfil_url} alt={professional.display_name} />
                        <AvatarFallback className="text-white font-bold">
                          {getInitials(professional.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {professional.display_name}
                      </CardTitle>
                      <CardDescription className="font-medium text-teal">
                        {professional.profissao}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Price */}
                      <div className="flex items-center justify-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(professional.preco_consulta)}
                        </span>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center justify-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">5.0</span>
                        <span className="text-xs text-muted-foreground">(15 avaliações)</span>
                      </div>

                      {/* Specialties */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {specialties.slice(0, 3).map((specialty, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs filter-badge">
                              {specialty}
                            </Badge>
                          ))}
                          {specialties.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{specialties.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {professional.resumo && (
                        <p className="text-sm text-muted-foreground text-center line-clamp-2">
                          {professional.resumo}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link to={`/profissional/${professional.id}`}>
                            Ver Perfil
                          </Link>
                        </Button>
                        <Button size="sm" className="flex-1 btn-gradient" asChild>
                          <Link to={`/agendamento?professionalId=${professional.id}`}>
                            <Calendar className="h-3 w-3 mr-1" />
                            Agendar
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Nenhum profissional encontrado com os filtros selecionados.
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm("")
                  setSelectedSpecialty("")
                }}>
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gradient-to-br from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">
            Como Funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center shadow-elegant border-0 bg-gradient-to-br from-card via-card to-card/95">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <UserCheck className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">1. Escolha o Profissional</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Navegue por nossa lista de profissionais qualificados e escolha aquele que melhor atende suas necessidades
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center shadow-elegant border-0 bg-gradient-to-br from-card via-card to-card/95">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">2. Selecione Data e Horário</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Veja a agenda do profissional e escolha o melhor dia e horário para sua consulta
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center shadow-elegant border-0 bg-gradient-to-br from-card via-card to-card/95">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">3. Confirme e Pague</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Preencha seus dados, confirme o agendamento e efetue o pagamento de forma segura
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-teal/90"></div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl font-bold mb-4">Pronto para Começar?</h2>
          <p className="text-xl mb-8 opacity-90">
            Encontre o profissional ideal para você
          </p>
          <Button size="lg" variant="secondary" className="font-semibold shadow-lg btn-accent">
            <Clock className="h-4 w-4 mr-2" />
            Agendar Agora
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Schedule