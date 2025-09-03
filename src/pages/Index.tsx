import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import SearchSection from "@/components/search-section"
import ProfessionalCard from "@/components/professional-card"
import { supabase } from "@/integrations/supabase/client"

interface FeaturedProfessional {
  id: number
  display_name: string
  profissao: string | null
  crp_crm: string | null
  servicos_raw: string | null
  preco_consulta: number | null
}

const Index = () => {
  const [featuredProfessionals, setFeaturedProfessionals] = useState<FeaturedProfessional[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProfessionals()
  }, [])

  const fetchFeaturedProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select('id, display_name, profissao, crp_crm, servicos_raw, preco_consulta')
        .eq('ativo', true)
        .not('servicos_raw', 'is', null)
        .not('preco_consulta', 'is', null)
        .order('display_name')
        .limit(2)

      if (error) throw error

      setFeaturedProfessionals(data || [])
    } catch (error) {
      console.error('Erro ao buscar profissionais em destaque:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatSpecialties = (servicos: string | null) => {
    if (!servicos) return []
    return servicos
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 3) // Mostrar apenas as 3 primeiras especialidades
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
                Cuidando De Quem <br />
                Cuida De Nós
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Encontre profissionais especializados em saúde mental com atendimento humanizado e de qualidade.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="bg-primary text-primary-foreground"
                  onClick={() => window.location.href = '/profissionais'}
                >
                  Encontrar Profissional
                </Button>
              <Button 
                variant="accent" 
                size="lg"
                onClick={() => window.location.href = '/profissionais'}
              >
                Agendar Consulta
              </Button>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-80 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Imagem do Hero</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <SearchSection />

      {/* About Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg max-w-4xl mx-auto text-foreground">
            Acreditamos na força do acolhimento e na construção de um ambiente seguro, 
            onde sua história é respeitada, suas dores são ouvidas e seus avanços, celebrados.
          </p>
        </div>
      </section>

      {/* University Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Voltada Exclusivamente Para Estudantes Universitários
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-primary-foreground font-bold">94%</span>
              </div>
              <p className="text-sm text-foreground">
                dos psicólogos consideram <br />
                que administram com <br />
                eficácia seus estudos acadêmicos
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-primary-foreground font-bold">94%</span>
              </div>
              <p className="text-sm text-foreground">
                dos médicos consideram <br />
                que administram sempre <br />
                com prevenção e cuidado
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-primary-foreground font-bold">3</span>
              </div>
              <p className="text-sm text-foreground">
                anos de experiência <br />
                promovendo de saúde mental <br />
                com qualidade 12 meses
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 bg-teal">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="font-semibold mb-2 text-card-foreground">250+</h3>
                <p className="text-sm text-card-foreground">Psicólogos</p>
                <p className="text-xs text-muted-foreground">
                  Nos últimos meses, Â são psicólogos credenciados desde junho de 2022
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="font-semibold mb-2 text-card-foreground">Uma escola tão acolhedora.</h3>
                <p className="text-sm text-card-foreground">
                  Encontre agora de Escutar nós vamos de trabalho nos Encontre
                </p>
              </div>
            </div>
            <div className="bg-primary/20 aspect-video rounded-lg flex items-center justify-center">
              <Button variant="default" size="icon" className="w-16 h-16 rounded-full">
                ▶
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-foreground text-center">
            Profissionais em Destaque
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="bg-card p-6 rounded-lg border animate-pulse">
                  <div className="h-6 bg-muted rounded mb-3 w-3/4"></div>
                  <div className="h-4 bg-muted rounded mb-2 w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                    <div className="h-6 bg-muted rounded w-18"></div>
                  </div>
                </div>
              ))
            ) : featuredProfessionals.length > 0 ? (
              featuredProfessionals.map((professional) => (
                <ProfessionalCard
                  key={professional.id}
                  id={professional.id}
                  name={professional.display_name}
                  title={`${professional.profissao || 'Profissional'} - ${professional.crp_crm || 'CRP/CRM'}`}
                  specialties={formatSpecialties(professional.servicos_raw)}
                  isCompactView
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <p className="text-muted-foreground">
                  Nenhum profissional disponível no momento
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Empatia, Compreensão, Transformação: <br />
            O Seu Caminho Para A Cura.
          </h2>
          <Button 
            variant="accent" 
            size="lg" 
            className="mt-8"
            onClick={() => window.location.href = '/profissionais'}
          >
            Agendar Consulta
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
