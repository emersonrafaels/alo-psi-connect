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

const About = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || DEFAULT_TENANT_SLUG;
  const isRedeBemEstar = tenantSlug !== 'medcos';

  const getTenantName = () => {
    return tenant?.slug === 'medcos' ? 'A MEDCOS' : 'A Rede Bem-Estar';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* SEÇÃO 1: Hero */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        {/* Background abstrato para Rede Bem-Estar */}
        {isRedeBemEstar ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#5B218E] via-[#5B218E]/90 to-[#5B218E]/70" />
            {/* Formas orgânicas SVG */}
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1200 600" preserveAspectRatio="none">
              <circle cx="200" cy="150" r="300" fill="#E281BB" />
              <circle cx="900" cy="400" r="250" fill="#97D3D9" />
              <circle cx="600" cy="100" r="180" fill="#E281BB" />
              <ellipse cx="1000" cy="100" rx="200" ry="120" fill="#97D3D9" />
            </svg>
            <div className="container mx-auto px-4 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 text-white leading-tight">
                    Bem-estar universitário com continuidade, contexto e inteligência
                  </h1>
                  <p className="text-lg lg:text-xl text-white/80 mb-10 leading-relaxed max-w-2xl">
                    A Rede Bem-Estar integra acompanhamento individual, leitura coletiva e apoio institucional 
                    para fortalecer permanência, aprendizado e saúde emocional no ambiente acadêmico.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      size="lg"
                      onClick={() => document.getElementById('manifesto')?.scrollIntoView({ behavior: 'smooth' })}
                      className="bg-white text-[#5B218E] hover:bg-white/90 font-bold shadow-lg"
                    >
                      Conhecer a plataforma
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => navigate(buildTenantPath(tenantSlug, '/contato'))}
                      className="border-2 border-white text-white hover:bg-white/15 font-semibold bg-transparent"
                    >
                      <Building2 className="mr-2 h-5 w-5" />
                      Sou uma instituição
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
        <section id="manifesto" className="py-24 lg:py-32 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center relative">
              <span className="text-6xl lg:text-8xl text-primary/10 font-serif absolute -top-8 left-1/2 -translate-x-1/2 select-none">"</span>
              <div className="border-l-4 border-primary pl-8 text-left md:border-l-0 md:pl-0 md:text-center md:border-t-0">
                <h2 className="text-3xl lg:text-4xl font-light text-foreground leading-snug tracking-tight mb-8">
                  Cuidar não é intervir pontualmente.
                  <br />
                  <span className="text-primary font-semibold">É acompanhar ao longo do tempo.</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  O bem-estar universitário não se resolve em ações isoladas. Ele exige leitura contínua, 
                  contexto e responsabilidade institucional.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SEÇÃO 3: Para Quem É */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Para Quem É</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: GraduationCap,
                title: "Estudantes",
                description: isRedeBemEstar
                  ? "Acompanhamento acessível com suporte contínuo ao longo da jornada acadêmica."
                  : "Acesso rápido a psicólogos e psiquiatras, trilhas e grupos de apoio.",
                color: "border-t-primary",
                bgColor: "from-primary/10 to-primary/20",
                image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=200&fit=crop",
              },
              {
                icon: Users,
                title: "Docentes",
                description: isRedeBemEstar
                  ? "Ferramentas e suporte para lidar com carga emocional, dinâmica de turma e permanência."
                  : "Suporte individual e orientação para manejo de turma e bem-estar.",
                color: "border-t-accent",
                bgColor: "from-accent/10 to-accent/20",
                image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=200&fit=crop",
              },
              {
                icon: Building2,
                title: "Instituições",
                description: isRedeBemEstar
                  ? "Visão estruturada e dados agregados para orientar decisões e fortalecer o ambiente acadêmico."
                  : "Visão consolidada por painéis anônimos que apoiam decisões, acolhimento e permanência.",
                color: "border-t-primary",
                bgColor: "from-primary/10 to-primary/20",
                image: "https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className={`border-t-4 ${item.color} hover:shadow-xl transition-all group overflow-hidden hover:scale-[1.02]`}>
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
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">
            {isRedeBemEstar ? "Como estruturamos o cuidado" : "Como Funciona"}
          </h2>
          <div className="max-w-4xl mx-auto space-y-8">
            {(isRedeBemEstar
              ? [
                  { icon: Heart, title: "Acompanhamento contínuo", description: "Registro e suporte ao longo do tempo, não apenas em momentos críticos." },
                  { icon: Eye, title: "Leitura de contexto", description: "Compreensão das dinâmicas acadêmicas, períodos e pressões que afetam o bem-estar." },
                  { icon: Users, title: "Apoio estruturado", description: "Acesso a suporte clínico individual, trilhas de autocuidado e grupos temáticos." },
                  { icon: BarChart3, title: "Inteligência institucional", description: "Dados agregados e anônimos que orientam decisões estratégicas das instituições." },
                ]
              : [
                  { icon: ClipboardList, title: "Triagem Rápida", description: "Avaliação inicial para entender suas necessidades e direcionar para o melhor suporte." },
                  { icon: UserCheck, title: "Escolha de Profissional", description: "Acesso a psicólogos e psiquiatras especializados no contexto universitário médico." },
                  { icon: Video, title: "Atendimento Online", description: "Flexibilidade para escolher o formato que melhor se adapta à sua rotina." },
                  { icon: Heart, title: "Planos de Autocuidado e Grupos Temáticos", description: "Trilhas personalizadas e grupos de apoio para diferentes necessidades." },
                  { icon: BarChart3, title: "Relatórios Institucionais", description: "Para a instituição: dados agregados e anônimos que orientam ações de prevenção." },
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
                        <span className="absolute -top-3 -left-3 text-4xl font-bold text-primary/10 select-none">{stepNum}</span>
                      )}
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <Card className={`flex-1 hover:shadow-lg transition-all ${isRedeBemEstar && index % 2 === 1 ? 'bg-primary/5' : ''}`}>
                      <CardHeader>
                        <CardTitle className="text-xl">{item.title}</CardTitle>
                        <CardDescription className="text-base">{item.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                  {!isLast && <div className="absolute left-8 top-16 w-0.5 h-8 bg-primary/30" />}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO 5: Diferenciais */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Nossos Diferenciais</h2>
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
                title: isRedeBemEstar ? "Agilidade no acesso" : "Início rápido",
                description: isRedeBemEstar
                  ? "Tempo reduzido entre a busca por ajuda e o início do acompanhamento"
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
                <div key={index} className="flex items-start gap-4 p-6 bg-card rounded-lg hover:shadow-lg transition-all border border-border hover:border-primary/50">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
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

      {/* SEÇÃO 6: Dados / Indicadores (expandida para Rede Bem-Estar) */}
      <section className={isRedeBemEstar ? "py-28 bg-muted/30" : "py-20 bg-muted/30"}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className={`font-bold mb-6 ${isRedeBemEstar ? 'text-3xl lg:text-4xl' : 'text-3xl'}`}>
                {isRedeBemEstar
                  ? "Dados que ampliam a capacidade de cuidar"
                  : "Dados que Transformam Decisões"}
              </h2>
              <p className={`text-muted-foreground mb-6 leading-relaxed ${isRedeBemEstar ? 'text-lg' : ''}`}>
                {isRedeBemEstar
                  ? "Leituras agregadas que ajudam instituições a agir com mais precisão, orientando ações de prevenção e fortalecimento do ambiente acadêmico."
                  : "Veja métricas agregadas e anônimas que ajudam sua instituição a tomar decisões baseadas em dados reais:"}
              </p>
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
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                      <TrendingUp className="w-5 h-5 flex-shrink-0 text-primary" />
                    </div>
                    <span className="group-hover:translate-x-1 transition-transform">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                onClick={() => navigate(buildTenantPath(tenantSlug, '/contato'))}
                className="bg-primary text-white hover:bg-primary/90 font-semibold"
              >
                {isRedeBemEstar ? "Solicitar demonstração" : "Quero Ver um Exemplo de Painel"}
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
              <Card className="bg-card border-2 border-primary/20 hover:border-primary/40 hover:shadow-2xl transition-all">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {isRedeBemEstar ? "Painel ilustrativo" : "Exemplo de Painel"}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-end gap-2 h-40 bg-primary/5 rounded-lg p-4">
                      <div className="w-full bg-primary/60 hover:bg-primary rounded-t transition-all cursor-pointer" style={{ height: '65%' }} />
                      <div className="w-full bg-primary/70 hover:bg-primary rounded-t transition-all cursor-pointer" style={{ height: '85%' }} />
                      <div className="w-full bg-primary/50 hover:bg-primary rounded-t transition-all cursor-pointer" style={{ height: '55%' }} />
                      <div className="w-full bg-primary/65 hover:bg-primary rounded-t transition-all cursor-pointer" style={{ height: '75%' }} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-primary/5 hover:bg-primary/10 rounded-lg p-4 transition-all cursor-pointer border-2 border-primary/20 hover:border-primary/40 hover:scale-105 group">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                          <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-2xl font-bold mb-1">87%</p>
                        <p className="text-xs opacity-90">Adesão</p>
                      </div>
                      <div className="bg-primary/5 hover:bg-primary/10 rounded-lg p-4 transition-all cursor-pointer border-2 border-primary/20 hover:border-primary/40 hover:scale-105 group">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                          <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-2xl font-bold mb-1">4.8</p>
                        <p className="text-xs opacity-90">Avaliação</p>
                      </div>
                      <div className="bg-primary/5 hover:bg-primary/10 rounded-lg p-4 transition-all cursor-pointer border-2 border-primary/20 hover:border-primary/40 hover:scale-105 group">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-2xl font-bold mb-1">320</p>
                        <p className="text-xs opacity-90">Atendimentos</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 7: Governança (reduzida para Rede Bem-Estar) */}
      <section className={isRedeBemEstar ? "py-12 bg-muted/20" : "py-20 bg-gradient-to-br from-primary/5 to-accent/5"}>
        <div className="container mx-auto px-4">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto ${isRedeBemEstar ? 'gap-8' : ''}`}>
            <div>
              <h2 className={`font-bold mb-6 ${isRedeBemEstar ? 'text-2xl' : 'text-3xl'}`}>
                {isRedeBemEstar ? "Base clínica, ética e de privacidade" : "Governança Clínica, Ética e LGPD"}
              </h2>
              <p className={`text-muted-foreground mb-8 leading-relaxed ${isRedeBemEstar ? 'text-sm' : ''}`}>
                Atendimento por profissionais habilitados, protocolos clínicos, supervisões e 
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
                  <Card key={index} className={`text-center hover:shadow-lg transition-all border-2 hover:border-primary/50 ${isRedeBemEstar ? 'p-4' : 'p-6'}`}>
                    <div className={`mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center ${isRedeBemEstar ? 'w-10 h-10' : 'w-12 h-12'}`}>
                      <Icon className={`text-primary ${isRedeBemEstar ? 'w-5 h-5' : 'w-6 h-6'}`} />
                    </div>
                    <p className={`font-medium ${isRedeBemEstar ? 'text-xs' : 'text-sm'}`}>{item.label}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 8: Time (reduzido para Rede Bem-Estar) */}
      <section className={isRedeBemEstar ? "py-14 bg-background" : "py-20 bg-background"}>
        <div className="container mx-auto px-4">
          <h2 className={`font-bold text-center mb-4 ${isRedeBemEstar ? 'text-2xl' : 'text-3xl'}`}>
            {isRedeBemEstar ? "Equipe clínica e de operações" : "Nosso Time"}
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            {isRedeBemEstar
              ? "Profissionais qualificados e alinhados às demandas do contexto acadêmico"
              : "Equipe clínica especializada e time de operações dedicados ao público médico"}
          </p>
          <TeamSection navigate={navigate} tenantSlug={tenantSlug} limit={isRedeBemEstar ? 4 : 6} />
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" onClick={() => navigate(buildTenantPath(tenantSlug, '/profissionais'))}>
              Ver Todos os Profissionais
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* SEÇÃO 9: FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <HelpCircle className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-3xl font-bold">Perguntas Frequentes</h2>
            </div>
            <p className="text-center text-muted-foreground mb-16">
              Tire suas dúvidas sobre {getTenantName()}
            </p>
            <Accordion type="single" collapsible>
              {[
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
              ].map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left hover:text-primary">
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
}: {
  navigate: any;
  tenantSlug: string;
  limit?: number;
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
              <div className="flex gap-2 justify-center">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
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
        const specialties = professional.servicos_normalizados || [];
        const bio = professional.resumo_profissional || `Profissional qualificado com registro ${professional.crp_crm || 'ativo'}.`;
        return (
          <Card key={professional.id} className="text-center hover:shadow-xl transition-all group">
            <CardContent className="pt-8">
              <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-primary/10 group-hover:ring-primary/30 transition-all">
                <AvatarImage src={photoUrl} alt={professional.display_name} />
                <AvatarFallback className="text-xl bg-gradient-to-br from-primary/20 to-accent/20">
                  {getInitials(professional.display_name)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-lg mb-1">{professional.display_name}</h3>
              <p className="text-sm text-primary font-medium mb-3">
                {professional.profissao || 'Profissional de Saúde'}
              </p>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                {bio}
              </p>
              {specialties.length > 0 && (
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
