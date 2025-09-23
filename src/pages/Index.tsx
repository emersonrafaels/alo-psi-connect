import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import SearchSection from "@/components/search-section";
import ProfessionalCard from "@/components/professional-card";
import { FirstLoginWelcome } from "@/components/FirstLoginWelcome";
import { HeroCarousel } from "@/components/HeroCarousel";
import { supabase } from "@/integrations/supabase/client";
import { usePublicConfig } from "@/hooks/usePublicConfig";
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
  const [featuredProfessionals, setFeaturedProfessionals] = useState<FeaturedProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const { getConfig } = usePublicConfig(['homepage']);
  useEffect(() => {
    fetchFeaturedProfessionals();
    preloadCriticalImages();
  }, []);

  // Preload critical hero images for faster loading
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
    try {
      const {
        data,
        error
      } = await supabase.from('profissionais').select('id, display_name, profissao, crp_crm, servicos_raw, preco_consulta, foto_perfil_url').eq('ativo', true).eq('em_destaque', true).not('preco_consulta', 'is', null).order('ordem_destaque', { ascending: true, nullsFirst: false }).order('display_name').limit(3);
      if (error) throw error;
      setFeaturedProfessionals(data || []);
    } catch (error) {
      console.error('Erro ao buscar profissionais em destaque:', error);
    } finally {
      setLoading(false);
    }
  };
  const formatSpecialties = (servicos: string | null) => {
    if (!servicos) return [];
    return servicos.split(',').map(s => s.trim()).filter(s => s.length > 0).slice(0, 3); // Mostrar apenas as 3 primeiras especialidades
  };
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-foreground">
                Atendimento especializado, 
                online e acessível
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Encontre profissionais especializados em saúde mental com atendimento humanizado e de qualidade.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="default" size="lg" className="bg-primary text-primary-foreground" onClick={() => navigate('/profissionais')}>
                  Encontrar Profissional
                </Button>
              <Button variant="accent" size="lg" onClick={() => navigate('/profissionais')}>
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
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
            Voltada Exclusivamente Para Estudantes Universitários
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                  <path d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="83, 100" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">83%</span>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Dos estudantes universitários apresentam dificuldades emocionais em seus percursos acadêmicos.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                  <path d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="53, 100" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">53%</span>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Dos estudantes universitários já apresentam sintomas de ansiedade e estresse.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
              <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <div className="relative">
                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-1">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center mt-1">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  UM A CADA TRÊS ESTUDANTES:
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Tiveram ao menos um problema de saúde mental nos últimos 12 meses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-20 bg-gradient-to-br from-teal-500 to-teal-700 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Conheça Mais Sobre Nosso Trabalho
            </h2>
            <p className="text-xl text-teal-100 max-w-2xl mx-auto">
              Descubra como estamos transformando o cuidado da saúde mental para estudantes universitários
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Statistics Cards */}
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 hover-scale">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👨‍⚕️</span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">30+</h3>
                    <p className="text-teal-100">Profissionais Cadastrados</p>
                  </div>
                </div>
                <p className="text-sm text-teal-100/80">
                  Profissionais qualificados e especializados no atendimento a estudantes universitários desde 2022
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 hover-scale">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">50+</h3>
                    <p className="text-teal-100">Estudantes Atendidos</p>
                  </div>
                </div>
                <p className="text-sm text-teal-100/80">
                  Universitários que encontraram apoio e transformaram suas vidas através do nosso cuidado especializado
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 hover-scale">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">❤️</span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">96%</h3>
                    <p className="text-teal-100">Satisfação</p>
                  </div>
                </div>
                <p className="text-sm text-teal-100/80">
                  Taxa de satisfação dos nossos pacientes com o atendimento recebido
                </p>
              </div>
            </div>
            
            {/* YouTube Video Player */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
                  <iframe width="100%" height="100%" src="https://www.youtube.com/embed/_5JzohY3G58" title="Vídeo sobre Saúde Mental e Medicina" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="w-full h-full"></iframe>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-white font-semibold">
                    Saúde Mental na Medicina: Uma Perspectiva Profissional
                  </p>
                  <p className="text-teal-100 text-sm mt-2">
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
            {loading ?
          // Loading skeleton
          Array.from({
            length: 3
          }).map((_, index) => <div key={index} className="bg-card p-6 rounded-xl border shadow-sm animate-pulse">
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
                </div>) : featuredProfessionals.length > 0 ? featuredProfessionals.map(professional => <ProfessionalCard key={professional.id} id={professional.id} name={professional.display_name} title={`${professional.profissao || 'Profissional'} - ${professional.crp_crm || 'CRP/CRM'}`} image={professional.foto_perfil_url} specialties={formatSpecialties(professional.servicos_raw)} consultationPrice={professional.preco_consulta} isCompactView />) : <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-lg">
                  Nenhum profissional disponível no momento
                </p>
              </div>}
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
          <Button variant="accent" size="lg" className="mt-8" onClick={() => navigate('/profissionais')}>
            Agendar Consulta
          </Button>
        </div>
      </section>

      <Footer />
      
      {/* Welcome modal para primeiro login de profissionais */}
      <FirstLoginWelcome />
    </div>;
};
export default Index;