import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { useTenant } from "@/hooks/useTenant"
import { buildTenantPath } from "@/utils/tenantHelpers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  Sparkles,
  Tag,
  Percent,
  ArrowUpDown,
  UserCheck,
  TrendingDown,
  Zap,
  Moon
} from "lucide-react"
import { Link } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { useSearchFilters } from "@/hooks/useSearchFilters"
import { useAIAssistantConfig } from "@/hooks/useAIAssistantConfig"
import { useAuth } from "@/hooks/useAuth"
import { useProfessionalsWithCoupons } from "@/hooks/useProfessionalsWithCoupons"
import { usePatientInstitutions } from "@/hooks/usePatientInstitutions"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIsMobile } from "@/hooks/use-mobile"
import { Slider } from "@/components/ui/slider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

import { AIAssistantModal } from "@/components/AIAssistantModal"
import { toast } from "@/hooks/use-toast"

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
  servicos_normalizados: string[] | null
  em_destaque: boolean | null
  profiles: {
    genero: string | null
    raca: string | null
    sexualidade: string | null
  } | null
  sessions: ProfessionalSession[]
}

const Professionals = () => {
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const tenantSlug = tenant?.slug || 'alopsi'
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const { getFiltersFromURL, clearFilters: clearURLFilters } = useSearchFilters()
  const { getAIAssistantConfig } = useAIAssistantConfig()
  const isMobile = useIsMobile()
  
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [filters, setFilters] = useState({
    profissoes: [] as string[],
    dias: [] as string[],
    valorMin: "",
    valorMax: "",
    horarioInicio: "",
    horarioFim: "",
    servico: "",
    especialidades: [] as string[],
    servicos: [] as string[],
    nome: "",
    comCupom: false,
    especialidadesNormalizadas: [] as string[],
    genero: [] as string[],
    ordenacao: 'nome' as 'nome' | 'preco_asc' | 'preco_desc' | 'destaque' | 'disponibilidade'
  })
  const [especialidadeSearch, setEspecialidadeSearch] = useState("")
  const professionalsPerPage = 9

  // Auth e instituições
  const { user } = useAuth()
  const { linkedInstitutions, isLoading: institutionsLoading } = usePatientInstitutions()
  
  // Cupons aplicáveis
  const professionalIds = professionals.map(p => p.id)
  const { data: professionalsWithCoupons, isLoading: couponsLoading } = useProfessionalsWithCoupons(
    professionalIds,
    150 // Valor base para validação
  )

  // Configurações do assistente IA
  const { aiConfig } = useAIAssistantConfig()

  // Aplicar filtros da URL ao carregar a página
  useEffect(() => {
    const urlFilters = getFiltersFromURL()
    if (urlFilters.especialidades.length > 0 || urlFilters.servicos.length > 0 || urlFilters.nome) {
      setFilters(prev => ({
        ...prev,
        especialidades: urlFilters.especialidades,
        servicos: urlFilters.servicos,
        nome: urlFilters.nome
      }))
      setSearchTerm(urlFilters.nome)
      if (urlFilters.especialidades.length > 0 || urlFilters.servicos.length > 0 || urlFilters.nome) {
        setShowFilters(true)
      }
    }
  }, [getFiltersFromURL]) // Adicionar dependência

  useEffect(() => {
    if (tenant) {
      fetchProfessionals()
    }
  }, [tenant])

  useEffect(() => {
    filterProfessionals()
  }, [professionals, searchTerm, filters])

  const filterProfessionals = () => {
    let filtered = professionals

    // Search term filter (both from search term and nome filter)
    const nameSearch = searchTerm || filters.nome
    if (nameSearch) {
      filtered = filtered.filter(prof => 
        prof.display_name.toLowerCase().includes(nameSearch.toLowerCase()) ||
        prof.profissao?.toLowerCase().includes(nameSearch.toLowerCase())
      )
      
    }

    // Especialidades filter (from URL) - procurar tanto na profissão quanto nos serviços
    if (filters.especialidades.length > 0) {
      filtered = filtered.filter(prof => {
        const match = filters.especialidades.some(esp => {
          const espLower = esp.toLowerCase()
          // Verificar na profissão
          const profissaoMatch = prof.profissao?.toLowerCase().includes(espLower) || false
          // Verificar nos serviços
          const servicosMatch = prof.servicos_raw?.toLowerCase().includes(espLower) || false
          
          // Mapeamento específico para cada especialidade
          const especialidadeMap: { [key: string]: string[] } = {
            'psicologia': ['psicologo', 'psicologa', 'psicologia'],
            'psicoterapia': ['psicoterapeuta', 'psicoterapia'],
            'psiquiatria': ['psiquiatra', 'psiquiatria']
          }
          
          const variations = especialidadeMap[espLower] || [espLower]
          const variationMatch = variations.some(variation => 
            prof.profissao?.toLowerCase().includes(variation) || 
            prof.servicos_raw?.toLowerCase().includes(variation)
          )
          
          return profissaoMatch || servicosMatch || variationMatch
        })
        return match
      })
    }

    // Serviços filter (from URL)
    if (filters.servicos.length > 0) {
      filtered = filtered.filter(prof => {
        if (!prof.servicos_raw) return false
        const match = filters.servicos.some(serv => 
          prof.servicos_raw?.toLowerCase().includes(serv.toLowerCase())
        )
        return match
      })
    }

    // Profession filter (multiselect)
    if (filters.profissoes.length > 0) {
      filtered = filtered.filter(prof => {
        if (!prof.profissao) return false
        
        // Normalize the profession for comparison using the same logic
        const normalizeText = (text: string) => {
          return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]/g, '')
            .trim()
        }
        
        const standardizeProfession = (text: string) => {
          const normalized = normalizeText(text)
        const professionMap: { [key: string]: string } = {
          'psicologo': 'psicólogo(a)',
          'psicologa': 'psicólogo(a)',
          'psicoterapeuta': 'psicoterapeuta(a)',
          'psiquiatra': 'psiquiatra(a)',
          'terapeuta': 'terapeuta',
          'psicopedagogo': 'psicopedagogo(a)',
          'psicopedagoga': 'psicopedagogo(a)',
          'neurologista': 'neurologista',
          'terapia ocupacional': 'terapeuta ocupacional'
        }
          const result = professionMap[normalized]
          if (result === null) return null
          return result || text.toLowerCase().trim()
        }
        
        const standardizedProfession = standardizeProfession(prof.profissao)
        
        return filters.profissoes.includes(standardizedProfession)
      })
    }

    // Combined Day + Time filter
    const hasDayFilter = filters.dias.length > 0
    const hasTimeFilter = filters.horarioInicio || filters.horarioFim

    if (hasDayFilter || hasTimeFilter) {
      filtered = filtered.filter(prof => {
        return prof.sessions.some(session => {
          // Check DAY (if filter is active)
          let matchesDay = true
          if (hasDayFilter) {
            const sessionDay = session.day.toLowerCase()
            matchesDay = filters.dias.some(filterDay => 
              sessionDay === filterDay || 
              sessionDay === filterDay.toLowerCase() ||
              sessionDay.includes(filterDay.slice(0, 3)) ||
              filterDay.includes(sessionDay.slice(0, 3))
            )
          }
          
          // Check TIME (if filter is active)
          let matchesTime = true
          if (filters.horarioInicio) {
            matchesTime = matchesTime && session.start_time >= filters.horarioInicio
          }
          if (filters.horarioFim) {
            matchesTime = matchesTime && session.end_time <= filters.horarioFim
          }
          
          // Session must satisfy BOTH criteria
          return matchesDay && matchesTime
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

    // Coupon filter
    if (filters.comCupom && professionalsWithCoupons) {
      filtered = filtered.filter(prof => 
        professionalsWithCoupons.has(prof.id)
      )
    }

    // Especialidades normalizadas filter
    if (filters.especialidadesNormalizadas.length > 0) {
      filtered = filtered.filter(prof => {
        const profSpecialties = prof.servicos_normalizados || []
        return filters.especialidadesNormalizadas.some(esp => 
          profSpecialties.includes(esp)
        )
      })
    }

    // Gênero filter
    if (filters.genero.length > 0) {
      filtered = filtered.filter(prof => {
        const profGender = prof.profiles?.genero?.toLowerCase()
        return profGender && filters.genero.includes(profGender)
      })
    }

    // Ordenação
    switch (filters.ordenacao) {
      case 'preco_asc':
        filtered.sort((a, b) => (a.preco_consulta || 999) - (b.preco_consulta || 999))
        break
      case 'preco_desc':
        filtered.sort((a, b) => (b.preco_consulta || 0) - (a.preco_consulta || 0))
        break
      case 'destaque':
        filtered.sort((a, b) => (b.em_destaque ? 1 : 0) - (a.em_destaque ? 1 : 0))
        break
      case 'disponibilidade':
        filtered.sort((a, b) => b.sessions.length - a.sessions.length)
        break
      default:
        filtered.sort((a, b) => a.display_name.localeCompare(b.display_name))
    }

    setFilteredProfessionals(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }

  const fetchProfessionals = async () => {
    if (!tenant) return;
    
    try {
      setLoading(true)
      
      // Fetch professionals with tenant filter
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
          servicos_normalizados,
          em_destaque,
          user_id,
          profile_id,
          professional_tenants!inner(tenant_id),
          profiles!profile_id (
            genero,
            raca,
            sexualidade
          )
        `)
        .eq('ativo', true)
        .eq('professional_tenants.tenant_id', tenant.id)
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
        return servico.toLowerCase().replace(/(^|\s)(\S)/g, (match, space, letter) => space + letter.toUpperCase())
      })
  }

  const handleTimeSlotClick = (professional: Professional, day: string, time: string) => {
    // Navigate to booking confirmation page with professional and time slot info
    const searchParams = new URLSearchParams({
      professionalId: professional.id.toString(),
      professionalName: professional.display_name,
      day,
      time,
      price: professional.preco_consulta?.toString() || '0'
    })
    navigate(`/agendamento?${searchParams.toString()}`)
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

  const getBrazilTimeRange = () => {
    // Get current time in Brazil (America/Sao_Paulo timezone)
    const now = new Date()
    const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    
    const currentHour = brazilTime.getHours()
    const currentMinutes = brazilTime.getMinutes()
    
    // Round up to next 30-minute interval
    let startHour = currentHour
    let startMinutes = currentMinutes < 30 ? 30 : 0
    
    if (currentMinutes >= 30) {
      startHour += 1
    }
    
    // If after 23:30, no more slots today
    if (startHour >= 24) {
      return null
    }
    
    const horarioInicio = `${String(startHour).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}`
    
    return {
      horarioInicio,
      horarioFim: "23:59"
    }
  }

  const getUniqueValues = (field: 'profissao' | 'crp_crm' | 'servicos_raw') => {
    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .normalize('NFD') // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
        .replace(/[^\w\s]/g, '') // Remove special characters
        .trim()
    }

    const standardizeProfession = (text: string) => {
      const normalized = normalizeText(text)
      
      // Specific mappings for common profession variations
      const professionMap: { [key: string]: string } = {
        'psicologo': 'psicólogo(a)',
        'psicologa': 'psicólogo(a)',
        'psicoterapeuta': 'psicoterapeuta(a)',
        'psiquiatra': 'psiquiatra(a)',
        'terapeuta': 'terapeuta',
        'psicopedagogo': 'psicopedagogo(a)',
        'psicopedagoga': 'psicopedagogo(a)',
        'neurologista': 'neurologista',
        'terapia ocupacional': 'terapeuta ocupacional'
      }
      
      return professionMap[normalized] || text.toLowerCase().trim()
    }

    const values = professionals
      .map(prof => prof[field])
      .filter(Boolean)
      .filter((val): val is string => typeof val === 'string')

    // Create a map to group similar professions using both normalization and standardization
    const professionMap = new Map<string, string>()
    
    values.forEach(value => {
      const standardized = standardizeProfession(value)
      const normalized = normalizeText(standardized)
      
      if (!professionMap.has(normalized)) {
        professionMap.set(normalized, standardized)
      }
    })

    return Array.from(professionMap.values()).sort()
  }

  const clearFilters = () => {
    setFilters({
      profissoes: [],
      dias: [],
      valorMin: "",
      valorMax: "",
      horarioInicio: "",
      horarioFim: "",
      servico: "",
      especialidades: [],
      servicos: [],
      nome: "",
      comCupom: false,
      especialidadesNormalizadas: [],
      genero: [],
      ordenacao: 'nome'
    })
    setSearchTerm("")
    clearURLFilters()
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
    if (filters.especialidades.length > 0) count++
    if (filters.servicos.length > 0) count++
    if (filters.nome) count++
    if (filters.comCupom) count++
    if (filters.especialidadesNormalizadas.length > 0) count++
    if (filters.genero.length > 0) count++
    return count
  }

  const toggleEspecialidade = (especialidade: string) => {
    setFilters(prev => ({
      ...prev,
      especialidadesNormalizadas: prev.especialidadesNormalizadas.includes(especialidade)
        ? prev.especialidadesNormalizadas.filter(e => e !== especialidade)
        : [...prev.especialidadesNormalizadas, especialidade]
    }))
  }

  const toggleGenero = (genero: string) => {
    setFilters(prev => ({
      ...prev,
      genero: prev.genero.includes(genero)
        ? prev.genero.filter(g => g !== genero)
        : [...prev.genero, genero]
    }))
  }

  const getAllSpecialties = () => {
    const specialtiesSet = new Set<string>()
    professionals.forEach(prof => {
      if (prof.servicos_normalizados) {
        prof.servicos_normalizados.forEach(s => specialtiesSet.add(s))
      }
    })
    return Array.from(specialtiesSet).sort()
  }

  const categorizeSpecialties = () => {
    const allSpecialties = getAllSpecialties()
    
    // Filter by search term
    const filteredSpecialties = especialidadeSearch 
      ? allSpecialties.filter(s => s.toLowerCase().includes(especialidadeSearch.toLowerCase()))
      : allSpecialties
    
    const categories = {
      'Transtornos': ['Ansiedade', 'Depressão', 'TDAH', 'TOC', 'Bipolaridade', 'Síndrome do Pânico', 'Borderline'],
      'Relacionamentos': ['Terapia de Casal', 'Terapia Familiar', 'Relacionamentos', 'Orientação Parental'],
      'Ciclos de Vida': ['Psicologia Infantil', 'Psicologia do Adolescente', 'Psicologia do Idoso', 'Luto'],
      'Desenvolvimento': ['Autoestima', 'Desenvolvimento Pessoal', 'Estresse', 'Síndrome de Burnout'],
      'Outros': [] as string[]
    }
    
    filteredSpecialties.forEach(spec => {
      let categorized = false
      for (const [category, keywords] of Object.entries(categories)) {
        if (category !== 'Outros' && keywords.some(k => spec.includes(k) || k.includes(spec))) {
          categorized = true
          break
        }
      }
      if (!categorized) {
        categories.Outros.push(spec)
      }
    })
    
    return categories
  }

  const professionalsWithCouponsCount = professionalsWithCoupons?.size || 0

  // Derived data for filters
  const uniqueProfessions = Array.from(new Set(professionals.map(p => p.profissao).filter(Boolean))) as string[]
  const maxPrice = Math.max(...professionals.map(p => p.preco_consulta || 0), 800)

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
            <h1 className="text-5xl font-bold mb-6 text-primary">
              Nossos Profissionais
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Conheça nossa equipe de profissionais especializados em saúde emocional, 
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
                {aiConfig.enabled && (
                  <Button
                    variant="default"
                    onClick={() => setShowAIAssistant(true)}
                    className="flex items-center gap-2 btn-gradient shadow-lg"
                  >
                    <Bot className="h-4 w-4" />
                    <Sparkles className="h-3 w-3" />
                    {aiConfig.title}
                  </Button>
                )}
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
              isMobile ? (
                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl flex flex-col p-0">
                    {/* Header */}
                    <div className="px-6 pt-6 pb-4 border-b shrink-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Filter className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">Filtros Avançados</h3>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearFilters}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Limpar
                        </Button>
                      </div>
                      
                      {/* Active Filters */}
                      {getActiveFiltersCount() > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            {getActiveFiltersCount()} {getActiveFiltersCount() === 1 ? 'filtro ativo' : 'filtros ativos'}
                          </p>
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
                            {filters.profissoes.map(prof => (
                              <Badge key={prof} variant="secondary" className="gap-1 pr-1 text-xs flex-shrink-0">
                                {prof}
                                <button
                                  onClick={() => toggleProfession(prof)}
                                  className="ml-1 hover:bg-background/80 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                            {filters.dias.map(dia => (
                              <Badge key={dia} variant="secondary" className="gap-1 pr-1 text-xs flex-shrink-0">
                                {getDayAbbrev(dia)}
                                <button
                                  onClick={() => toggleDay(dia)}
                                  className="ml-1 hover:bg-background/80 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                            {filters.especialidadesNormalizadas.map(esp => (
                              <Badge key={esp} variant="secondary" className="gap-1 pr-1 text-xs flex-shrink-0">
                                {esp}
                                <button
                                  onClick={() => toggleEspecialidade(esp)}
                                  className="ml-1 hover:bg-background/80 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                            {filters.genero.map(gen => (
                              <Badge key={gen} variant="secondary" className="gap-1 pr-1 text-xs flex-shrink-0">
                                {gen === 'feminino' ? '♀️ Feminino' : gen === 'masculino' ? '♂️ Masculino' : '⚧️ Outro'}
                                <button
                                  onClick={() => toggleGenero(gen)}
                                  className="ml-1 hover:bg-background/80 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                            {(filters.horarioInicio || filters.horarioFim) && (
                              <Badge variant="secondary" className="gap-1 pr-1 text-xs flex-shrink-0">
                                {filters.horarioInicio || '00:00'} - {filters.horarioFim || '23:59'}
                                <button
                                  onClick={() => setFilters(prev => ({ ...prev, horarioInicio: '', horarioFim: '' }))}
                                  className="ml-1 hover:bg-background/80 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            )}
                            {(filters.valorMin || filters.valorMax) && (
                              <Badge variant="secondary" className="gap-1 pr-1 text-xs flex-shrink-0">
                                R$ {filters.valorMin || '0'} - {filters.valorMax || '∞'}
                                <button
                                  onClick={() => setFilters(prev => ({ ...prev, valorMin: '', valorMax: '' }))}
                                  className="ml-1 hover:bg-background/80 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            )}
                            {filters.comCupom && (
                              <Badge variant="secondary" className="gap-1 pr-1 text-xs flex-shrink-0">
                                🏷️ Com Cupom
                                <button
                                  onClick={() => setFilters(prev => ({ ...prev, comCupom: false }))}
                                  className="ml-1 hover:bg-background/80 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="space-y-3 py-3 px-6 pb-6">
                        {/* Quick Presets */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 snap-x snap-mandatory">
                          <Button
                            variant={filters.dias.includes('monday') && filters.dias.includes('tuesday') && 
                                    filters.dias.includes('wednesday') && filters.dias.includes('thursday') && 
                                    filters.dias.includes('friday') ? "default" : "outline"}
                            size="sm"
                            className="shrink-0 snap-center"
                            onClick={() => {
                              const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
                              const allSelected = weekDays.every(d => filters.dias.includes(d))
                              setFilters(prev => ({
                                ...prev,
                                dias: allSelected ? [] : weekDays
                              }))
                            }}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Dias úteis
                          </Button>
                          <Button
                            variant={filters.horarioInicio === '18:00' && filters.horarioFim === '22:00' ? "default" : "outline"}
                            size="sm"
                            className="shrink-0 snap-center"
                            onClick={() => {
                              setFilters(prev => ({
                                ...prev,
                                horarioInicio: prev.horarioInicio === '18:00' ? '' : '18:00',
                                horarioFim: prev.horarioFim === '22:00' ? '' : '22:00'
                              }))
                            }}
                          >
                            <Moon className="h-3 w-3 mr-1" />
                            Noturno
                          </Button>
                          <Button
                            variant={filters.dias.includes('saturday') && filters.dias.includes('sunday') ? "default" : "outline"}
                            size="sm"
                            className="shrink-0 snap-center"
                            onClick={() => {
                              const weekendDays = ['saturday', 'sunday']
                              const allSelected = weekendDays.every(d => filters.dias.includes(d))
                              setFilters(prev => ({
                                ...prev,
                                dias: allSelected 
                                  ? prev.dias.filter(d => !weekendDays.includes(d))
                                  : [...prev.dias, ...weekendDays.filter(d => !prev.dias.includes(d))]
                              }))
                            }}
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Fim de semana
                          </Button>
                          {user && linkedInstitutions && linkedInstitutions.length > 0 && professionalsWithCouponsCount > 0 && (
                            <Button
                              variant={filters.comCupom ? "default" : "outline"}
                              size="sm"
                              className="shrink-0 snap-center"
                              onClick={() => setFilters(prev => ({ ...prev, comCupom: !prev.comCupom }))}
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              Com Cupom
                            </Button>
                          )}
                        </div>

                        {/* Accordion Sections */}
                        <Accordion type="single" collapsible className="w-full">
                          {/* Profissional */}
                          <AccordionItem value="profissional">
                            <AccordionTrigger className="text-sm font-semibold">
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-primary" />
                                Profissional
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2.5 pt-1">
                              {/* Profissão */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium">Profissão</label>
                                <Select
                                  value={filters.profissoes[0] || ''}
                                  onValueChange={(value) => {
                                    setFilters(prev => ({
                                      ...prev,
                                      profissoes: value ? [value] : []
                                    }))
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Todas as profissões" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="todas">Todas</SelectItem>
                                    {uniqueProfessions.map(profession => (
                                      <SelectItem key={profession} value={profession}>
                                        {profession}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Especialidades */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium">Especialidades</label>
                                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                                  {getAllSpecialties().slice(0, 12).map(especialidade => (
                                    <Badge
                                      key={especialidade}
                                      variant={filters.especialidadesNormalizadas.includes(especialidade) ? "default" : "outline"}
                                      className="cursor-pointer hover:bg-primary/90 text-xs h-7"
                                      onClick={() => toggleEspecialidade(especialidade)}
                                    >
                                      {especialidade}
                                    </Badge>
                                  ))}
                                </div>
                                {getAllSpecialties().length > 12 && (
                                  <p className="text-xs text-muted-foreground">
                                    +{getAllSpecialties().length - 12} especialidades disponíveis
                                  </p>
                                )}
                              </div>

                              {/* Gênero */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium">Gênero do profissional</label>
                                <div className="grid grid-cols-3 gap-1.5">
                                  <Button
                                    variant={filters.genero.includes('feminino') ? "default" : "outline"}
                                    size="sm"
                                    className="h-9 text-xs"
                                    onClick={() => toggleGenero('feminino')}
                                  >
                                    ♀️ Feminino
                                  </Button>
                                  <Button
                                    variant={filters.genero.includes('masculino') ? "default" : "outline"}
                                    size="sm"
                                    className="h-9 text-xs"
                                    onClick={() => toggleGenero('masculino')}
                                  >
                                    ♂️ Masculino
                                  </Button>
                                  <Button
                                    variant={filters.genero.includes('outro') ? "default" : "outline"}
                                    size="sm"
                                    className="h-9 text-xs"
                                    onClick={() => toggleGenero('outro')}
                                  >
                                    ⚧️ Outro
                                  </Button>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Disponibilidade */}
                          <AccordionItem value="disponibilidade">
                            <AccordionTrigger className="text-sm font-semibold">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                Disponibilidade
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2.5 pt-1">
                              {/* Dias da semana */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium">Dias da semana</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                    <Button
                                      key={day}
                                      variant={filters.dias.includes(day) ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => toggleDay(day)}
                                      className="h-9 min-w-[60px]"
                                    >
                                      {getDayAbbrev(day)}
                                    </Button>
                                  ))}
                                </div>
                              </div>

                              {/* Período do dia */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium">Período do dia</label>
                                <div className="grid grid-cols-3 gap-2">
                                  <Button
                                    variant={filters.horarioInicio === '06:00' && filters.horarioFim === '12:00' ? "default" : "outline"}
                                    size="sm"
                                    className="h-9 text-xs"
                                    onClick={() => {
                                      const isActive = filters.horarioInicio === '06:00' && filters.horarioFim === '12:00'
                                      setFilters(prev => ({
                                        ...prev,
                                        horarioInicio: isActive ? '' : '06:00',
                                        horarioFim: isActive ? '' : '12:00'
                                      }))
                                    }}
                                  >
                                    Manhã
                                  </Button>
                                  <Button
                                    variant={filters.horarioInicio === '12:00' && filters.horarioFim === '18:00' ? "default" : "outline"}
                                    size="sm"
                                    className="h-9 text-xs"
                                    onClick={() => {
                                      const isActive = filters.horarioInicio === '12:00' && filters.horarioFim === '18:00'
                                      setFilters(prev => ({
                                        ...prev,
                                        horarioInicio: isActive ? '' : '12:00',
                                        horarioFim: isActive ? '' : '18:00'
                                      }))
                                    }}
                                  >
                                    Tarde
                                  </Button>
                                  <Button
                                    variant={filters.horarioInicio === '18:00' && filters.horarioFim === '23:59' ? "default" : "outline"}
                                    size="sm"
                                    className="h-9 text-xs"
                                    onClick={() => {
                                      const isActive = filters.horarioInicio === '18:00' && filters.horarioFim === '23:59'
                                      setFilters(prev => ({
                                        ...prev,
                                        horarioInicio: isActive ? '' : '18:00',
                                        horarioFim: isActive ? '' : '23:59'
                                      }))
                                    }}
                                  >
                                    Noite
                                  </Button>
                                </div>
                              </div>

                              {/* Horário personalizado */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium">Horário personalizado</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-xs text-muted-foreground">Início</label>
                                    <Input
                                      type="time"
                                      value={filters.horarioInicio}
                                      onChange={(e) => setFilters(prev => ({ ...prev, horarioInicio: e.target.value }))}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-muted-foreground">Fim</label>
                                    <Input
                                      type="time"
                                      value={filters.horarioFim}
                                      onChange={(e) => setFilters(prev => ({ ...prev, horarioFim: e.target.value }))}
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Valor */}
                          <AccordionItem value="valor">
                            <AccordionTrigger className="text-sm font-semibold">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-primary" />
                                Valor da Consulta
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2.5 pt-1">
                              <div className="space-y-2.5">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium">R$ {filters.valorMin || '0'}</span>
                                  <span className="font-medium">R$ {filters.valorMax || '800+'}</span>
                                </div>
                                <Slider
                                  min={0}
                                  max={800}
                                  step={10}
                                  value={[
                                    parseInt(filters.valorMin) || 0,
                                    parseInt(filters.valorMax) || 800
                                  ]}
                                  onValueChange={(values) => {
                                    setFilters(prev => ({
                                      ...prev,
                                      valorMin: values[0].toString(),
                                      valorMax: values[1] === 800 ? '' : values[1].toString()
                                    }))
                                  }}
                                  className="mt-2"
                                />
                                <div className="grid grid-cols-2 gap-1.5">
                                  <div>
                                    <label className="text-[10px] text-muted-foreground">Mínimo</label>
                                    <Input
                                      type="number"
                                      placeholder="R$ 0"
                                      value={filters.valorMin}
                                      onChange={(e) => setFilters(prev => ({ ...prev, valorMin: e.target.value }))}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-muted-foreground">Máximo</label>
                                    <Input
                                      type="number"
                                      placeholder="R$ ∞"
                                      value={filters.valorMax}
                                      onChange={(e) => setFilters(prev => ({ ...prev, valorMax: e.target.value }))}
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </ScrollArea>

                    {/* Footer Sticky */}
                    <div className="px-6 py-4 border-t shrink-0 bg-background">
                      <Button 
                        className="w-full h-12 text-base font-semibold" 
                        onClick={() => setShowFilters(false)}
                      >
                        Ver {filteredProfessionals.length} {filteredProfessionals.length === 1 ? 'profissional' : 'profissionais'}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
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
                
                {/* Filtros Principais - Linha 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 animate-fade-in">
                  {/* Profession Multiselect */}
                  <div className="space-y-4 group">
                    <label className="text-sm font-semibold mb-2 block text-foreground flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Badge variant="secondary" className="h-3 w-3 rounded-full p-0 bg-primary"></Badge>
                      </div>
                      Profissões
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-between h-12 border-2 hover:border-primary/50 transition-all duration-200 hover:shadow-sm bg-background/50 backdrop-blur-sm"
                        >
                          <span className="font-medium">
                            {filters.profissoes.length > 0 
                              ? `${filters.profissoes.length} selecionada${filters.profissoes.length > 1 ? 's' : ''}`
                              : "Todas as profissões"
                            }
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50 transition-transform group-hover:rotate-180" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4 border-2 shadow-lg bg-background/95 backdrop-blur-sm">
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                          {getUniqueValues('profissao').map(prof => (
                            <div key={prof} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/70 transition-all duration-200 hover:scale-[1.02] cursor-pointer">
                              <Checkbox
                                id={`prof-${prof}`}
                                checked={filters.profissoes.includes(prof as string)}
                                onCheckedChange={() => toggleProfession(prof as string)}
                                className="border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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
                  <div className="space-y-4 group">
                    <label className="text-sm font-semibold mb-2 block text-foreground flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors">
                        <Calendar className="h-3 w-3 text-teal-600" />
                      </div>
                      Dias da Semana
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-between h-12 border-2 hover:border-teal-500/50 transition-all duration-200 hover:shadow-sm bg-background/50 backdrop-blur-sm"
                        >
                          <span className="font-medium">
                            {filters.dias.length > 0 
                              ? `${filters.dias.length} dia${filters.dias.length > 1 ? 's' : ''}`
                              : "Todos os dias"
                            }
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50 transition-transform group-hover:rotate-180" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4 border-2 shadow-lg bg-background/95 backdrop-blur-sm">
                        <div className="space-y-2">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                            <div key={day} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/70 transition-all duration-200 hover:scale-[1.02] cursor-pointer">
                              <Checkbox
                                id={`day-${day}`}
                                checked={filters.dias.includes(day)}
                                onCheckedChange={() => toggleDay(day)}
                                className="border-2 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                              />
                              <label
                                htmlFor={`day-${day}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {getDayLabel(day)}
                              </label>
                              <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                                {getDayAbbrev(day)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Separador Visual */}
                <div className="my-6 border-t border-border/50"></div>

                {/* Quick Filter Presets */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                  {/* Disponíveis agora */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()]
                      const timeRange = getBrazilTimeRange()
                      
                      if (timeRange) {
                        setFilters(prev => ({
                          ...prev,
                          dias: [today],
                          horarioInicio: timeRange.horarioInicio,
                          horarioFim: timeRange.horarioFim
                        }))
                        toast({
                          title: "Filtro aplicado",
                          description: `Filtrando a partir de ${timeRange.horarioInicio}`,
                        })
                      } else {
                        const tomorrow = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][(new Date().getDay() + 1) % 7]
                        setFilters(prev => ({
                          ...prev,
                          dias: [tomorrow],
                          horarioInicio: "08:00",
                          horarioFim: "23:59"
                        }))
                        toast({
                          title: "Não há mais horários hoje",
                          description: "Mostrando profissionais disponíveis amanhã.",
                        })
                      }
                    }}
                    className="whitespace-nowrap border-2 hover:border-teal-500 hover:bg-teal-500/15 hover:text-teal-700 dark:hover:text-teal-400 transition-all"
                  >
          <Zap className="h-4 w-4 mr-1.5" />
          Disponíveis hoje
        </Button>

                  {/* Horário noturno */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        horarioInicio: "18:00",
                        horarioFim: "23:59"
                      }))
                    }}
                    className="whitespace-nowrap border-2 hover:border-indigo-500 hover:bg-indigo-500/15 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all"
                  >
                    <Moon className="h-4 w-4 mr-1.5" />
                    Horário noturno
                  </Button>

                  {/* Fim de semana */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        dias: ['saturday', 'sunday']
                      }))
                    }}
                    className="whitespace-nowrap border-2 hover:border-orange-500 hover:bg-orange-500/15 hover:text-orange-700 dark:hover:text-orange-400 transition-all"
                  >
                    <Calendar className="h-4 w-4 mr-1.5" />
                    Fim de semana
                  </Button>

        {/* Cupom aplicável */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFilters(prev => ({
              ...prev,
              comCupom: true
            }))
          }}
          className="whitespace-nowrap border-2 hover:border-emerald-500 hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all"
        >
          <Tag className="h-4 w-4 mr-1.5" />
          Cupom aplicável
        </Button>

        </div>

                {/* Thematic Filter Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  {/* Card: Profissional */}
                  <Card className="p-5 border-2 border-border/50 hover:border-primary/30 transition-all duration-300">
                    <CardHeader className="p-0 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                          <UserCheck className="h-4 w-4 text-primary" />
                        </div>
                        <h4 className="font-semibold text-base">Profissional</h4>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                      {/* Especialidades */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Especialidades</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="w-full justify-between h-10 border-2 hover:border-primary/50 transition-all bg-background"
                            >
                              <span className="text-sm">
                                {filters.especialidadesNormalizadas.length > 0 
                                  ? `${filters.especialidadesNormalizadas.length} selecionada${filters.especialidadesNormalizadas.length > 1 ? 's' : ''}`
                                  : "Todas especialidades"
                                }
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-96 p-4 border-2 bg-background">
                            <div className="space-y-4">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Buscar especialidade..."
                                  value={especialidadeSearch}
                                  onChange={(e) => setEspecialidadeSearch(e.target.value)}
                                  className="pl-10 border-2 focus:border-primary/50"
                                />
                              </div>
                              <ScrollArea className="h-72">
                                <div className="space-y-4">
                                  {Object.entries(categorizeSpecialties()).map(([category, specs]) => 
                                    specs.length > 0 && (
                                      <div key={category} className="space-y-2">
                                        <h4 className="text-xs font-semibold text-muted-foreground px-2">
                                          {category}
                                        </h4>
                                        {specs.map(spec => (
                                          <div key={spec} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/70 transition-all cursor-pointer">
                                            <Checkbox
                                              id={`spec-${spec}`}
                                              checked={filters.especialidadesNormalizadas.includes(spec)}
                                              onCheckedChange={() => toggleEspecialidade(spec)}
                                              className="border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                            <label
                                              htmlFor={`spec-${spec}`}
                                              className="text-sm font-medium leading-none cursor-pointer flex-1"
                                            >
                                              {spec}
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    )
                                  )}
                                </div>
                              </ScrollArea>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Gênero Pills */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Gênero</label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {[
                            { value: 'feminino', label: 'Feminino', emoji: '♀️' },
                            { value: 'masculino', label: 'Masculino', emoji: '♂️' },
                            { value: 'outro', label: 'Outro', emoji: '⚧️' }
                          ].map(({ value, label, emoji }) => (
                            <Badge
                              key={value}
                              variant={filters.genero.includes(value) ? "default" : "outline"}
                              className="cursor-pointer transition-all text-xs px-3 py-1.5 hover:scale-105"
                              onClick={() => toggleGenero(value)}
                            >
                              <span className="mr-1">{emoji}</span>
                              {label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card: Disponibilidade */}
                  <Card className="p-5 border-2 border-border/50 hover:border-teal-500/30 transition-all duration-300">
                    <CardHeader className="p-0 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/10">
                          <Calendar className="h-4 w-4 text-teal-600" />
                        </div>
                        <h4 className="font-semibold text-base">Disponibilidade</h4>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                      {/* Dias da Semana */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Dias da Semana</label>
                        <div className="grid grid-cols-4 gap-2">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                            <Button
                              key={day}
                              variant={filters.dias.includes(day) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleDay(day)}
                              className={`text-xs h-9 transition-all ${
                                filters.dias.includes(day)
                                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                  : 'hover:border-teal-500/50 hover:bg-teal-500/5'
                              }`}
                            >
                              {getDayAbbrev(day)}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Período do Dia - Quick Presets */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Período</label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilters(prev => ({ ...prev, horarioInicio: "08:00", horarioFim: "12:00" }))}
                            className="text-xs h-9 border-2 hover:border-teal-500/50 hover:bg-teal-500/5 transition-all"
                          >
                            🌅 Manhã
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilters(prev => ({ ...prev, horarioInicio: "13:00", horarioFim: "18:00" }))}
                            className="text-xs h-9 border-2 hover:border-teal-500/50 hover:bg-teal-500/5 transition-all"
                          >
                            ☀️ Tarde
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilters(prev => ({ ...prev, horarioInicio: "18:00", horarioFim: "22:00" }))}
                            className="text-xs h-9 border-2 hover:border-teal-500/50 hover:bg-teal-500/5 transition-all"
                          >
                            🌙 Noite
                          </Button>
                        </div>
                      </div>

                      {/* Horário Personalizado */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Ou personalizado</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <Input
                              type="time"
                              value={filters.horarioInicio}
                              onChange={(e) => setFilters(prev => ({ ...prev, horarioInicio: e.target.value }))}
                              className="h-9 text-sm border-2 focus:border-teal-500/50 bg-background"
                            />
                            {filters.horarioInicio && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFilters(prev => ({ ...prev, horarioInicio: "" }))}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <div className="relative">
                            <Input
                              type="time"
                              value={filters.horarioFim}
                              onChange={(e) => setFilters(prev => ({ ...prev, horarioFim: e.target.value }))}
                              className="h-9 text-sm border-2 focus:border-teal-500/50 bg-background"
                            />
                            {filters.horarioFim && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFilters(prev => ({ ...prev, horarioFim: "" }))}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {filters.horarioInicio && filters.horarioFim && filters.horarioInicio >= filters.horarioFim && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Horário de início deve ser anterior ao fim
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Card: Investimento - Full Width */}
                <Card className="p-5 border-2 border-border/50 hover:border-green-500/30 transition-all duration-300 mb-4">
                  <CardHeader className="p-0 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-base">Investimento</h4>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 space-y-5">
                    {/* Price Range Slider */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-medium text-muted-foreground">Faixa de Preço</label>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          <span>R$ {filters.valorMin || 0}</span>
                          <span>-</span>
                          <span>R$ {filters.valorMax || maxPrice}</span>
                        </div>
                      </div>
                      <Slider
                        value={[Number(filters.valorMin) || 0, Number(filters.valorMax) || maxPrice]}
                        onValueChange={(values) => {
                          setFilters(prev => ({
                            ...prev,
                            valorMin: values[0].toString(),
                            valorMax: values[1].toString()
                          }))
                        }}
                        min={0}
                        max={maxPrice}
                        step={25}
                        className="w-full"
                      />
                      <div className="flex justify-center">
                        <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                          {filteredProfessionals.filter(p => {
                            const price = p.preco_consulta || 0
                            const min = Number(filters.valorMin) || 0
                            const max = Number(filters.valorMax) || maxPrice
                            return price >= min && price <= max
                          }).length} profissionais nesta faixa
                        </span>
                      </div>
                    </div>

                    {/* Coupon Toggle */}
                    {user && linkedInstitutions && linkedInstitutions.length > 0 && (
                      <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border bg-background/50 hover:border-emerald-500/50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10">
                            <Tag className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Mostrar apenas com desconto
                            </p>
                            {professionalsWithCouponsCount > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {professionalsWithCouponsCount} profissiona{professionalsWithCouponsCount === 1 ? 'l' : 'is'} com cupom
                              </p>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={filters.comCupom}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, comCupom: checked }))
                          }
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Active Filters Bar */}
                {getActiveFiltersCount() > 0 && (
                  <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border border-border/30 animate-fade-in">
                    <span className="text-xs text-muted-foreground self-center font-medium">Filtros ativos:</span>
                    
                    {filters.profissoes.map(prof => (
                      <Badge 
                        key={prof}
                        variant="secondary" 
                        className="gap-1 cursor-pointer hover:bg-destructive/10 group transition-all"
                        onClick={() => toggleProfession(prof)}
                      >
                        {prof}
                        <X className="h-3 w-3 group-hover:text-destructive transition-colors" />
                      </Badge>
                    ))}

                    {filters.dias.map(day => (
                      <Badge 
                        key={day}
                        variant="secondary" 
                        className="gap-1 cursor-pointer hover:bg-destructive/10 group transition-all"
                        onClick={() => toggleDay(day)}
                      >
                        {getDayAbbrev(day)}
                        <X className="h-3 w-3 group-hover:text-destructive transition-colors" />
                      </Badge>
                    ))}

                    {filters.especialidadesNormalizadas.map(spec => (
                      <Badge 
                        key={spec}
                        variant="secondary" 
                        className="gap-1 cursor-pointer hover:bg-destructive/10 group transition-all"
                        onClick={() => toggleEspecialidade(spec)}
                      >
                        {spec}
                        <X className="h-3 w-3 group-hover:text-destructive transition-colors" />
                      </Badge>
                    ))}

                    {filters.genero.map(genero => (
                      <Badge 
                        key={genero}
                        variant="secondary" 
                        className="gap-1 cursor-pointer hover:bg-destructive/10 group transition-all"
                        onClick={() => toggleGenero(genero)}
                      >
                        {genero === 'feminino' ? '♀️' : genero === 'masculino' ? '♂️' : '⚧️'} {genero}
                        <X className="h-3 w-3 group-hover:text-destructive transition-colors" />
                      </Badge>
                    ))}

                    {(filters.horarioInicio || filters.horarioFim) && (
                      <Badge 
                        variant="secondary" 
                        className="gap-1 cursor-pointer hover:bg-destructive/10 group transition-all"
                        onClick={() => setFilters(prev => ({ ...prev, horarioInicio: "", horarioFim: "" }))}
                      >
                        {filters.horarioInicio && filters.horarioFim 
                          ? `${filters.horarioInicio} - ${filters.horarioFim}`
                          : filters.horarioInicio 
                            ? `A partir de ${filters.horarioInicio}`
                            : `Até ${filters.horarioFim}`
                        }
                        <X className="h-3 w-3 group-hover:text-destructive transition-colors" />
                      </Badge>
                    )}

                    {(filters.valorMin || filters.valorMax) && (
                      <Badge 
                        variant="secondary" 
                        className="gap-1 cursor-pointer hover:bg-destructive/10 group transition-all"
                        onClick={() => setFilters(prev => ({ ...prev, valorMin: "", valorMax: "" }))}
                      >
                        R$ {filters.valorMin || 0} - R$ {filters.valorMax || maxPrice}
                        <X className="h-3 w-3 group-hover:text-destructive transition-colors" />
                      </Badge>
                    )}

                    {filters.comCupom && (
                      <Badge 
                        variant="secondary" 
                        className="gap-1 cursor-pointer hover:bg-destructive/10 group transition-all"
                        onClick={() => setFilters(prev => ({ ...prev, comCupom: false }))}
                      >
                        <Tag className="h-3 w-3" />
                        Com desconto
                        <X className="h-3 w-3 group-hover:text-destructive transition-colors" />
                      </Badge>
                    )}
                  </div>
                )}

                {/* Separador Visual - DEPRECATED: Mantido por compatibilidade */}
                <div className="hidden"></div>

                {/* Filtros Secundários - REMOVED */}
                <div className="hidden"></div>

                {/* Filtros Terciários - REMOVED: Substituídos pelos cards temáticos acima */}
              </div>
              )
            )}
          </div>
        </section>

        {/* Results Bar with Count and Sort */}
        {!loading && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-muted/30 rounded-lg border border-border/50">
            {/* Contagem e Filtros Ativos */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">
                {filteredProfessionals.length} profissiona{filteredProfessionals.length !== 1 ? 'is' : 'l'} encontrado{filteredProfessionals.length !== 1 ? 's' : ''}
              </p>
              {(filters.profissoes.length > 0 || filters.dias.length > 0 || filters.horarioInicio || filters.horarioFim || filters.valorMin || filters.valorMax || filters.especialidadesNormalizadas.length > 0 || filters.genero.length > 0 || filters.comCupom) && (
                <p className="text-xs">
                  Filtros ativos: {[
                    filters.profissoes.length > 0 && `Profissões (${filters.profissoes.length})`,
                    filters.dias.length > 0 && `Dias (${filters.dias.length})`,
                    (filters.horarioInicio || filters.horarioFim) && 'Horário',
                    (filters.valorMin || filters.valorMax) && 'Preço',
                    filters.especialidadesNormalizadas.length > 0 && `Especialidades (${filters.especialidadesNormalizadas.length})`,
                    filters.genero.length > 0 && `Gênero (${filters.genero.length})`,
                    filters.comCupom && 'Com Desconto'
                  ].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* Ordenação + Paginação */}
            <div className="flex items-center gap-4">
              {/* Dropdown de Ordenação */}
              <Select 
                value={filters.ordenacao} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, ordenacao: value as any }))}
              >
                <SelectTrigger className="w-[180px] h-9 text-sm border bg-background hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Ordenar" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="nome">
                    <span className="flex items-center gap-2">
                      <span>🔤</span> Nome (A-Z)
                    </span>
                  </SelectItem>
                  <SelectItem value="preco_asc">
                    <span className="flex items-center gap-2">
                      <span>💰</span> Menor Preço
                    </span>
                  </SelectItem>
                  <SelectItem value="preco_desc">
                    <span className="flex items-center gap-2">
                      <span>💰</span> Maior Preço
                    </span>
                  </SelectItem>
                  <SelectItem value="destaque">
                    <span className="flex items-center gap-2">
                      <span>⭐</span> Destaque
                    </span>
                  </SelectItem>
                  <SelectItem value="disponibilidade">
                    <span className="flex items-center gap-2">
                      <span>📅</span> Mais Disponibilidade
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Paginação */}
              {totalPages > 1 && (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Página {currentPage} de {totalPages}
                </span>
              )}
            </div>
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
                              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mb-2 dark:text-white/80">
                                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-medium dark:text-white/80">
                                  {capitalizeText(professional.profissao)}
                                </Badge>
                               {professional.crp_crm && (
                                 <span className="text-xs text-muted-foreground font-mono dark:text-white/80">
                                   {professional.crp_crm}
                                 </span>
                               )}
                             </div>

                             {/* Cupom Badge */}
                             {professionalsWithCoupons?.has(professional.id) && (
                               <Badge className="bg-emerald-500 text-white border-0 shadow-md flex items-center gap-1 w-fit">
                                 <Tag className="h-3 w-3" />
                                 <span>
                                   Cupom disponível: até{' '}
                                   {professionalsWithCoupons.get(professional.id)?.discountType === 'percentage' 
                                     ? `${professionalsWithCoupons.get(professional.id)?.discountValue}% off`
                                     : `R$ ${professionalsWithCoupons.get(professional.id)?.discountValue} off`
                                   }
                                 </span>
                               </Badge>
                             )}
                             
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
                              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2 flex items-center gap-1 dark:text-white/80">
                                <span className="inline-block w-2 h-2 bg-primary rounded-full "></span>
                                Especialidades
                              </p>
                              <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                                <div className="flex flex-wrap gap-3 pr-2">
                                  {formatSpecialties(professional.servicos_raw).map((servico, index) => {
                                    const capitalized = servico.charAt(0).toUpperCase() + servico.slice(1).toLowerCase();
                                    return (
                                      <Badge
                                        key={index}
                                        variant="secondary"
                                        className="text-xs specialty-tag px-2 py-1 font-medium bg-[lightgray] text-black hover:bg-[lightgray]/80 border-transparent rounded-full"
                                      >
                                        {capitalized}
                                      </Badge>
                                    );
                                  })}
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
                            <Link to={buildTenantPath(tenantSlug, `/profissional/${professional.id}`)}>
                              <Star className="h-4 w-4 mr-2" />
                              Ver Perfil
                            </Link>
                          </Button>
                          <Button size="sm" className="flex-1 lg:flex-none btn-gradient shadow-lg" asChild>
                            <Link to={buildTenantPath(tenantSlug, `/agendamento?professionalId=${professional.id}`)}>
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
      {aiConfig.enabled && (
        <AIAssistantModal 
          open={showAIAssistant}
          onOpenChange={setShowAIAssistant}
          professionals={professionals}
        />
      )}
    </div>
  );
};

export default Professionals;
