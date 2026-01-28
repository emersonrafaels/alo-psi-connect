import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import SearchSection from "@/components/search-section";
import ProfessionalCard from "@/components/professional-card";
import { HeroCarousel } from "@/components/HeroCarousel";
import { supabase } from "@/integrations/supabase/client";
import { usePublicConfig } from "@/hooks/usePublicConfig";
import { useTenant } from "@/hooks/useTenant";
import { buildTenantPath } from "@/utils/tenantHelpers";

interface FeaturedProfessional {
  id: number;
  display_name: string;
  profissao: string | null;
  crp_crm: string | null;
  servicos_raw: string | null;
  preco_consulta: number | null;
  foto_perfil_url: string | null;
}

const Index = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || 'alopsi';
  const [featuredProfessionals, setFeaturedProfessionals] = useState<FeaturedProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const { getConfig } = usePublicConfig(['homepage']);

  useEffect(() => {
    if (tenant) {
      fetchFeaturedProfessionals();
    }
    preloadCriticalImages();
  }, [tenant]);

  const preloadCriticalImages = () => {
    const heroImages = getConfig('homepage', 'hero_images', []);
    const imagesToPreload = [
      "https://alopsi-website.s3.us-east-1.amazonaws.com/imagens/homepage/Hero.png",
      ...(Array.isArray(heroImages) ? heroImages.slice(0, 2) : [heroImages]).filter(Boolean)
    ];
    imagesToPreload.forEach(src => {
      if (src) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src.startsWith('s3://') 
          ? src.replace(/^s3:\/\/([^\/]+)\/(.+)$/, 'https://$1.s3.us-east-1.amazonaws.com/$2') 
          : src;
        document.head.appendChild(link);
      }
    });
  };

  const fetchFeaturedProfessionals = async () => {
    if (!tenant) return;
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select(`
          id, 
          display_name, 
          profissao, 
          crp_crm, 
          servicos_raw, 
          preco_consulta, 
          foto_perfil_url,
          professional_tenants!inner(tenant_id, is_featured, featured_order)
        `)
        .eq('ativo', true)
        .eq('professional_tenants.tenant_id', tenant.id)
        .eq('professional_tenants.is_featured', true)
        .not('preco_consulta', 'is', null)
        .limit(3);
      if (error) throw error;
      // Sort by featured_order after fetching
      const sortedData = (data || []).sort((a, b) => {
        const orderA = a.professional_tenants?.[0]?.featured_order || 999;
        const orderB = b.professional_tenants?.[0]?.featured_order || 999;
        return orderA - orderB;
      });
      setFeaturedProfessionals(sortedData);
    } catch (error) {
      console.error('Erro ao buscar profissionais em destaque:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSpecialties = (servicos: string | null) => {
    if (!servicos) return [];
    return servicos.split(',').map(s => s.trim()).filter(s => s.length > 0).slice(0, 3);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-foreground">
                {tenant?.theme_config?.hero_title || 'Atendimento especializado, online e acessível'}
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                {tenant?.theme_config?.hero_subtitle || 'Encontre profissionais especializados em saúde emocional com atendimento humanizado e de qualidade.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="default" size="lg" onClick={() => navigate(buildTenantPath(tenantSlug, '/profissionais'))}>
                  Encontrar Profissional
                </Button>
                <Button variant="tenant-primary" size="lg" onClick={() => navigate(buildTenantPath(tenantSlug, '/profissionais'))}>
                  Agendar Consulta
                </Button>
              </div>
            </div>
            <HeroCarousel />
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
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
            Voltada Exclusivamente Para Estudantes Universitários
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1 */}
            <div className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center animate-fade-in">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="83, 100" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">83%</span>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Dos estudantes universitários apresentam dificuldades emocionais em seus percursos acadêmicos.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--accent))" strokeWidth="2" strokeDasharray="53, 100" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">53%</span>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Dos estudantes universitários já apresentam sintomas de ansiedade e estresse.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <div className="relative">
                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-1">
                      <div className="w-3 h-3 bg-primary-foreground rounded-full"></div>
                    </div>
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-accent-foreground rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center mt-1">
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-secondary-foreground rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  UM A CADA TRÊS ESTUDANTES:
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Tiveram ao menos um problema de saúde emocional nos últimos 12 meses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-20 bg-background text-foreground relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">Conheça Mais Sobre Nosso Trabalho</h2>
            <p className="text-xl max-w-2xl mx-auto text-muted-foreground">
              Descubra como estamos transformando o cuidado da saúde emocional para estudantes universitários
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Statistics Cards */}
            <div className="space-y-6">
              <div className="bg-card shadow-lg p-8 rounded-2xl border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-foreground">30+</h3>
                    <p className="text-muted-foreground">Profissionais Cadastrados</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Profissionais qualificados e especializados no atendimento a estudantes universitários desde 2022
                </p>
              </div>

              <div className="bg-card shadow-lg p-8 rounded-2xl border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-foreground">500+</h3>
                    <p className="text-muted-foreground">Estudantes Atendidos</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Universitários que encontraram apoio e transformaram suas vidas através do nosso cuidado especializado
                </p>
              </div>

              <div className="bg-card shadow-lg p-8 rounded-2xl border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-foreground">96%</h3>
                    <p className="text-muted-foreground">Satisfação</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Taxa de satisfação dos nossos pacientes com o atendimento recebido
                </p>
              </div>
            </div>

            {/* YouTube Video Player */}
            <div className="relative">
              <div className="bg-card p-4 rounded-2xl border border-border shadow-lg">
                <div className="aspect-video rounded-xl overflow-hidden">
                  <iframe 
                    className="w-full h-full" 
                    src="https://www.youtube.com/embed/_5JzohY3G58" 
                    title="Vídeo sobre Saúde Emocional e Medicina" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen 
                  />
                </div>
                <div className="mt-4 text-center">
                  <p className="font-semibold text-foreground">
                    Saúde Emocional na Medicina: Uma Perspectiva Profissional
                  </p>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Entenda a importância do cuidado psicológico na formação e vida dos profissionais de saúde
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      <section className="py-20 bg-gradient-to-br from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Profissionais em Destaque
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conheça alguns dos nossos profissionais especializados em atendimento a estudantes universitários
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-card p-6 rounded-xl border shadow-sm animate-pulse">
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
              featuredProfessionals.map(professional => (
                <ProfessionalCard
                  key={professional.id}
                  id={professional.id}
                  name={professional.display_name}
                  title={`${professional.profissao || 'Profissional'} - ${professional.crp_crm || 'CRP/CRM'}`}
                  image={professional.foto_perfil_url}
                  specialties={formatSpecialties(professional.servicos_raw)}
                  consultationPrice={professional.preco_consulta}
                  isCompactView
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-lg">
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
          <Button variant="tenant-primary" size="lg" onClick={() => navigate(buildTenantPath(tenantSlug, '/profissionais'))}>
            Agendar Consulta
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
