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
  Moon,
  Check
} from "lucide-react"
import { Link } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { useSearchFilters } from "@/hooks/useSearchFilters"
import { useAIAssistantConfig } from "@/hooks/useAIAssistantConfig"
import { useAuth } from "@/hooks/useAuth"
import { useProfessionalsWithCoupons } from "@/hooks/useProfessionalsWithCoupons"
import { usePatientInstitutions } from "@/hooks/usePatientInstitutions"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIsMobile } from "@/hooks/use-mobile"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
  }, [getFiltersFromURL])

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

  // Utility functions

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
  const uniqueSpecialties = Array.from(
    new Set(
      professionals
        .flatMap(p => p.servicos_normalizados || [])
        .filter(Boolean)
    )
  ).sort()
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

  // Render filter content - Mobile optimized
  const renderFilterContent = () => {
    if (isMobile) {
      return (
        <>
          {/* Mobile Quick Presets */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <Button
              variant={filters.dias.includes(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()]) ? "default" : "outline"}
              onClick={() => {
                const today = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()]
                const timeRange = getBrazilTimeRange()
                if (timeRange) {
                  setFilters(prev => ({ ...prev, dias: [today], horarioInicio: timeRange.horarioInicio, horarioFim: timeRange.horarioFim }))
                }
              }}
              className="flex-shrink-0 h-11 px-4 rounded-full whitespace-nowrap"
            >
              <Zap className="h-4 w-4 mr-1.5" />
              Disponíveis hoje
            </Button>
            <Button
              variant={filters.horarioInicio === "18:00" ? "default" : "outline"}
              onClick={() => setFilters(prev => ({ ...prev, horarioInicio: "18:00", horarioFim: "23:59" }))}
              className="flex-shrink-0 h-11 px-4 rounded-full whitespace-nowrap"
            >
              <Moon className="h-4 w-4 mr-1.5" />
              Horário noturno
            </Button>
            <Button
              variant={filters.dias.includes('saturday') && filters.dias.includes('sunday') ? "default" : "outline"}
              onClick={() => setFilters(prev => ({ ...prev, dias: ['saturday', 'sunday'] }))}
              className="flex-shrink-0 h-11 px-4 rounded-full whitespace-nowrap"
            >
              <Calendar className="h-4 w-4 mr-1.5" />
              Fim de semana
            </Button>
          </div>

          {/* Active Filters Mobile */}
          {getActiveFiltersCount() > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
              {filters.profissoes.map(prof => (
                <Badge key={prof} variant="secondary" className="gap-1 h-8 pl-3 pr-2 cursor-pointer" onClick={() => toggleProfession(prof)}>
                  {prof} <X className="h-3 w-3" />
                </Badge>
              ))}
              {filters.dias.map(day => (
                <Badge key={day} variant="secondary" className="gap-1 h-8 pl-3 pr-2 cursor-pointer" onClick={() => toggleDay(day)}>
                  {getDayAbbrev(day)} <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}

          {/* Mobile Filter Cards */}
          <div className="space-y-3">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-card rounded-lg border-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Profissional</span>
                </div>
                <ChevronDown className="h-5 w-5" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pt-3 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Profissões</label>
                  <Select value={filters.profissoes[0] || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, profissoes: value === "all" ? [] : [value] }))}>
                    <SelectTrigger className="h-12 border-2"><SelectValue placeholder="Todas profissões" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {uniqueProfessions.map(prof => (<SelectItem key={prof} value={prof}>{prof}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Especialidades</label>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-12 border-2">
                        <span>{filters.especialidadesNormalizadas.length > 0 ? `${filters.especialidadesNormalizadas.length} selecionada${filters.especialidadesNormalizadas.length > 1 ? 's' : ''}` : "Todas"}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[70vh]">
                      <SheetHeader><SheetTitle>Especialidades</SheetTitle></SheetHeader>
                      <ScrollArea className="h-[calc(100%-100px)] mt-4">
                        {uniqueSpecialties.map(spec => (
                          <div key={spec} className="flex items-center space-x-3 p-4 rounded-lg hover:bg-muted/70 cursor-pointer">
                            <Checkbox id={`spec-${spec}`} checked={filters.especialidadesNormalizadas.includes(spec)} onCheckedChange={() => toggleEspecialidade(spec)} className="h-6 w-6 border-2" />
                            <label htmlFor={`spec-${spec}`} className="text-base font-medium cursor-pointer flex-1">{spec}</label>
                          </div>
                        ))}
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-card rounded-lg border-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-teal-600" />
                  <span className="font-semibold">Disponibilidade</span>
                </div>
                <ChevronDown className="h-5 w-5" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pt-3 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Dias úteis</label>
                  <div className="grid grid-cols-5 gap-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => (
                      <Button key={day} variant={filters.dias.includes(day) ? "default" : "outline"} onClick={() => toggleDay(day)} className="h-12">
                        {getDayAbbrev(day)}
                      </Button>
                    ))}
                  </div>
                  <label className="text-xs font-medium text-muted-foreground mt-3 block">Fim de semana</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['saturday', 'sunday'].map(day => (
                      <Button key={day} variant={filters.dias.includes(day) ? "default" : "outline"} onClick={() => toggleDay(day)} className="h-12">
                        {getDayLabel(day)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Horário</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="time" value={filters.horarioInicio} onChange={(e) => setFilters(prev => ({ ...prev, horarioInicio: e.target.value }))} className="h-12 border-2" />
                    <Input type="time" value={filters.horarioFim} onChange={(e) => setFilters(prev => ({ ...prev, horarioFim: e.target.value }))} className="h-12 border-2" />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-card rounded-lg border-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Investimento</span>
                </div>
                <ChevronDown className="h-5 w-5" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pt-3 space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <Button variant="outline" size="sm" className="flex-shrink-0 rounded-full" onClick={() => setFilters(prev => ({ ...prev, valorMin: "", valorMax: "200" }))}>Até R$ 200</Button>
                  <Button variant="outline" size="sm" className="flex-shrink-0 rounded-full" onClick={() => setFilters(prev => ({ ...prev, valorMin: "200", valorMax: "400" }))}>R$ 200-400</Button>
                  <Button variant="outline" size="sm" className="flex-shrink-0 rounded-full" onClick={() => setFilters(prev => ({ ...prev, valorMin: "400", valorMax: "" }))}>Acima de R$ 400</Button>
                </div>
                <Slider
                  value={[Number(filters.valorMin) || 0, Number(filters.valorMax) || maxPrice]}
                  onValueChange={(values) => setFilters(prev => ({ ...prev, valorMin: values[0].toString(), valorMax: values[1].toString() }))}
                  min={0}
                  max={maxPrice}
                  step={25}
                  className="[&_[role=slider]]:h-6 [&_[role=slider]]:w-6"
                />
              </CollapsibleContent>
            </Collapsible>
          </div>
        </>
      )
    }

    // Desktop UI
    return (
      <>
        <div className="my-6 border-t border-border/50"></div>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <Button variant="outline" size="sm" onClick={() => { const today = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()]; const timeRange = getBrazilTimeRange(); if (timeRange) { setFilters(prev => ({ ...prev, dias: [today], horarioInicio: timeRange.horarioInicio, horarioFim: timeRange.horarioFim })); toast({ title: "Filtro aplicado", description: `Filtrando a partir de ${timeRange.horarioInicio}` }); } }} className="whitespace-nowrap border-2 hover:border-teal-500 hover:bg-teal-500/15">
            <Zap className="h-4 w-4 mr-1.5" />Disponíveis hoje
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, horarioInicio: "18:00", horarioFim: "23:59" }))} className="whitespace-nowrap border-2 hover:border-indigo-500 hover:bg-indigo-500/15">
            <Moon className="h-4 w-4 mr-1.5" />Horário noturno
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, dias: ['saturday', 'sunday'] }))} className="whitespace-nowrap border-2 hover:border-orange-500 hover:bg-orange-500/15">
            <Calendar className="h-4 w-4 mr-1.5" />Fim de semana
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, comCupom: true }))} className="whitespace-nowrap border-2 hover:border-emerald-500 hover:bg-emerald-500/15">
            <Tag className="h-4 w-4 mr-1.5" />Cupom aplicável
          </Button>
        </div>

        {/* Desktop Filter Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card className="p-5 border-2">
            <CardHeader className="p-0 pb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-base">Profissional</h4>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Profissões</label>
                <Select value={filters.profissoes[0] || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, profissoes: value === "all" ? [] : [value] }))}>
                  <SelectTrigger className="h-10 border-2"><SelectValue placeholder="Todas profissões" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {uniqueProfessions.map(prof => (<SelectItem key={prof} value={prof}>{prof}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Especialidades</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-10 border-2">
                      <span>{filters.especialidadesNormalizadas.length > 0 ? `${filters.especialidadesNormalizadas.length} selecionada${filters.especialidadesNormalizadas.length > 1 ? 's' : ''}` : "Todas"}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4 border-2 pointer-events-auto">
                    <ScrollArea className="h-64">
                      {uniqueSpecialties.map(spec => (
                        <div key={spec} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/70 cursor-pointer">
                          <Checkbox id={`spec-${spec}`} checked={filters.especialidadesNormalizadas.includes(spec)} onCheckedChange={() => toggleEspecialidade(spec)} className="border-2" />
                          <label htmlFor={`spec-${spec}`} className="text-sm font-medium cursor-pointer flex-1">{spec}</label>
                        </div>
                      ))}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Gênero</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-10 border-2">
                      <span>{filters.genero.length > 0 ? filters.genero.map(g => g === 'feminino' ? '♀️' : g === 'masculino' ? '♂️' : '⚧️').join(' ') : "Qualquer"}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4 border-2 pointer-events-auto">
                    {['feminino', 'masculino', 'não-binário'].map(genero => (
                      <div key={genero} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/70 cursor-pointer">
                        <Checkbox id={`gen-${genero}`} checked={filters.genero.includes(genero)} onCheckedChange={() => toggleGenero(genero)} className="border-2" />
                        <label htmlFor={`gen-${genero}`} className="text-sm font-medium cursor-pointer flex-1">
                          {genero === 'feminino' && '♀️'} {genero === 'masculino' && '♂️'} {genero === 'não-binário' && '⚧️'} {genero.charAt(0).toUpperCase() + genero.slice(1)}
                        </label>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          <Card className="p-5 border-2">
            <CardHeader className="p-0 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-600" />
                <h4 className="font-semibold text-base">Disponibilidade</h4>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Dias da Semana</label>
                <div className="grid grid-cols-7 gap-1">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <Button key={day} variant={filters.dias.includes(day) ? "default" : "outline"} size="sm" onClick={() => toggleDay(day)} className="h-10 px-0 text-xs">
                      {getDayAbbrev(day)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Horário</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="time" value={filters.horarioInicio} onChange={(e) => setFilters(prev => ({ ...prev, horarioInicio: e.target.value }))} className="h-9 border-2" />
                  <Input type="time" value={filters.horarioFim} onChange={(e) => setFilters(prev => ({ ...prev, horarioFim: e.target.value }))} className="h-9 border-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="p-5 border-2 mb-4">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <h4 className="font-semibold text-base">Investimento</h4>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-5">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-muted-foreground">Faixa de Preço</label>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  <span>R$ {filters.valorMin || 0}</span><span>-</span><span>R$ {filters.valorMax || maxPrice}</span>
                </div>
              </div>
              <Slider
                value={[Number(filters.valorMin) || 0, Number(filters.valorMax) || maxPrice]}
                onValueChange={(values) => setFilters(prev => ({ ...prev, valorMin: values[0].toString(), valorMax: values[1].toString() }))}
                min={0}
                max={maxPrice}
                step={25}
              />
            </div>
            {user && linkedInstitutions && linkedInstitutions.length > 0 && (
              <div className="flex items-center justify-between p-4 rounded-lg border-2">
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium">Com desconto</p>
                    {professionalsWithCouponsCount > 0 && <p className="text-xs text-muted-foreground">{professionalsWithCouponsCount} profissiona{professionalsWithCouponsCount === 1 ? 'l' : 'is'}</p>}
                  </div>
                </div>
                <Switch checked={filters.comCupom} onCheckedChange={(checked) => setFilters(prev => ({ ...prev, comCupom: checked }))} className="data-[state=checked]:bg-emerald-600" />
              </div>
            )}
          </CardContent>
        </Card>

        {getActiveFiltersCount() > 0 && (
          <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border">
            <span className="text-xs text-muted-foreground self-center font-medium">Filtros ativos:</span>
            {filters.profissoes.map(prof => (<Badge key={prof} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleProfession(prof)}>{prof} <X className="h-3 w-3" /></Badge>))}
            {filters.dias.map(day => (<Badge key={day} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleDay(day)}>{getDayAbbrev(day)} <X className="h-3 w-3" /></Badge>))}
            {filters.especialidadesNormalizadas.map(spec => (<Badge key={spec} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleEspecialidade(spec)}>{spec} <X className="h-3 w-3" /></Badge>))}
          </div>
        )}
      </>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Erro</h1>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchProfessionals} className="mt-4">Tentar novamente</Button>
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
        <section className="text-center mb-12">
          <div className="relative">
            <h1 className="text-5xl font-bold mb-6 text-primary">Nossos Profissionais</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">Conheça nossa equipe de profissionais especializados em saúde mental.</p>
          </div>
          
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
                <Input type="text" placeholder="Buscar por nome ou profissão..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 py-3 text-lg border-2" />
              </div>
              <div className="flex gap-2">
                <Button variant={showFilters ? "default" : "outline"} onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-6 py-3 relative">
                  <Filter className="h-4 w-4" />Filtros
                  {getActiveFiltersCount() > 0 && <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">{getActiveFiltersCount()}</span>}
                </Button>
                {aiConfig.enabled && (
                  <Button variant="default" onClick={() => setShowAIAssistant(true)} className="flex items-center gap-2">
                    <Bot className="h-4 w-4" /><Sparkles className="h-3 w-3" />{aiConfig.title}
                  </Button>
                )}
              </div>
            </div>

            {showFilters && (
              isMobile ? (
                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
                    <SheetHeader className="border-b pb-4">
                      <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                          <Filter className="h-5 w-5 text-primary" />Filtros
                          {getActiveFiltersCount() > 0 && <Badge variant="secondary">{getActiveFiltersCount()}</Badge>}
                        </SheetTitle>
                        <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}><X className="h-5 w-5" /></Button>
                      </div>
                      <p className="text-sm text-muted-foreground text-left">{filteredProfessionals.length} profissionais encontrados</p>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100%-140px)] pr-4 mt-4">
                      <div className="pb-24">{renderFilterContent()}</div>
                    </ScrollArea>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg">
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={clearFilters} className="flex-1 h-12" disabled={getActiveFiltersCount() === 0}>Limpar</Button>
                        <Button onClick={() => setShowFilters(false)} className="flex-1 h-12">Ver {filteredProfessionals.length} resultados</Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <div className="bg-gradient-to-br from-card via-muted/30 to-card rounded-xl p-8 shadow-lg border">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Filter className="h-5 w-5 text-primary" />Filtros Avançados</h3>
                    <Button variant="outline" size="sm" onClick={clearFilters}><X className="h-4 w-4 mr-2" />Limpar Todos</Button>
                  </div>
                  {renderFilterContent()}
                </div>
              )
            )}
          </div>
        </section>

        {/* Results, Professional Cards, Pagination */}
        {!loading && (
          <>
            <div className="flex justify-between items-center mb-6 p-4 bg-muted/30 rounded-lg border">
              <div>
                <p className="font-medium">{filteredProfessionals.length} profissiona{filteredProfessionals.length !== 1 ? 'is' : 'l'} encontrado{filteredProfessionals.length !== 1 ? 's' : ''}</p>
              </div>
              <Select value={filters.ordenacao} onValueChange={(value) => setFilters(prev => ({ ...prev, ordenacao: value as any }))}>
                <SelectTrigger className="w-[180px]"><ArrowUpDown className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nome">Nome (A-Z)</SelectItem>
                  <SelectItem value="preco_asc">Menor preço</SelectItem>
                  <SelectItem value="preco_desc">Maior preço</SelectItem>
                  <SelectItem value="destaque">Destaque</SelectItem>
                  <SelectItem value="disponibilidade">Disponibilidade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => (<Skeleton key={i} className="h-96" />))}</div>}
            
            {!loading && currentProfessionals.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">Nenhum profissional encontrado</p>
                {getActiveFiltersCount() > 0 && <Button variant="outline" onClick={clearFilters}><X className="h-4 w-4 mr-2" />Limpar Filtros</Button>}
              </div>
            )}

            {!loading && currentProfessionals.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {currentProfessionals.map(professional => (
                    <Card key={professional.id} className="border-2 rounded-lg flex flex-col">
                      <Link to={buildTenantPath(tenantSlug, `/profissional/${professional.id}`)} className="flex flex-col flex-1">
                        <div className="relative h-48 w-full rounded-t-lg overflow-hidden bg-muted">
                          {professional.foto_perfil_url ? (
                            <Avatar>
                              <AvatarImage src={professional.foto_perfil_url} alt={professional.display_name} />
                              <AvatarFallback>{getInitials(professional.display_name)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="flex items-center justify-center h-full w-full bg-muted text-muted-foreground text-4xl font-bold" style={{ backgroundColor: getAvatarColor(professional.display_name) }}>
                              {getInitials(professional.display_name)}
                            </div>
                          )}
                        </div>
                        <CardContent className="flex flex-col flex-1">
                          <CardTitle className="text-lg font-semibold">{professional.display_name}</CardTitle>
                          <CardDescription className="text-sm text-muted-foreground mb-2">{professional.profissao || 'Profissional'}</CardDescription>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatPrice(professional.preco_consulta)}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {professional.servicos_normalizados?.map(servico => (
                              <Badge key={servico} variant="secondary" className="text-xs">{servico}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Link>
                      <div className="p-4 border-t flex justify-between items-center">
                        <Button size="sm" onClick={() => navigate(buildTenantPath(tenantSlug, `/profissional/${professional.id}`))}>Ver Perfil</Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          // Navigate to booking page with default first available session
                          if (professional.sessions.length > 0) {
                            const session = professional.sessions[0]
                            handleTimeSlotClick(professional, session.day, `${session.start_time}-${session.end_time}`)
                          } else {
                            toast({ title: "Sem horários disponíveis", description: "Este profissional não possui horários disponíveis no momento." })
                          }
                        }}>Agendar</Button>
                      </div>
                    </Card>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <Button variant="outline" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    {[...Array(totalPages)].map((_, i) => (
                      <Button key={i + 1} variant={currentPage === i + 1 ? "default" : "outline"} onClick={() => goToPage(i + 1)}>{i + 1}</Button>
                    ))}
                    <Button variant="outline" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
      <Footer />
      {aiConfig.enabled && <AIAssistantModal open={showAIAssistant} onOpenChange={setShowAIAssistant} />}
    </div>
  )
}

export default Professionals
