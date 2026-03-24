import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AboutImageSection } from "@/components/AboutImageSection";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/hooks/useTenant";
import { buildTenantPath, DEFAULT_TENANT_SLUG } from "@/utils/tenantHelpers";
import { useProfessionals } from "@/hooks/useProfessionals";
import { getIllustrativeAvatar } from "@/utils/avatarHelpers";
import { Target, Eye, Lightbulb, ClipboardList, UserCheck, Video, Heart, BarChart3, ShieldCheck, GraduationCap, Users, Building2, Focus, Hospital, Zap, AlertTriangle, Link2, Lock, TrendingUp, Calendar, HelpCircle, ArrowRight } from "lucide-react";

// Divisor orgânico SVG entre seções
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

const About = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || DEFAULT_TENANT_SLUG;
  const isRedeBemEstar = tenantSlug !== 'medcos';

  const getTenantName = () => {
    return tenant?.slug === 'medcos' ? 'A MEDCOS' : 'A Rede Bem-Estar';
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />

      {/* SEÇÃO 1: Hero */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        {isRedeBemEstar ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#5B218E] via-[#5B218E]/90 to-[#5B218E]/70" />
            {/* Formas orgânicas SVG — curvas fluidas */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.08]" viewBox="0 0 1200 600" preserveAspectRatio="none">
              <path d="M0,300 Q300,100 600,300 T1200,300 L1200,600 L0,600 Z" fill="#E281BB" />
              <path d="M0,400 Q400,200 800,400 T1200,350 L1200,600 L0,600 Z" fill="#97D3D9" />
              <ellipse cx="150" cy="100" rx="200" ry="140" fill="#E281BB" opacity="0.5" />
              <ellipse cx="1050" cy="120" rx="180" ry="100" fill="#97D3D9" opacity="0.5" />
            </svg>
            <div className="container mx-auto px-4 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 text-white leading-tight tracking-tight">
                    Bem-estar universitário com continuidade, contexto e inteligência
                  </h1>
                  <p className="text-lg lg:text-xl text-white/80 mb-10 leading-relaxed max-w-2xl">
                    Integramos suporte individual, leitura coletiva e dados institucionais para acompanhar a saúde emocional ao longo do tempo.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      size="lg"
                      onClick={() => document.getElementById('manifesto')?.scrollIntoView({ behavior: 'smooth' })}
                      className="bg-white text-[#5B218E] hover:bg-white/90 font-bold shadow-lg"
                    >
                      Conhecer a solução
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => navigate(buildTenantPath(tenantSlug, '/contato'))}
                      className="border-2 border-white text-white hover:bg-white/15 font-semibold bg-transparent"
                    >
                      <Building2 className="mr-2 h-5 w-5" />
                      Falar com a equipe
                    </Button>
                  </div>
                </div>
                <div className="hidden lg:block relative">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                    <img
                      src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=400&fit=crop"
                      alt="Estudantes universitários em campus"
                      className="w-full h-[400px] object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#5B218E]/40 to-transparent" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-[#E281BB]/30 blur-xl" />
                  <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full bg-[#97D3D9]/30 blur-xl" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
            <div className="container mx-auto px-4 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <AboutImageSection />
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-primary">
                    Cuidando de<br />Quem Cuida
                  </h1>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    {getTenantName()} é uma plataforma de bem-estar universitário focada em médicos e 
                    estudantes de medicina. Unimos atendimento clínico qualificado, fluxos de 
                    apoio e dados agregados para fortalecer aprendizagem, permanência e clima acadêmico.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="default" size="lg" onClick={() => navigate(buildTenantPath(tenantSlug, '/profissionais'))} className="group">
                      <Calendar className="mr-2 h-5 w-5" />
                      Agendar Atendimento
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => navigate(buildTenantPath(tenantSlug, '/contato'))}>
                      <Building2 className="mr-2 h-5 w-5" />
                      Sou de uma Faculdade
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* SEÇÃO 2: Manifesto (apenas Rede Bem-Estar) */}
      {isRedeBemEstar && (
        <>
          <WaveDivider color="#5B218E" />
          <section id="manifesto" className="py-28 lg:py-36 bg-[#F4F4F4]">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center relative">
                <span className="text-6xl lg:text-8xl text-[#5B218E]/10 font-serif absolute -top-8 left-1/2 -translate-x-1/2 select-none">"</span>
                <div className="md:text-center">
                  <h2 className="text-3xl lg:text-4xl font-light text-foreground leading-snug tracking-tight mb-8">
                    Cuidar não é intervir pontualmente.
                    <br />
                    <span className="text-[#5B218E] font-semibold">
                      É <em className="underline decoration-[#E281BB]/60 decoration-2 underline-offset-4">acompanhar</em> ao longo do tempo.
                    </span>
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                    O bem-estar universitário não se resolve em ações isoladas. Ele exige leitura contínua, 
                    contexto e responsabilidade institucional.
                  </p>
                </div>
              </div>
            </div>
          </section>
          <WaveDivider color="#5B218E" flip />
        </>
      )}

      {/* SEÇÃO 3: Para Quem É */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 tracking-tight">Para Quem É</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: GraduationCap,
                title: "Estudantes",
                description: isRedeBemEstar
                  ? "Acompanhamento acessível com suporte contínuo ao longo da jornada acadêmica."
                  : "Acesso rápido a psicólogos e psiquiatras, trilhas e grupos de apoio.",
                borderColor: isRedeBemEstar ? "border-t-[#5B218E]" : "border-t-primary",
                bgColor: "from-primary/10 to-primary/20",
                image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=200&fit=crop",
              },
              {
                icon: Users,
                title: "Docentes",
                description: isRedeBemEstar
                  ? "Ferramentas e suporte para lidar com carga emocional, dinâmica de turma e permanência."
                  : "Suporte individual e orientação para manejo de turma e bem-estar.",
                borderColor: isRedeBemEstar ? "border-t-[#E281BB]" : "border-t-accent",
                bgColor: "from-accent/10 to-accent/20",
                image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=200&fit=crop",
              },
              {
                icon: Building2,
                title: "Instituições",
                description: isRedeBemEstar
                  ? "Visão estruturada e dados agregados para orientar decisões e fortalecer o ambiente acadêmico."
                  : "Visão consolidada por painéis anônimos que apoiam decisões, acolhimento e permanência.",
                borderColor: isRedeBemEstar ? "border-t-[#97D3D9]" : "border-t-primary",
                bgColor: "from-primary/10 to-primary/20",
                image: "https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className={`border-t-4 ${item.borderColor} hover:shadow-xl transition-all group overflow-hidden hover:scale-[1.02]`}>
                  {isRedeBemEstar && (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardHeader className="text-center">
                    {!isRedeBemEstar && (
                      <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br ${item.bgColor} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-12 h-12 text-primary" />
                      </div>
                    )}
                    <CardTitle className="text-2xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO 4: Como Funciona / Como Estruturamos o Cuidado */}
      {isRedeBemEstar && <WaveDivider color="#97D3D9" />}
      <section className={isRedeBemEstar ? "py-24 bg-[#F4F4F4]" : "py-20 bg-muted/30"}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 tracking-tight">
            {isRedeBemEstar ? "Como estruturamos o cuidado" : "Como Funciona"}
          </h2>
          <div className="max-w-4xl mx-auto space-y-8">
            {(isRedeBemEstar
              ? [
                  { icon: Heart, title: "Acompanhamento contínuo", description: "Registro e suporte ao longo do tempo, não apenas em momentos críticos.", iconColor: "text-[#5B218E]", iconBg: "bg-[#5B218E]/10", borderColor: "border-[#5B218E]" },
                  { icon: Eye, title: "Leitura de contexto", description: "Compreensão das dinâmicas acadêmicas, períodos e pressões que afetam o bem-estar.", iconColor: "text-[#E281BB]", iconBg: "bg-[#E281BB]/10", borderColor: "border-[#E281BB]" },
                  { icon: Users, title: "Apoio estruturado", description: "Acesso a suporte clínico individual, trilhas de autocuidado e grupos temáticos.", iconColor: "text-[#97D3D9]", iconBg: "bg-[#97D3D9]/10", borderColor: "border-[#97D3D9]" },
                  { icon: BarChart3, title: "Inteligência institucional", description: "Dados agregados e anônimos que orientam decisões estratégicas das instituições.", iconColor: "text-[#5B218E]", iconBg: "bg-[#5B218E]/10", borderColor: "border-[#5B218E]" },
                ]
              : [
                  { icon: ClipboardList, title: "Triagem Rápida", description: "Avaliação inicial para entender suas necessidades e direcionar para o melhor suporte.", iconColor: "text-primary", iconBg: "bg-primary/10", borderColor: "border-primary" },
                  { icon: UserCheck, title: "Escolha de Profissional", description: "Acesso a psicólogos e psiquiatras especializados no contexto universitário médico.", iconColor: "text-primary", iconBg: "bg-primary/10", borderColor: "border-primary" },
                  { icon: Video, title: "Atendimento Online", description: "Flexibilidade para escolher o formato que melhor se adapta à sua rotina.", iconColor: "text-primary", iconBg: "bg-primary/10", borderColor: "border-primary" },
                  { icon: Heart, title: "Planos de Autocuidado e Grupos Temáticos", description: "Trilhas personalizadas e grupos de apoio para diferentes necessidades.", iconColor: "text-primary", iconBg: "bg-primary/10", borderColor: "border-primary" },
                  { icon: BarChart3, title: "Relatórios Institucionais", description: "Para a instituição: dados agregados e anônimos que orientam ações de prevenção.", iconColor: "text-primary", iconBg: "bg-primary/10", borderColor: "border-primary" },
                ]
            ).map((item, index, arr) => {
              const Icon = item.icon;
              const isLast = index === arr.length - 1;
              const stepNum = String(index + 1).padStart(2, '0');
              return (
                <div key={index} className="relative">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 relative">
                      {isRedeBemEstar && (
                        <span className="absolute -top-3 -left-3 text-4xl font-bold text-[#5B218E]/10 select-none">{stepNum}</span>
                      )}
                      <div className={`w-16 h-16 rounded-full ${item.iconBg} flex items-center justify-center border-2 ${item.borderColor}`}>
                        <Icon className={`w-8 h-8 ${item.iconColor}`} />
                      </div>
                    </div>
                    <Card className="flex-1 hover:shadow-lg transition-all">
                      <CardHeader>
                        <CardTitle className="text-xl">{item.title}</CardTitle>
                        <CardDescription className="text-base">{item.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                  {!isLast && <div className="absolute left-8 top-16 w-0.5 h-8 bg-[#5B218E]/20" />}
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {isRedeBemEstar && <WaveDivider color="#97D3D9" flip />}

      {/* SEÇÃO 5: Diferenciais */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 tracking-tight">Nossos Diferenciais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Focus,
                title: isRedeBemEstar ? "Especialização no contexto acadêmico" : "Foco exclusivo em medicina",
                description: isRedeBemEstar
                  ? "Plataforma desenhada para as demandas específicas do ambiente universitário"
                  : "Especialização no contexto universitário médico",
              },
              {
                icon: Hospital,
                title: "Curadoria clínica",
                description: isRedeBemEstar
                  ? "Profissionais selecionados, supervisionados e alinhados ao contexto acadêmico"
                  : "Profissionais selecionados e supervisionados",
              },
              {
                icon: Zap,
                title: isRedeBemEstar ? "Continuidade no acesso" : "Início rápido",
                description: isRedeBemEstar
                  ? "Suporte contínuo ao longo do tempo, com redução de barreiras de acesso"
                  : "Tempo médio reduzido para primeira sessão",
              },
              {
                icon: AlertTriangle,
                title: isRedeBemEstar ? "Protocolos de risco" : "Fluxos de risco definidos",
                description: isRedeBemEstar
                  ? "Fluxos estruturados para identificação e manejo de situações críticas"
                  : "Protocolos claros para situações críticas",
              },
              {
                icon: Link2,
                title: isRedeBemEstar ? "Integração institucional" : "Integração com campanhas",
                description: isRedeBemEstar
                  ? "Articulação com ações institucionais de prevenção e promoção de saúde"
                  : "Alinhamento com ações institucionais",
              },
              {
                icon: Lock,
                title: "LGPD e confidencialidade",
                description: isRedeBemEstar
                  ? "Dados protegidos por design, com relatórios sempre agregados e anônimos"
                  : "Proteção total de dados e privacidade",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className={`flex items-start gap-4 p-6 bg-card rounded-xl hover:shadow-lg transition-all border border-border ${isRedeBemEstar ? 'hover:border-[#5B218E]/40' : 'hover:border-primary/50'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isRedeBemEstar ? 'bg-[#5B218E]/10' : 'bg-primary/10'}`}>
                    <Icon className={`w-6 h-6 ${isRedeBemEstar ? 'text-[#5B218E]' : 'text-primary'}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO 6: Dados / Indicadores */}
      {isRedeBemEstar && <WaveDivider color="#E281BB" />}
      <section className={isRedeBemEstar ? "py-28 bg-[#F4F4F4]" : "py-20 bg-muted/30"}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className={`font-bold mb-6 tracking-tight ${isRedeBemEstar ? 'text-3xl lg:text-4xl' : 'text-3xl'}`}>
                {isRedeBemEstar
                  ? "Dados que ampliam a capacidade de cuidar"
                  : "Dados que Transformam Decisões"}
              </h2>
              <p className={`text-muted-foreground mb-4 leading-relaxed ${isRedeBemEstar ? 'text-lg' : ''}`}>
                {isRedeBemEstar
                  ? "Leituras agregadas que ajudam instituições a identificar padrões, antecipar riscos e agir com mais precisão."
                  : "Veja métricas agregadas e anônimas que ajudam sua instituição a tomar decisões baseadas em dados reais:"}
              </p>
              {isRedeBemEstar && (
                <p className="text-muted-foreground mb-6 leading-relaxed text-base italic border-l-2 border-[#E281BB]/40 pl-4">
                  Permite sair de decisões reativas para uma gestão contínua do bem-estar.
                </p>
              )}
              <ul className="space-y-3 mb-8">
                {(isRedeBemEstar
                  ? [
                      "Adesão e engajamento por turmas e períodos",
                      "Temas e demandas mais recorrentes",
                      "Correlações com o calendário acadêmico",
                      "Indicadores de permanência e bem-estar coletivo",
                    ]
                  : [
                      "Adesão por turmas e períodos",
                      "Temas mais buscados",
                      "Correlações com calendário acadêmico",
                      "Engajamento em trilhas e grupos",
                    ]
                ).map((item, index) => (
                  <li key={index} className="flex items-center gap-3 group">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-105 transition-all ${isRedeBemEstar ? 'bg-[#5B218E]/10' : 'bg-primary/10'}`}>
                      <TrendingUp className={`w-5 h-5 flex-shrink-0 ${isRedeBemEstar ? 'text-[#5B218E]' : 'text-primary'}`} />
                    </div>
                    <span className="group-hover:translate-x-1 transition-transform">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                onClick={() => setDashboardModalOpen(true)}
                className={isRedeBemEstar ? "bg-[#5B218E] text-white hover:bg-[#5B218E]/90 font-semibold" : "bg-primary text-white hover:bg-primary/90 font-semibold"}
              >
                {isRedeBemEstar ? "Ver exemplo de painel" : "Quero Ver um Exemplo de Painel"}
              </Button>
            </div>
            <div className="space-y-6">
              {isRedeBemEstar && (
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop"
                    alt="Dashboard de dados institucionais"
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              {isRedeBemEstar ? (
                <>
                   <h3 className="text-2xl font-bold mb-6 text-foreground">Impacto</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     {[
                       { label: 'Adesão', valueMain: '87', valueSuffix: '%', desc: 'dos estudantes continuam o acompanhamento', bg: 'bg-[#5B218E]/5', color: '#5B218E' },
                       { label: 'Avaliação', valueMain: '4.8', valueSuffix: '/5', desc: 'satisfação média dos estudantes', bg: 'bg-[#E281BB]/10', color: '#E281BB' },
                       { label: 'Acompanhamentos', valueMain: '320', valueSuffix: '/mês', desc: 'suportes estruturados realizados', bg: 'bg-[#97D3D9]/10', color: '#97D3D9' },
                     ].map((metric) => (
                       <div key={metric.label} className={`${metric.bg} border border-border/40 shadow-sm rounded-xl px-4 py-8 sm:px-6 flex flex-col items-center text-center min-w-0`}>
                         <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{metric.label}</span>
                         <div className="flex items-baseline gap-0.5">
                           <span className="text-5xl font-extrabold leading-tight" style={{ color: metric.color }}>{metric.valueMain}</span>
                           <span className="text-xl font-bold" style={{ color: metric.color }}>{metric.valueSuffix}</span>
                         </div>
                         <span className="text-sm font-medium text-muted-foreground mt-3 max-w-[160px] leading-relaxed">{metric.desc}</span>
                       </div>
                     ))}
                   </div>
                </>
              ) : (
                <Card className="bg-card border-2 hover:shadow-2xl transition-all border-primary/20 hover:border-primary/40">
                  <CardContent className="p-10">
                    <h3 className="text-xl font-semibold mb-8 text-foreground flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Exemplo de Painel
                    </h3>
                    <div className="grid grid-cols-3 gap-8">
                      {[
                        { label: 'Adesão', value: '87%' },
                        { label: 'Avaliação', value: '4.8/5' },
                        { label: 'Acompanhamentos', value: '320/mês' },
                      ].map((metric) => (
                        <div key={metric.label} className="flex flex-col items-center gap-2 py-6">
                          <span className="text-4xl font-bold">{metric.value}</span>
                          <span className="text-sm text-muted-foreground">{metric.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
      {isRedeBemEstar && <WaveDivider color="#E281BB" flip />}

      {/* SEÇÃO 7: Governança */}
      <section className={isRedeBemEstar ? "py-24 bg-background" : "py-20 bg-gradient-to-br from-primary/5 to-accent/5"}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className={`font-bold mb-6 tracking-tight ${isRedeBemEstar ? 'text-2xl lg:text-3xl' : 'text-3xl'}`}>
                {isRedeBemEstar ? "Base clínica, ética e privacidade" : "Governança Clínica, Ética e LGPD"}
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Acompanhamento por profissionais habilitados, protocolos clínicos, supervisões e 
                auditoria de qualidade. Dados assistenciais ficam sob sigilo, relatórios 
                institucionais são sempre agregados e anonimizados.
              </p>
              <Button variant="outline" size={isRedeBemEstar ? "default" : "lg"} onClick={() => navigate(buildTenantPath(tenantSlug, '/termos-servico'))}>
                Ver Termos de Serviço
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: ShieldCheck, label: "Profissionais Habilitados" },
                { icon: ClipboardList, label: "Protocolos Clínicos" },
                { icon: Lock, label: "Sigilo Profissional" },
                { icon: ShieldCheck, label: "LGPD Compliant" },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} className={`text-center hover:shadow-lg transition-all border hover:border-[#5B218E]/30 rounded-xl ${isRedeBemEstar ? 'p-5' : 'p-6 border-2 hover:border-primary/50'}`}>
                    <div className={`mx-auto mb-3 rounded-full flex items-center justify-center ${isRedeBemEstar ? 'w-11 h-11 bg-[#5B218E]/10' : 'w-12 h-12 bg-primary/10'}`}>
                      <Icon className={`${isRedeBemEstar ? 'w-5 h-5 text-[#5B218E]' : 'w-6 h-6 text-primary'}`} />
                    </div>
                    <p className={`font-medium ${isRedeBemEstar ? 'text-sm' : 'text-sm'}`}>{item.label}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 8: Time */}
      {isRedeBemEstar && <WaveDivider color="#97D3D9" />}
      <section className={isRedeBemEstar ? "py-24 bg-[#F4F4F4]" : "py-20 bg-background"}>
        <div className="container mx-auto px-4">
          <h2 className={`font-bold text-center mb-4 tracking-tight ${isRedeBemEstar ? 'text-2xl lg:text-3xl' : 'text-3xl'}`}>
            {isRedeBemEstar ? "Equipe clínica e operação dedicada ao contexto acadêmico" : "Nosso Time"}
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            {isRedeBemEstar
              ? "Profissionais selecionados, supervisionados e alinhados às demandas do ambiente universitário"
              : "Equipe clínica especializada e time de operações dedicados ao público médico"}
          </p>
          <TeamSection navigate={navigate} tenantSlug={tenantSlug} limit={isRedeBemEstar ? 4 : 6} isRedeBemEstar={isRedeBemEstar} />
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" onClick={() => navigate(buildTenantPath(tenantSlug, '/profissionais'))}>
              Ver Todos os Profissionais
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
      {isRedeBemEstar && <WaveDivider color="#97D3D9" flip />}

      {/* SEÇÃO 9: FAQ */}
      <section className={isRedeBemEstar ? "py-24 bg-background" : "py-20 bg-muted/30"}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 justify-center mb-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isRedeBemEstar ? 'bg-[#5B218E]/10' : 'bg-primary/10'}`}>
                <HelpCircle className={`w-7 h-7 ${isRedeBemEstar ? 'text-[#5B218E]' : 'text-primary'}`} />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Perguntas Frequentes</h2>
            </div>
            <p className="text-center text-muted-foreground mb-16">
              Tire suas dúvidas sobre {getTenantName()}
            </p>
            <Accordion type="single" collapsible>
              {(isRedeBemEstar
                ? [
                    {
                      question: "Como funciona a confidencialidade?",
                      answer: "Todo o acompanhamento segue o sigilo profissional previsto nos códigos de ética da Psicologia e Medicina. Dados assistenciais individuais não são compartilhados com a instituição. Apenas relatórios agregados e anônimos são gerados para orientar ações institucionais.",
                    },
                    {
                      question: "Como são os relatórios institucionais?",
                      answer: "Os relatórios são sempre agregados e anonimizados, mostrando tendências gerais como temas mais buscados, períodos de maior demanda e correlações com o calendário acadêmico. Nenhum dado individual é identificável nesses relatórios.",
                    },
                    {
                      question: "Há cobertura de planos ou bolsas?",
                      answer: "Sim, trabalhamos com diferentes modelos: convênio institucional (custeado pela instituição), planos de saúde parceiros e programa de bolsas para estudantes em situação de vulnerabilidade. Consulte sua instituição sobre as opções disponíveis.",
                    },
                    {
                      question: "Qual o tempo médio para iniciar o acompanhamento?",
                      answer: "Após a triagem inicial, o tempo médio para o primeiro acompanhamento é de 3 a 5 dias úteis. Em casos de urgência identificados na triagem, priorizamos o suporte em até 24 horas.",
                    },
                    {
                      question: "Como inicio meu acompanhamento?",
                      answer: "Basta acessar a plataforma, preencher o formulário de triagem inicial e escolher o profissional e horário que melhor se adequam à sua rotina. Você receberá confirmação por e-mail e SMS.",
                    },
                    {
                      question: "Como minha instituição pode participar?",
                      answer: "Entre em contato através do botão 'Falar com a equipe' para uma reunião com nosso time. Faremos uma apresentação personalizada, demonstração da plataforma e discussão sobre modelos de implementação adequados à sua instituição.",
                    },
                  ]
                : [
                    {
                      question: "Como funciona a confidencialidade?",
                      answer: "Todos os atendimentos seguem o sigilo profissional previsto nos códigos de ética da Psicologia e Medicina. Dados assistenciais individuais não são compartilhados com a instituição. Apenas relatórios agregados e anônimos são gerados para orientar ações institucionais.",
                    },
                    {
                      question: "Como são os relatórios institucionais?",
                      answer: "Os relatórios são sempre agregados e anonimizados, mostrando tendências gerais como temas mais buscados, períodos de maior demanda e correlações com o calendário acadêmico. Nenhum dado individual é identificável nesses relatórios.",
                    },
                    {
                      question: "Há cobertura de planos ou bolsas?",
                      answer: "Sim, trabalhamos com diferentes modelos: convênio institucional (custeado pela faculdade), planos de saúde parceiros e programa de bolsas para estudantes em situação de vulnerabilidade. Consulte sua instituição sobre as opções disponíveis.",
                    },
                    {
                      question: "Qual o tempo médio para iniciar?",
                      answer: "Após a triagem inicial, o tempo médio para o primeiro atendimento é de 3 a 5 dias úteis. Em casos de urgência identificados na triagem, priorizamos o atendimento em até 24 horas.",
                    },
                    {
                      question: "Como faço para agendar?",
                      answer: "Basta clicar em 'Agendar Atendimento' no topo da página, preencher o formulário de triagem inicial e escolher o profissional e horário que melhor se adequam à sua rotina. Você receberá confirmação por e-mail e SMS.",
                    },
                    {
                      question: "Como minha instituição pode entrar?",
                      answer: "Entre em contato através do botão 'Sou uma instituição' para agendar uma reunião com nosso time. Faremos uma apresentação personalizada, demonstração da plataforma e discussão sobre modelos de implementação adequados à sua instituição.",
                    },
                  ]
              ).map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className={`text-left ${isRedeBemEstar ? 'hover:text-[#5B218E]' : 'hover:text-primary'}`}>
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

      <Footer />
    </div>
  );
};

// Component: Team Section with Real Data
const TeamSection = ({
  navigate,
  tenantSlug,
  limit = 6,
  isRedeBemEstar = false,
}: {
  navigate: any;
  tenantSlug: string;
  limit?: number;
  isRedeBemEstar?: boolean;
}) => {
  const { data: professionals, isLoading } = useProfessionals(limit);
  
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 ${limit <= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8 max-w-6xl mx-auto`}>
        {Array.from({ length: limit }).map((_, index) => (
          <Card key={index} className="text-center">
            <CardContent className="pt-8">
              <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
              <Skeleton className="h-4 w-1/2 mx-auto mb-3" />
              <Skeleton className="h-16 w-full mb-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!professionals || professionals.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>Nenhum profissional disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${limit <= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8 max-w-6xl mx-auto`}>
      {professionals.map(professional => {
        const photoUrl = professional.foto_perfil_url || getIllustrativeAvatar(null, null, professional.display_name);
        const bio = professional.resumo_profissional || `Profissional qualificado com registro ${professional.crp_crm || 'ativo'}.`;
        const specialties = professional.servicos_normalizados || [];
        return (
          <Card key={professional.id} className="text-center hover:shadow-xl transition-all group rounded-xl">
            <CardContent className="pt-8">
              <Avatar className={`w-24 h-24 mx-auto mb-4 ring-4 group-hover:ring-[#5B218E]/30 transition-all ${isRedeBemEstar ? 'ring-[#5B218E]/10' : 'ring-primary/10 group-hover:ring-primary/30'}`}>
                <AvatarImage src={photoUrl} alt={professional.display_name} />
                <AvatarFallback className={`text-xl ${isRedeBemEstar ? 'bg-gradient-to-br from-[#5B218E]/20 to-[#E281BB]/20' : 'bg-gradient-to-br from-primary/20 to-accent/20'}`}>
                  {getInitials(professional.display_name)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-lg mb-1">{professional.display_name}</h3>
              <p className={`text-sm font-medium mb-3 ${isRedeBemEstar ? 'text-[#5B218E]' : 'text-primary'}`}>
                {professional.profissao || 'Profissional de Saúde'}
              </p>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                {bio}
              </p>
              {/* Mostrar especialidades apenas para não-RBE (reduz aparência marketplace) */}
              {!isRedeBemEstar && specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {specialties.slice(0, 3).map((specialty, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default About;
