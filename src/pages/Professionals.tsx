import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  MapPin, 
  Star, 
  Clock, 
  DollarSign, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  X, 
  Calendar, 
  ChevronDown, 
  Settings, 
  Bot, 
  Sparkles 
} from "lucide-react"
import { Link } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import SpecialtiesUpdater from "@/components/SpecialtiesUpdater"
import { AIAssistantModal } from "@/components/AIAssistantModal"

interface ProfessionalSession {
  day: string
  start_time: string
  end_time: string
}

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
  servicos_raw: string | null
  sessions: ProfessionalSession[]
}

const Professionals = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [showSpecialtiesUpdater, setShowSpecialtiesUpdater] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [filters, setFilters] = useState({
    profissoes: [] as string[],
    dias: [] as string[],
    valorMin: "",
    valorMax: "",
    horarioInicio: "",
    horarioFim: "",
    servico: ""
  })
  const professionalsPerPage = 9

  useEffect(() => {
    fetchProfessionals()
  }, [])

  useEffect(() => {
    filterProfessionals()
  }, [professionals, searchTerm, filters])

  const filterProfessionals = () => {
    let filtered = professionals

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(prof => 
        prof.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.profissao?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Profession filter (multiselect)
    if (filters.profissoes.length > 0) {
      filtered = filtered.filter(prof => 
        prof.profissao && filters.profissoes.includes(prof.profissao.toLowerCase())
      )
    }

    // Day filter (multiselect)
    if (filters.dias.length > 0) {
      filtered = filtered.filter(prof => 
        prof.sessions.some(session => {
          const sessionDay = session.day.toLowerCase()
          return filters.dias.some(filterDay => 
            sessionDay === filterDay || 
            sessionDay === filterDay.toLowerCase() ||
            sessionDay.includes(filterDay.slice(0, 3)) || // Match first 3 letters (mon, tue, etc.)
            filterDay.includes(sessionDay.slice(0, 3))
          )
        })
      )
    }

    // Time range filter
    if (filters.horarioInicio || filters.horarioFim) {
      filtered = filtered.filter(prof => {
        return prof.sessions.some(session => {
          const sessionStart = session.start_time
          const sessionEnd = session.end_time
          
          let matchesTimeRange = true
          
          if (filters.horarioInicio) {
            matchesTimeRange = matchesTimeRange && sessionStart >= filters.horarioInicio
          }
          
          if (filters.horarioFim) {
            matchesTimeRange = matchesTimeRange && sessionEnd <= filters.horarioFim
          }
          
          return matchesTimeRange
        })
      })
    }

    // Price range filter
    if (filters.valorMin) {
      const minPrice = parseFloat(filters.valorMin)
      filtered = filtered.filter(prof => 
        prof.preco_consulta && prof.preco_consulta >= minPrice
      )
    }
    if (filters.valorMax) {
      const maxPrice = parseFloat(filters.valorMax)
      filtered = filtered.filter(prof => 
        prof.preco_consulta && prof.preco_consulta <= maxPrice
      )
    }

    // Service filter
    if (filters.servico) {
      filtered = filtered.filter(prof => 
        prof.servicos_raw?.toLowerCase().includes(filters.servico.toLowerCase())
      )
    }

    setFilteredProfessionals(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }

  const fetchProfessionals = async () => {
    try {
      setLoading(true)
      
      // Fetch professionals
      const { data: professionalsData, error: profError } = await supabase
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
          linkedin,
          servicos_raw,
          user_id
        `)
        .eq('ativo', true)
        .order('display_name')

      if (profError) throw profError

      // Fetch sessions for all professionals
      const { data: sessionsData, error: sessError } = await supabase
        .from('profissionais_sessoes')
        .select('user_id, day, start_time, end_time')

      if (sessError) throw sessError

      // Combine data
      const professionalsWithSessions = (professionalsData || []).map(prof => ({
        ...prof,
        sessions: (sessionsData || [])
          .filter(session => session.user_id === prof.user_id)
          .map(session => ({
            day: session.day,
            start_time: session.start_time,
            end_time: session.end_time
          }))
      }))

      setProfessionals(professionalsWithSessions)
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

  const formatSchedule = (sessions: ProfessionalSession[]) => {
    if (!sessions.length) return []
    
    const dayMap: { [key: string]: string } = {
      'monday': 'Seg',
      'tuesday': 'Ter', 
      'wednesday': 'Qua',
      'thursday': 'Qui',
      'friday': 'Sex',
      'saturday': 'Sáb',
      'sunday': 'Dom',
      // Abreviações em inglês
      'mon': 'Seg',
      'tue': 'Ter',
      'wed': 'Qua',
      'thu': 'Qui',
      'fri': 'Sex',
      'sat': 'Sáb',
      'sun': 'Dom'
    }
    
    // Group sessions by day and format times
    const groupedSessions = sessions.reduce((acc, session) => {
      const day = dayMap[session.day] || session.day
      const start = session.start_time.slice(0, 5)
      const end = session.end_time.slice(0, 5)
      const timeRange = `${start}-${end}`
      
      if (!acc[day]) {
        acc[day] = []
      }
      acc[day].push({ time: timeRange, originalDay: session.day })
      
      return acc
    }, {} as { [key: string]: { time: string, originalDay: string }[] })
    
    // Sort days in logical order
    const dayOrder = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
    const sortedDays = Object.keys(groupedSessions).sort((a, b) => {
      return dayOrder.indexOf(a) - dayOrder.indexOf(b)
    })
    
    return sortedDays.map(day => ({
      day,
      times: [...new Set(groupedSessions[day].map(t => t.time))],
      originalDay: groupedSessions[day][0].originalDay
    }))
  }

  const formatSpecialties = (servicos: string | null) => {
    if (!servicos) return []
    
    return servicos
      .split(',')
      .map(servico => servico.trim())
      .filter(servico => servico.length > 0)
      .map(servico => {
        // Proper capitalize: first letter uppercase, rest lowercase, then capitalize each word
        return servico.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
      })
  }

  const handleTimeSlotClick = (professional: Professional, day: string, time: string) => {
    // Redirect to booking confirmation page with professional and time slot info
    const searchParams = new URLSearchParams({
      professionalId: professional.id.toString(),
      professionalName: professional.display_name,
      day,
      time,
      price: professional.preco_consulta?.toString() || '0'
    })
    window.location.href = `/agendamento?${searchParams.toString()}`
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

  const getUniqueValues = (field: 'profissao' | 'crp_crm' | 'servicos_raw') => {
    return [...new Set(professionals
      .map(prof => prof[field])
      .filter(Boolean)
      .filter((val): val is string => typeof val === 'string')
      .map(val => val.toLowerCase())
    )]
  }

  const clearFilters = () => {
    setFilters({
      profissoes: [],
      dias: [],
      valorMin: "",
      valorMax: "",
      horarioInicio: "",
      horarioFim: "",
      servico: ""
    })
    setSearchTerm("")
  }

  const toggleProfession = (profession: string) => {
    setFilters(prev => ({
      ...prev,
      profissoes: prev.profissoes.includes(profession)
        ? prev.profissoes.filter(p => p !== profession)
        : [...prev.profissoes, profession]
    }))
  }

  const toggleDay = (day: string) => {
    setFilters(prev => ({
      ...prev,
      dias: prev.dias.includes(day)
        ? prev.dias.filter(d => d !== day)
        : [...prev.dias, day]
    }))
  }

  const getDayLabel = (day: string) => {
    const dayMap: { [key: string]: string } = {
      'monday': 'Segunda-feira',
      'tuesday': 'Terça-feira', 
      'wednesday': 'Quarta-feira',
      'thursday': 'Quinta-feira',
      'friday': 'Sexta-feira',
      'saturday': 'Sábado',
      'sunday': 'Domingo'
    }
    return dayMap[day] || day
  }

  const getDayAbbrev = (day: string) => {
    const dayMap: { [key: string]: string } = {
      'monday': 'Seg',
      'tuesday': 'Ter', 
      'wednesday': 'Qua',
      'thursday': 'Qui',
      'friday': 'Sex',
      'saturday': 'Sáb',
      'sunday': 'Dom'
    }
    return dayMap[day] || day
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.profissoes.length > 0) count++
    if (filters.dias.length > 0) count++
    if (filters.horarioInicio || filters.horarioFim) count++
    if (filters.valorMin || filters.valorMax) count++
    if (filters.servico) count++
    return count
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
        <section className="text-center mb-12">
          <div className="relative">
            <h1 className="text-5xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary via-teal to-accent bg-clip-text text-transparent">
              Nossos Profissionais
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Conheça nossa equipe de profissionais especializados em saúde mental, 
              prontos para oferecer o melhor atendimento para você.
            </p>
          </div>
          
          {/* Search and Filters */}
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative search-modern">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
                <Input
                  type="text"
                  placeholder="Buscar por nome ou profissão..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-3 text-lg border-2 focus:border-primary/50 bg-background/80 backdrop-blur-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-6 py-3 relative"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {getActiveFiltersCount() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </Button>
                <Button
                  variant="default"
                  onClick={() => setShowAIAssistant(true)}
                  className="flex items-center gap-2 btn-gradient shadow-lg"
                >
                  <Bot className="h-4 w-4" />
                  <Sparkles className="h-3 w-3" />
                  Assistente IA
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSpecialtiesUpdater(!showSpecialtiesUpdater)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Atualizar IA
                </Button>
                {getActiveFiltersCount() > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Active Filters Summary */}
            {getActiveFiltersCount() > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {filters.profissoes.length > 0 && (
                  <div className="filter-badge">
                    <span>{filters.profissoes.length} profissão{filters.profissoes.length > 1 ? 'ões' : ''}</span>
                  </div>
                )}
                {filters.dias.length > 0 && (
                  <div className="filter-badge">
                    <Calendar className="h-3 w-3" />
                    <span>{filters.dias.map(getDayAbbrev).join(', ')}</span>
                  </div>
                )}
                {(filters.horarioInicio || filters.horarioFim) && (
                  <div className="filter-badge">
                    <Clock className="h-3 w-3" />
                    <span>{filters.horarioInicio || '00:00'} - {filters.horarioFim || '23:59'}</span>
                  </div>
                )}
                {(filters.valorMin || filters.valorMax) && (
                  <div className="filter-badge">
                    <DollarSign className="h-3 w-3" />
                    <span>R$ {filters.valorMin || '0'} - {filters.valorMax || '∞'}</span>
                  </div>
                )}
              </div>
            )}

            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-gradient-to-br from-card via-muted/30 to-card rounded-xl p-8 shadow-lg border border-border/50 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary" />
                    Filtros Avançados
                  </h3>
                  <Button variant="outline" size="sm" onClick={clearFilters} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50">
                    <X className="h-4 w-4 mr-2" />
                    Limpar Todos
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Profession Multiselect */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold mb-2 block text-foreground flex items-center gap-2">
                      <Badge variant="secondary" className="h-4 w-4 rounded-full p-0"></Badge>
                      Profissões
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-11 border-2 hover:border-primary/50 transition-all">
                          {filters.profissoes.length > 0 
                            ? `${filters.profissoes.length} selecionada${filters.profissoes.length > 1 ? 's' : ''}`
                            : "Todas as profissões"
                          }
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-3 border-2">
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {getUniqueValues('profissao').map(prof => (
                            <div key={prof} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                              <Checkbox
                                id={`prof-${prof}`}
                                checked={filters.profissoes.includes(prof as string)}
                                onCheckedChange={() => toggleProfession(prof as string)}
                                className="border-2"
                              />
                              <label
                                htmlFor={`prof-${prof}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {capitalizeText(prof as string)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Days Multiselect */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold mb-2 block text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-teal" />
                      Dias da Semana
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-11 border-2 hover:border-teal/50 transition-all">
                          {filters.dias.length > 0 
                            ? `${filters.dias.length} dia${filters.dias.length > 1 ? 's' : ''}`
                            : "Todos os dias"
                          }
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-3 border-2">
                        <div className="space-y-3">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                            <div key={day} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                              <Checkbox
                                id={`day-${day}`}
                                checked={filters.dias.includes(day)}
                                onCheckedChange={() => toggleDay(day)}
                                className="border-2"
                              />
                              <label
                                htmlFor={`day-${day}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {getDayLabel(day)}
                              </label>
                              <span className="text-xs text-muted-foreground font-mono">
                                {getDayAbbrev(day)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                   {/* Time Range Filter */}
                   <div className="space-y-3">
                     <label className="text-sm font-semibold mb-2 block text-foreground flex items-center gap-2">
                       <Clock className="h-4 w-4 text-accent" />
                       Faixa de Horário
                     </label>
                     
                     {/* Quick time presets */}
                     <div className="grid grid-cols-2 gap-2 mb-3">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => setFilters(prev => ({ ...prev, horarioInicio: "08:00", horarioFim: "12:00" }))}
                         className="text-xs h-8 border-dashed hover:border-accent/50 hover:bg-accent/5"
                       >
                         Manhã (8h-12h)
                       </Button>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => setFilters(prev => ({ ...prev, horarioInicio: "13:00", horarioFim: "18:00" }))}
                         className="text-xs h-8 border-dashed hover:border-accent/50 hover:bg-accent/5"
                       >
                         Tarde (13h-18h)
                       </Button>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                       <div className="relative group">
                         <Input
                           type="time"
                           placeholder="00:00"
                           value={filters.horarioInicio}
                           onChange={(e) => setFilters(prev => ({ ...prev, horarioInicio: e.target.value }))}
                           className="h-11 border-2 focus:border-accent/50 transition-all group-hover:border-accent/30 pt-6 pb-2"
                         />
                         <span className="absolute left-3 top-2 text-xs text-muted-foreground font-medium">
                           Horário de Início
                         </span>
                         {filters.horarioInicio && (
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setFilters(prev => ({ ...prev, horarioInicio: "" }))}
                             className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-70 hover:opacity-100"
                           >
                             <X className="h-3 w-3" />
                           </Button>
                         )}
                       </div>
                       
                       <div className="relative group">
                         <Input
                           type="time"
                           placeholder="23:59"
                           value={filters.horarioFim}
                           onChange={(e) => setFilters(prev => ({ ...prev, horarioFim: e.target.value }))}
                           className="h-11 border-2 focus:border-accent/50 transition-all group-hover:border-accent/30 pt-6 pb-2"
                         />
                         <span className="absolute left-3 top-2 text-xs text-muted-foreground font-medium">
                           Horário de Fim
                         </span>
                         {filters.horarioFim && (
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setFilters(prev => ({ ...prev, horarioFim: "" }))}
                             className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-70 hover:opacity-100"
                           >
                             <X className="h-3 w-3" />
                           </Button>
                         )}
                       </div>
                     </div>

                     {/* Range validation feedback */}
                     {filters.horarioInicio && filters.horarioFim && filters.horarioInicio >= filters.horarioFim && (
                       <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
                         <Clock className="h-3 w-3" />
                         <span>O horário de início deve ser anterior ao horário de fim</span>
                       </div>
                     )}
                     
                     {/* Clear time filters */}
                     {(filters.horarioInicio || filters.horarioFim) && (
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => setFilters(prev => ({ ...prev, horarioInicio: "", horarioFim: "" }))}
                         className="w-full text-xs text-muted-foreground hover:text-foreground"
                       >
                         Limpar horários
                       </Button>
                     )}
                   </div>

                  {/* Price Range Filter */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold mb-2 block text-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Faixa de Preço
                    </label>
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <Input
                          type="number"
                          placeholder="0"
                          value={filters.valorMin}
                          onChange={(e) => setFilters(prev => ({ ...prev, valorMin: e.target.value }))}
                          className="h-11 border-2 focus:border-green-500/50 pl-8"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          R$
                        </span>
                        <span className="absolute left-3 top-0 text-xs text-muted-foreground">
                          Mín
                        </span>
                      </div>
                      <div className="flex-1 relative">
                        <Input
                          type="number"
                          placeholder="∞"
                          value={filters.valorMax}
                          onChange={(e) => setFilters(prev => ({ ...prev, valorMax: e.target.value }))}
                          className="h-11 border-2 focus:border-green-500/50 pl-8"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          R$
                        </span>
                        <span className="absolute left-3 top-0 text-xs text-muted-foreground">
                          Máx
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Specialties Updater */}
            {showSpecialtiesUpdater && (
              <div className="mt-6">
                <SpecialtiesUpdater />
              </div>
            )}
          </div>
        </section>

        {/* Results Summary */}
        {!loading && (
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                {filteredProfessionals.length} profissional{filteredProfessionals.length !== 1 ? 'is' : ''} encontrado{filteredProfessionals.length !== 1 ? 's' : ''}
              </p>
              {(filters.profissoes.length > 0 || filters.dias.length > 0 || filters.horarioInicio || filters.horarioFim || filters.valorMin || filters.valorMax) && (
                <p className="text-xs">
                  Filtros ativos: {[
                    filters.profissoes.length > 0 && `Profissões (${filters.profissoes.length})`,
                    filters.dias.length > 0 && `Dias (${filters.dias.length})`,
                    (filters.horarioInicio || filters.horarioFim) && 'Horário',
                    (filters.valorMin || filters.valorMax) && 'Preço'
                  ].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden professional-card border-2">
                  <CardHeader className="p-0 relative">
                    <div className="skeleton-modern h-56 w-full"></div>
                    <div className="absolute top-4 right-4">
                      <div className="skeleton-modern h-8 w-16 rounded-full"></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="skeleton-modern h-16 w-16 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="skeleton-modern h-5 w-3/4"></div>
                        <div className="skeleton-modern h-4 w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="skeleton-modern h-4 w-full"></div>
                      <div className="skeleton-modern h-4 w-4/5"></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="skeleton-modern h-6 w-16 rounded-full"></div>
                      <div className="skeleton-modern h-6 w-12 rounded-full"></div>
                      <div className="skeleton-modern h-6 w-20 rounded-full"></div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <div className="skeleton-modern h-10 flex-1 rounded-lg"></div>
                      <div className="skeleton-modern h-10 flex-1 rounded-lg"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProfessionals.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="mb-8">
                  <Search className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    Nenhum profissional encontrado
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    Não encontramos profissionais que correspondam aos seus critérios. 
                    Que tal tentar ajustar os filtros?
                  </p>
                </div>
                <div className="space-y-3">
                  <Button onClick={clearFilters} className="btn-gradient px-6 py-3 text-base">
                    <X className="h-4 w-4 mr-2" />
                    Limpar todos os filtros
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    ou tente buscar por outros termos
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {currentProfessionals.map((professional) => (
                  <Card key={professional.id} className="professional-card border-2 bg-gradient-to-r from-card via-card/95 to-card/90 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Professional Info Section */}
                        <div className="flex flex-col sm:flex-row gap-4 lg:flex-1">
                          {/* Avatar and Basic Info */}
                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 min-w-0">
                            <div className="relative flex-shrink-0">
                              {professional.foto_perfil_url ? (
                                <img 
                                  src={professional.foto_perfil_url} 
                                  alt={professional.display_name}
                                  className="w-20 h-20 rounded-full object-cover border-4 border-white/50 shadow-lg"
                                />
                              ) : (
                                <div 
                                  className="w-20 h-20 rounded-full avatar-dynamic text-xl font-bold border-4 border-white/50 shadow-lg"
                                  style={{ backgroundColor: getAvatarColor(professional.display_name) }}
                                >
                                  {getInitials(professional.display_name)}
                                </div>
                              )}
                              {professional.preco_consulta && (
                                <Badge className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground shadow-lg font-bold px-2 py-1">
                                  {formatPrice(professional.preco_consulta)}
                                </Badge>
                              )}
                            </div>

                            {/* Name and Profession */}
                            <div className="text-center sm:text-left min-w-0 flex-1">
                              <h3 className="text-xl font-bold text-foreground mb-1 truncate">
                                {professional.display_name}
                              </h3>
                              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-medium">
                                  {capitalizeText(professional.profissao)}
                                </Badge>
                                {professional.crp_crm && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {professional.crp_crm}
                                  </span>
                                )}
                              </div>
                              
                              {professional.resumo_profissional && (
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed max-w-md">
                                  {professional.resumo_profissional}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Specialties */}
                          {professional.servicos_raw && (
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2 flex items-center gap-1">
                                <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                                Especialidades
                              </p>
                              <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                                <div className="flex flex-wrap gap-3 pr-2">
                                  {formatSpecialties(professional.servicos_raw).map((servico, index) => (
                                    <Badge 
                                      key={index} 
                                      variant="secondary" 
                                      className="text-xs bg-gradient-to-r from-accent/10 to-accent/20 text-accent-foreground border border-accent/30 hover:from-accent/20 hover:to-accent/30 transition-all duration-200 px-2 py-1 font-medium"
                                    >
                                      {servico}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Schedule Section */}
                        <div className="lg:min-w-0 lg:flex-shrink-0 lg:w-80">
                          {professional.sessions.length > 0 ? (
                            <div className="bg-gradient-to-br from-teal/5 to-accent/5 rounded-lg border border-teal/10 p-4">
                              <p className="text-xs font-semibold text-teal mb-3 uppercase tracking-wide flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Horários Disponíveis - Clique para Agendar
                              </p>
                              <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-teal/30 scrollbar-track-transparent">
                                <div className="space-y-2 pr-2">
                                  {formatSchedule(professional.sessions).map((schedule, index) => (
                                    <div key={index} className="space-y-1">
                                      <div className="text-xs font-medium text-teal/80 flex items-center gap-1">
                                        <span className="inline-block w-1.5 h-1.5 bg-teal rounded-full"></span>
                                        {schedule.day}
                                      </div>
                                      <div className="flex flex-wrap gap-1 ml-3">
                                        {schedule.times.map((time, timeIndex) => (
                                          <button
                                            key={timeIndex}
                                            onClick={() => handleTimeSlotClick(professional, schedule.originalDay, time)}
                                            className="px-2 py-1 text-xs bg-white/80 hover:bg-teal/20 text-teal border border-teal/30 rounded-md transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer font-medium"
                                          >
                                            {time}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-muted/30 rounded-lg p-4 text-center">
                              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Horários não informados</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex lg:flex-col gap-3 lg:w-32 lg:flex-shrink-0">
                          <Button variant="outline" size="sm" className="flex-1 lg:flex-none border-2 hover:border-primary/50 hover:bg-primary/5" asChild>
                            <Link to={`/profissional/${professional.id}`}>
                              <Star className="h-4 w-4 mr-2" />
                              Ver Perfil
                            </Link>
                          </Button>
                          <Button size="sm" className="flex-1 lg:flex-none btn-gradient shadow-lg" asChild>
                            <Link to={`/schedule?professional=${professional.id}`}>
                              <Calendar className="h-4 w-4 mr-2" />
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
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 p-6 bg-muted/30 rounded-xl border border-border/50">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages} • {filteredProfessionals.length} profissionais
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="border-2 hover:border-primary/50"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber: number
                        
                        if (totalPages <= 5) {
                          pageNumber = i + 1
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i
                        } else {
                          pageNumber = currentPage - 2 + i
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNumber)}
                            className={`w-10 h-10 border-2 ${
                              currentPage === pageNumber 
                                ? "btn-gradient border-primary shadow-lg" 
                                : "hover:border-primary/50"
                            }`}
                          >
                            {pageNumber}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="border-2 hover:border-primary/50"
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
      
      {/* AI Assistant Modal */}
      <AIAssistantModal 
        open={showAIAssistant}
        onOpenChange={setShowAIAssistant}
        professionals={professionals}
      />
    </div>
  )
}

export default Professionals