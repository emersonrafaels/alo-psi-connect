import { useEffect, useState } from "react";
import { InstitutionalDashboardModal } from "@/components/InstitutionalDashboardModal";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import ProfessionalCard from "@/components/professional-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { buildTenantPath } from "@/utils/tenantHelpers";
import {
  Heart, TrendingUp, Users, Building2, Eye, Lightbulb,
  ShieldCheck, Lock, GraduationCap, AlertTriangle, Calendar,
  HelpCircle, ArrowRight, Focus, Brain, BarChart3, Link2
} from "lucide-react";

interface FeaturedProfessional {
  id: number;
  display_name: string;
  profissao: string | null;
  crp_crm: string | null;
  servicos_raw: string | null;
  preco_consulta: number | null;
  foto_perfil_url: string | null;
}

const WaveDivider = ({ flip = false, color = "#5B218E" }: { flip?: boolean; color?: string }) => (
  <div className={`w-full overflow-hidden leading-[0] ${flip ? 'rotate-180' : ''}`}>
    <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-[40px]">
      <path
        d="M0,40 C200,80 400,0 600,40 C800,80 1000,0 1200,40 L1200,80 L0,80 Z"
        fill={color}
        fillOpacity="0.06"
      />
    </svg>
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || 'alopsi';
  const [featuredProfessionals, setFeaturedProfessionals] = useState<FeaturedProfessional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenant) fetchFeaturedProfessionals();
  }, [tenant]);

  const fetchFeaturedProfessionals = async () => {
    if (!tenant) return;
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select(`
          id, display_name, profissao, crp_crm, servicos_raw, preco_consulta, foto_perfil_url,
          professional_tenants!inner(tenant_id, is_featured, featured_order)
        `)
        .eq('ativo', true)
        .eq('professional_tenants.tenant_id', tenant.id)
        .eq('professional_tenants.is_featured', true)
        .not('preco_consulta', 'is', null)
        .limit(3);
      if (error) throw error;
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

  const metrics = [
    { value: "500+", label: "Acompanhamentos", color: "#5B218E" },
    { value: "30+", label: "Profissionais", color: "#E281BB" },
    { value: "96%", label: "Satisfação", color: "#97D3D9" },
  ];

  const problems = [
    { icon: AlertTriangle, title: "Pressão constante", desc: "Cobranças acadêmicas, provas e prazos geram acúmulo emocional silencioso." },
    { icon: Calendar, title: "Jornadas intensas", desc: "Rotinas exaustivas que deixam pouco espaço para cuidado pessoal." },
    { icon: TrendingUp, title: "Impacto acumulado", desc: "Problemas não tratados crescem e afetam desempenho, relações e saúde." },
    { icon: Focus, title: "Soluções pontuais", desc: "Modelos reativos não oferecem continuidade nem leitura de contexto." },
  ];

  const pillars = [
    { icon: Heart, title: "Acompanhamento contínuo", desc: "Não episódico. Longitudinal. Construído ao longo do tempo.", color: "#5B218E" },
    { icon: Eye, title: "Leitura de contexto", desc: "Jornada acadêmica, momento do curso, dinâmicas institucionais.", color: "#E281BB" },
    { icon: Users, title: "Apoio estruturado", desc: "Profissionais dedicados, trilhas de cuidado e grupos temáticos.", color: "#97D3D9" },
    { icon: Lightbulb, title: "Inteligência institucional", desc: "Dados agregados que orientam decisões e políticas de bem-estar.", color: "#5B218E" },
  ];

  const audiences = [
    { title: "Estudantes", desc: "Acompanhamento ao longo da jornada universitária, com suporte contínuo adaptado ao seu momento acadêmico.", color: "#5B218E" },
    { title: "Docentes", desc: "Suporte estruturado para lidar com a sobrecarga emocional e fortalecer o papel educador.", color: "#E281BB" },
    { title: "Instituições", desc: "Dados e inteligência para criar políticas de bem-estar baseadas em evidências e contexto real.", color: "#97D3D9" },
  ];

  const differentials = [
    { icon: GraduationCap, title: "Foco no contexto acadêmico", desc: "Desenhado para as dinâmicas da universidade, não adaptado de modelos genéricos." },
    { icon: Link2, title: "Continuidade, não pontualidade", desc: "O cuidado acompanha o estudante ao longo de semestres, não apenas em crises." },
    { icon: Building2, title: "Integração institucional", desc: "Conectamos dados de bem-estar à gestão acadêmica de forma ética e anônima." },
    { icon: BarChart3, title: "Inteligência de dados", desc: "Padrões, tendências e alertas que transformam cuidado reativo em preventivo." },
  ];

  const dataPoints = [
    "Padrões emocionais por período acadêmico",
    "Temas recorrentes por curso e fase",
    "Indicadores de risco antecipado",
    "Engajamento em trilhas e grupos de suporte",
  ];

  const governance = [
    { icon: ShieldCheck, title: "Profissionais habilitados", desc: "CRP/CRM verificados e supervisão clínica contínua." },
    { icon: Lock, title: "Protocolos clínicos", desc: "Diretrizes baseadas em evidência para cada tipo de demanda." },
    { icon: ShieldCheck, title: "LGPD", desc: "Conformidade total com a Lei Geral de Proteção de Dados." },
    { icon: Lock, title: "Anonimização", desc: "Relatórios institucionais sempre agregados e sem dados identificáveis." },
  ];

  const faqItems = [
    { question: "Como funciona a confidencialidade?", answer: "Todo o acompanhamento segue o sigilo profissional previsto nos códigos de ética da Psicologia e Medicina. Dados individuais nunca são compartilhados com a instituição." },
    { question: "Como são os relatórios institucionais?", answer: "Sempre agregados e anonimizados, mostrando tendências gerais como temas mais buscados, períodos de maior demanda e correlações com o calendário acadêmico." },
    { question: "Qual o tempo médio para iniciar o acompanhamento?", answer: "Após a triagem inicial, o tempo médio para o primeiro acompanhamento é de 3 a 5 dias úteis. Em casos de urgência, priorizamos o suporte em até 24 horas." },
    { question: "Como inicio meu acompanhamento?", answer: "Acesse a plataforma, preencha o formulário de triagem inicial e escolha o profissional e horário que melhor se adequam à sua rotina." },
    { question: "Como minha instituição pode participar?", answer: "Entre em contato pelo botão 'Falar com a equipe' para uma apresentação personalizada e discussão sobre modelos de implementação." },
  ];

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />

      {/* 1. Hero */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5B218E] via-[#5B218E]/90 to-[#5B218E]/70" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" viewBox="0 0 1200 600" preserveAspectRatio="none">
          <path d="M0,300 Q300,100 600,300 T1200,300 L1200,600 L0,600 Z" fill="#E281BB" />
          <path d="M0,400 Q400,200 800,400 T1200,350 L1200,600 L0,600 Z" fill="#97D3D9" />
          <ellipse cx="150" cy="100" rx="200" ry="140" fill="#E281BB" opacity="0.5" />
          <ellipse cx="1050" cy="120" rx="180" ry="100" fill="#97D3D9" opacity="0.5" />
        </svg>
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 text-white leading-tight tracking-tight">
            Estruturando o cuidado emocional ao longo da jornada universitária
          </h1>
          <p className="text-lg lg:text-xl text-white/80 mb-10 max-w-3xl mx-auto leading-relaxed">
            Integramos suporte clínico, leitura de contexto e dados institucionais para acompanhar estudantes e fortalecer ambientes acadêmicos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-[#5B218E] hover:bg-white/90 font-semibold px-8" onClick={() => navigate(buildTenantPath(tenantSlug, '/sobre'))}>
              Conhecer a solução
            </Button>
            <Button size="lg" className="border-2 border-white bg-transparent text-white hover:bg-white/10 font-semibold px-8" onClick={() => navigate(buildTenantPath(tenantSlug, '/contato'))}>
              Falar com a equipe
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Faixa de reforço — Big Numbers */}
      <section className="py-16 bg-[#F4F4F4]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto text-center mb-6">
            {metrics.map((m) => (
              <div key={m.label} className="flex flex-col items-center">
                <span className="text-5xl font-extrabold leading-tight" style={{ color: m.color }}>{m.value}</span>
                <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground mt-2">{m.label}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Apoiando estudantes, docentes e instituições com cuidado contínuo
          </p>
        </div>
      </section>

      {/* 3. O Problema */}
      <WaveDivider color="#5B218E" />
      <section className="py-24 bg-[#F4F4F4]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-6 tracking-tight">
            O desafio do cuidado emocional na universidade
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            83% dos estudantes universitários enfrentam dificuldades emocionais durante a graduação
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {problems.map((p) => (
              <div key={p.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-[#5B218E]/10 flex items-center justify-center mb-4">
                  <p.icon className="w-6 h-6 text-[#5B218E]" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-12 text-lg font-medium text-[#5B218E]">
            O cuidado precisa ser contínuo, contextual e estruturado
          </p>
        </div>
      </section>
      <WaveDivider color="#5B218E" flip />

      {/* 4. Nossa Abordagem */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4 tracking-tight">
            Como estruturamos o cuidado
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            Quatro pilares que transformam cuidado pontual em acompanhamento contínuo
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {pillars.map((p) => (
              <div key={p.title} className="text-center">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: `${p.color}15` }}>
                  <p.icon className="w-7 h-7" style={{ color: p.color }} />
                </div>
                <h3 className="font-bold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Para Quem É */}
      <WaveDivider color="#97D3D9" />
      <section className="py-24 bg-[#F4F4F4]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16 tracking-tight">
            Para quem é
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {audiences.map((a) => (
              <div key={a.title} className="bg-white rounded-2xl p-8 shadow-sm" style={{ borderTop: `3px solid ${a.color}` }}>
                <h3 className="text-xl font-bold text-foreground mb-3">{a.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <WaveDivider color="#97D3D9" flip />

      {/* 6. Diferenciação */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4 tracking-tight">
            Por que a Rede Bem-Estar é diferente
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            Não somos uma clínica online nem um marketplace de profissionais
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {differentials.map((d) => (
              <div key={d.title} className="flex gap-4 p-6 rounded-2xl bg-[#F4F4F4] hover:shadow-sm transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#5B218E]/10 flex items-center justify-center shrink-0">
                  <d.icon className="w-6 h-6 text-[#5B218E]" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{d.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Dados */}
      <WaveDivider color="#E281BB" />
      <section className="py-24 bg-[#F4F4F4]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4 tracking-tight">
              Dados que ampliam a capacidade de cuidar
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Transformamos sinais individuais em inteligência coletiva para orientar decisões institucionais
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {dataPoints.map((point) => (
                <div key={point} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-[#E281BB] shrink-0" />
                  <span className="text-sm text-foreground">{point}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground italic mb-8">
              Permite sair de decisões reativas para uma gestão contínua do bem-estar
            </p>
            <div className="text-center">
              <Button className="bg-[#5B218E] text-white hover:bg-[#5B218E]/90" onClick={() => setDashboardModalOpen(true)}>
                Ver exemplo de painel <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
      <WaveDivider color="#E281BB" flip />

      {/* 8. Governança */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4 tracking-tight">
            Base clínica, ética e privacidade
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            Estrutura sólida para um cuidado responsável e confiável
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {governance.map((g) => (
              <div key={g.title} className="text-center p-6">
                <div className="w-12 h-12 rounded-full bg-[#5B218E]/8 flex items-center justify-center mx-auto mb-4">
                  <g.icon className="w-6 h-6 text-[#5B218E]" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-sm">{g.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Equipe */}
      <WaveDivider color="#97D3D9" />
      <section className="py-24 bg-[#F4F4F4]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4 tracking-tight">
            Equipe especializada no contexto acadêmico
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            Profissionais selecionados, supervisionados e alinhados às demandas do ambiente universitário
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
                  <div className="h-6 bg-muted rounded mb-3 w-3/4" />
                  <div className="h-4 bg-muted rounded mb-2 w-1/2" />
                  <div className="h-3 bg-muted rounded w-full" />
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
                <p className="text-muted-foreground">Nenhum profissional disponível no momento</p>
              </div>
            )}
          </div>
        </div>
      </section>
      <WaveDivider color="#97D3D9" flip />

      {/* 10. Vídeo */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4 tracking-tight">
            Conheça mais sobre nosso trabalho
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Descubra como estamos transformando o cuidado emocional no ambiente universitário
          </p>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <div className="aspect-video rounded-xl overflow-hidden">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/_5JzohY3G58"
                  title="Vídeo sobre Saúde Emocional"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FAQ */}
      <WaveDivider color="#5B218E" />
      <section className="py-24 bg-[#F4F4F4]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-[#5B218E]/10 flex items-center justify-center">
                <HelpCircle className="w-7 h-7 text-[#5B218E]" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Perguntas Frequentes</h2>
            </div>
            <p className="text-center text-muted-foreground mb-16">
              Tire suas dúvidas sobre a Rede Bem-Estar
            </p>
            <Accordion type="single" collapsible>
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left hover:text-[#5B218E]">
                    <span className="font-medium">{item.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
      <WaveDivider color="#5B218E" flip />

      {/* 12. CTA Final */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5B218E] via-[#5B218E]/90 to-[#5B218E]/70" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 1200 400" preserveAspectRatio="none">
          <path d="M0,200 Q300,50 600,200 T1200,200 L1200,400 L0,400 Z" fill="#E281BB" />
          <path d="M0,300 Q400,150 800,300 T1200,250 L1200,400 L0,400 Z" fill="#97D3D9" />
        </svg>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
            Vamos estruturar o cuidado na sua instituição
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Conheça como a Rede Bem-Estar pode transformar o bem-estar emocional na sua universidade
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-[#5B218E] hover:bg-white/90 font-semibold px-8" onClick={() => navigate(buildTenantPath(tenantSlug, '/contato'))}>
              Falar com a equipe
            </Button>
            <Button size="lg" className="border-2 border-white bg-transparent text-white hover:bg-white/10 font-semibold px-8" onClick={() => navigate(buildTenantPath(tenantSlug, '/contato'))}>
              Agendar apresentação
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
