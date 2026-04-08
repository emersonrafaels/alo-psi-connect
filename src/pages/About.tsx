import { useState, useEffect } from "react";
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
import {
  Target, Eye, Lightbulb, ClipboardList, UserCheck, Video, Heart, BarChart3,
  ShieldCheck, GraduationCap, Users, Building2, Focus, Hospital, Zap,
  AlertTriangle, Link2, Lock, TrendingUp, Calendar, HelpCircle, ArrowRight,
  BookOpen, Headphones, Sparkles, Brain, Play, Activity, Monitor,
} from "lucide-react";
import { InstitutionalDashboardModal } from "@/components/InstitutionalDashboardModal";

const About = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || DEFAULT_TENANT_SLUG;
  const isRedeBemEstar = tenantSlug !== 'medcos';
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getTenantName = () => {
    return tenant?.slug === 'medcos' ? 'A MEDCOS' : 'A Rede Bem-Estar';
  };

  return (
    <div className="min-h-screen bg-[hsl(0,0%,97.6%)] font-sans">
      <Header />

      {isRedeBemEstar ? (
        <>
          {/* ═══════ HERO ═══════ */}
          <section className="relative pt-24 pb-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-8 relative z-10">
              <div className="max-w-3xl">
                <h1 className="text-5xl md:text-7xl font-extrabold text-[hsl(271,100%,23%)] tracking-tight leading-tight mb-8">
                  Inteligência emocional a serviço da{" "}
                  <span className="text-[hsl(271,37%,47%)]">educação.</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-12">
                  Unimos tecnologia SaaS avançada e cuidado humano para criar ecossistemas de bem-estar escaláveis em instituições de ensino.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-[hsl(0,0%,95.3%)] px-4 py-2 rounded-full border border-border/20">
                    <BarChart3 className="w-5 h-5 text-[hsl(184,43%,29%)]" />
                    <span className="text-sm font-semibold text-[hsl(184,43%,29%)]">Dados Longitudinais</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[hsl(0,0%,95.3%)] px-4 py-2 rounded-full border border-border/20">
                    <ShieldCheck className="w-5 h-5 text-[hsl(184,43%,29%)]" />
                    <span className="text-sm font-semibold text-[hsl(184,43%,29%)]">Privacidade Garantida</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════ POR QUE EXISTIMOS ═══════ */}
          <section className="py-24 bg-[hsl(0,0%,95.3%)]">
            <div className="max-w-7xl mx-auto px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="relative rounded-3xl overflow-hidden h-[500px]" style={{ boxShadow: '0 12px 40px -4px rgba(26,28,28,0.06)' }}>
                  <img
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
                    alt="Equipe de educadores discutindo estratégias de saúde mental"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(271,100%,23%)]/40 to-transparent" />
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-[hsl(271,100%,23%)] mb-6">Por que existimos?</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                    O cenário educacional moderno exige mais do que apenas instrução acadêmica.
                    Identificamos uma lacuna crítica entre o desempenho estudantil e a saúde mental.
                    A Rede Bem-Estar nasceu para preencher esse espaço através de uma plataforma que
                    traduz sentimentos em insights acionáveis.
                  </p>
                  <ul className="space-y-6">
                    <li className="flex gap-4">
                      <div className="bg-[hsl(271,64%,34%)]/10 p-2 rounded-lg h-fit">
                        <Activity className="w-6 h-6 text-[hsl(271,100%,23%)]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">Monitoramento Preventivo</h4>
                        <p className="text-muted-foreground">Identificamos padrões de risco antes que se tornem crises institucionais.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="bg-[hsl(271,64%,34%)]/10 p-2 rounded-lg h-fit">
                        <Brain className="w-6 h-6 text-[hsl(271,100%,23%)]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">Literacia Emocional</h4>
                        <p className="text-muted-foreground">Educamos para a resiliência através de módulos interativos e científicos.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════ NOSSA IDENTIDADE (Bento Grid) ═══════ */}
          <section className="py-24 bg-[hsl(0,0%,97.6%)]">
            <div className="max-w-7xl mx-auto px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-[hsl(271,100%,23%)]">Nossa Identidade</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
                  Uma equipe multidisciplinar unida pela paixão em transformar vidas através da ciência e tecnologia.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 md:h-[600px]">
                {/* Main card */}
                <div className="md:col-span-2 md:row-span-2 bg-white p-8 rounded-3xl flex flex-col justify-end relative overflow-hidden" style={{ boxShadow: '0 12px 40px -4px rgba(26,28,28,0.06)' }}>
                  <div className="absolute top-0 right-0 p-8 opacity-20">
                    <Users className="w-24 h-24 text-[hsl(271,100%,23%)]" />
                  </div>
                  <h3 className="text-3xl font-bold text-[hsl(271,100%,23%)] mb-4">Especialistas de Alma</h3>
                  <p className="text-muted-foreground">
                    Nossa rede conta com mais de 200 psicólogos, pedagogos e engenheiros de dados
                    trabalhando em harmonia para entregar o melhor cuidado digital do Brasil.
                  </p>
                </div>
                {/* Impact card */}
                <div className="md:col-span-2 bg-[hsl(271,64%,34%)] text-white p-8 rounded-3xl flex items-center justify-between" style={{ boxShadow: '0 12px 40px -4px rgba(26,28,28,0.06)' }}>
                  <div>
                    <span className="text-5xl font-bold">50k+</span>
                    <p className="text-white/70 mt-1">Vidas impactadas diariamente</p>
                  </div>
                  <TrendingUp className="w-16 h-16 opacity-50" />
                </div>
                {/* Pedagogia card */}
                <div className="md:col-span-1 bg-[hsl(184,43%,82%)] p-8 rounded-3xl" style={{ boxShadow: '0 12px 40px -4px rgba(26,28,28,0.06)' }}>
                  <GraduationCap className="w-10 h-10 text-[hsl(184,43%,29%)] mb-4" />
                  <h4 className="font-bold text-[hsl(184,48%,17%)]">Pedagogia</h4>
                  <p className="text-[hsl(184,43%,29%)] text-sm">Metodologias validadas pela BNCC.</p>
                </div>
                {/* Tecnologia card */}
                <div className="md:col-span-1 bg-[hsl(0,0%,91%)] p-8 rounded-3xl" style={{ boxShadow: '0 12px 40px -4px rgba(26,28,28,0.06)' }}>
                  <Monitor className="w-10 h-10 text-[hsl(271,100%,23%)] mb-4" />
                  <h4 className="font-bold text-foreground">Tecnologia</h4>
                  <p className="text-muted-foreground text-sm">Infraestrutura robusta e segura.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════ ENGENHARIA DO CUIDADO (Módulos) ═══════ */}
          <section id="modulos" className="py-24 bg-white relative">
            <div className="max-w-7xl mx-auto px-8 relative z-10">
              <div className="mb-16">
                <h2 className="text-4xl font-bold text-[hsl(271,100%,23%)]">Engenharia do Cuidado</h2>
                <p className="text-muted-foreground mt-4">
                  Nossa plataforma SaaS é dividida em módulos inteligentes que se adaptam ao ritmo de cada usuário.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Module 01: Diário */}
                <div
                  className="bg-[hsl(0,0%,97.6%)] rounded-3xl p-8 border border-border/10 hover:border-[hsl(271,100%,23%)]/20 transition-all cursor-pointer"
                  onClick={() => navigate(buildTenantPath(tenantSlug, '/diario-emocional'))}
                >
                  <div className="mb-6 flex justify-between items-start">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[hsl(271,100%,23%)]" style={{ boxShadow: '0 12px 40px -4px rgba(26,28,28,0.06)' }}>
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold tracking-widest text-[hsl(271,100%,23%)]/40 uppercase">Module 01</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-foreground">Diário de Emoções</h3>
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                    Registro semântico intuitivo que utiliza Processamento de Linguagem Natural para identificar tendências de humor.
                  </p>
                  <div className="bg-[hsl(0,0%,95.3%)] rounded-xl p-4 space-y-3">
                    <div className="h-2 w-full bg-[hsl(0,0%,88.6%)] rounded-full overflow-hidden">
                      <div className="h-full bg-[hsl(184,43%,29%)] w-3/4 rounded-full" />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>FREQUÊNCIA</span>
                      <span>75% ESTÁVEL</span>
                    </div>
                  </div>
                </div>

                {/* Module 02: Escalas */}
                <div
                  className="bg-[hsl(0,0%,97.6%)] rounded-3xl p-8 border border-border/10 hover:border-[hsl(271,100%,23%)]/20 transition-all cursor-pointer"
                  onClick={() => navigate(buildTenantPath(tenantSlug, '/profissionais'))}
                >
                  <div className="mb-6 flex justify-between items-start">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[hsl(271,100%,23%)]" style={{ boxShadow: '0 12px 40px -4px rgba(26,28,28,0.06)' }}>
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold tracking-widest text-[hsl(271,100%,23%)]/40 uppercase">Module 02</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-foreground">Escalas Científicas</h3>
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                    Aplicação digital de protocolos validados (PHQ-9, GAD-7) com visualização de dados em tempo real para gestores.
                  </p>
                  <div className="flex gap-2">
                    <div className="w-1/3 h-12 bg-[hsl(184,43%,82%)] rounded-lg" />
                    <div className="w-2/3 h-12 bg-[hsl(271,64%,34%)]/10 rounded-lg" />
                  </div>
                </div>

                {/* Module 03: Cápsulas */}
                <div
                  className="bg-[hsl(0,0%,97.6%)] rounded-3xl p-8 border border-border/10 hover:border-[hsl(271,100%,23%)]/20 transition-all cursor-pointer"
                  onClick={() => navigate(buildTenantPath(tenantSlug, '/encontros'))}
                >
                  <div className="mb-6 flex justify-between items-start">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[hsl(271,100%,23%)]" style={{ boxShadow: '0 12px 40px -4px rgba(26,28,28,0.06)' }}>
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold tracking-widest text-[hsl(271,100%,23%)]/40 uppercase">Module 03</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-foreground">Cápsulas de Resiliência</h3>
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                    Micro-exercícios de mindfulness e TCC (Terapia Cognitivo-Comportamental) gamificados para engajamento contínuo.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[hsl(330,100%,90%)] flex items-center justify-center">
                      <Play className="w-4 h-4 text-[hsl(330,60%,30%)]" />
                    </div>
                    <div className="flex-1 h-1.5 bg-[hsl(0,0%,88.6%)] rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════ NOSSA META (Dados) ═══════ */}
          <section className="py-24 bg-[hsl(271,100%,23%)] text-white overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-8">
                    Nossa Meta: Saúde Mental como Pilar Estratégico.
                  </h2>
                  <p className="text-lg opacity-80 leading-relaxed mb-10">
                    Até 2026, projetamos ser a principal inteligência de dados emocionais para 1.000 instituições
                    de ensino na América Latina, transformando a forma como a educação lida com a subjetividade humana.
                  </p>
                  <div className="grid grid-cols-2 gap-8 mb-10">
                    <div>
                      <div className="text-3xl font-bold mb-2">98%</div>
                      <div className="text-sm opacity-60 uppercase tracking-wider">Acurácia de Dados</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold mb-2">15min</div>
                      <div className="text-sm opacity-60 uppercase tracking-wider">Tempo Médio Diário</div>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => setDashboardModalOpen(true)}
                    className="bg-white text-[hsl(271,100%,23%)] hover:bg-white/90 font-bold shadow-lg"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Ver exemplo de painel
                  </Button>
                </div>
                <div className="relative hidden lg:block">
                  <div className="absolute -inset-4 bg-[hsl(271,64%,34%)]/30 blur-3xl rounded-full" />
                  <img
                    className="rounded-3xl relative z-10 border border-white/10 w-full"
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop"
                    alt="Dashboard de métricas de saúde emocional"
                    loading="lazy"
                    style={{ boxShadow: '0 12px 40px -4px rgba(26,28,28,0.06)' }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ═══════ INSTITUIÇÕES PARCEIRAS ═══════ */}
          <section className="py-24 bg-[hsl(0,0%,97.6%)]">
            <div className="max-w-7xl mx-auto px-8">
              <div className="text-center mb-16">
                <h2 className="text-2xl font-bold text-muted-foreground uppercase tracking-widest opacity-50">
                  Instituições que evoluem conosco
                </h2>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all">
                {['EDUTECH.CO', 'GLOBAL_LEARN', 'SAPIENS_UNI', 'MIND_CORE', 'VITA_SCHOOL'].map((name) => (
                  <div key={name} className="text-2xl font-extrabold text-muted-foreground/60">{name}</div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════ EQUIPE ═══════ */}
          <section className="py-24 bg-[hsl(0,0%,95.3%)]">
            <div className="container mx-auto px-4">
              <p className="text-sm font-semibold text-[hsl(271,100%,23%)] uppercase tracking-widest text-center mb-4">Equipe</p>
              <h2 className="text-2xl lg:text-3xl font-semibold text-center mb-4 tracking-tight">
                Equipe dedicada ao contexto acadêmico
              </h2>
              <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
                Profissionais selecionados, supervisionados e alinhados às demandas do ambiente universitário
              </p>
              <TeamSection navigate={navigate} tenantSlug={tenantSlug} limit={4} isRedeBemEstar={true} />
              <div className="text-center mt-12">
                <Button variant="outline" size="lg" onClick={() => navigate(buildTenantPath(tenantSlug, '/profissionais'))}>
                  Ver Todos os Profissionais
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>

          {/* ═══════ FAQ ═══════ */}
          <section className="py-24 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 justify-center mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[hsl(271,100%,23%)]/10">
                    <HelpCircle className="w-6 h-6 text-[hsl(271,100%,23%)]" />
                  </div>
                  <h2 className="text-3xl font-semibold tracking-tight">Perguntas Frequentes</h2>
                </div>
                <p className="text-center text-muted-foreground mb-12">
                  Tire suas dúvidas sobre {getTenantName()}
                </p>
                <Accordion type="single" collapsible>
                  {[
                    { question: "Como funciona a confidencialidade?", answer: "Todo o acompanhamento segue o sigilo profissional previsto nos códigos de ética da Psicologia e Medicina. Dados assistenciais individuais não são compartilhados com a instituição. Apenas relatórios agregados e anônimos são gerados para orientar ações institucionais." },
                    { question: "Como são os relatórios institucionais?", answer: "Os relatórios são sempre agregados e anonimizados, mostrando tendências gerais como temas mais buscados, períodos de maior demanda e correlações com o calendário acadêmico. Nenhum dado individual é identificável nesses relatórios." },
                    { question: "Há cobertura de planos ou bolsas?", answer: "Sim, trabalhamos com diferentes modelos: convênio institucional (custeado pela instituição), planos de saúde parceiros e programa de bolsas para estudantes em situação de vulnerabilidade. Consulte sua instituição sobre as opções disponíveis." },
                    { question: "Qual o tempo médio para iniciar o acompanhamento?", answer: "Após a triagem inicial, o tempo médio para o primeiro acompanhamento é de 3 a 5 dias úteis. Em casos de urgência identificados na triagem, priorizamos o suporte em até 24 horas." },
                    { question: "Como inicio meu acompanhamento?", answer: "Basta acessar a plataforma, preencher o formulário de triagem inicial e escolher o profissional e horário que melhor se adequam à sua rotina. Você receberá confirmação por e-mail e SMS." },
                    { question: "Como minha instituição pode participar?", answer: "Entre em contato através do botão 'Falar com a equipe' para uma reunião com nosso time. Faremos uma apresentação personalizada, demonstração da plataforma e discussão sobre modelos de implementação adequados à sua instituição." },
                  ].map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left hover:text-[hsl(271,100%,23%)]">
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

          {/* ═══════ CTA FINAL ═══════ */}
          <section className="py-24">
            <div className="max-w-7xl mx-auto px-8">
              <div className="bg-white rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden" style={{ boxShadow: '0 12px 40px -4px rgba(26,28,28,0.06)' }}>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[hsl(271,100%,23%)] to-[hsl(184,43%,29%)]" />
                <h2 className="text-4xl md:text-6xl font-extrabold text-[hsl(271,100%,23%)] mb-8">
                  Pronto para humanizar sua gestão?
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
                  Junte-se à Rede Bem-Estar e comece a construir hoje o horizonte terapêutico da sua instituição.
                </p>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={() => navigate(buildTenantPath(tenantSlug, '/contato'))}
                    className="bg-[hsl(271,64%,34%)] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-[hsl(271,100%,23%)] shadow-xl"
                  >
                    Solicitar Demonstração
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate(buildTenantPath(tenantSlug, '/contato'))}
                    className="bg-[hsl(0,0%,91%)] text-foreground px-10 py-5 rounded-2xl font-bold text-lg hover:bg-[hsl(0,0%,85%)] border-0"
                  >
                    Baixar PDF Metodológico
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          {/* ═══════ MEDCOS HERO ═══════ */}
          <section className="relative overflow-hidden py-24 lg:py-32">
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
          </section>

          {/* ═══════ MEDCOS: Como Funciona ═══════ */}
          <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-semibold text-center mb-4 tracking-tight">Como Funciona</h2>
              <div className="max-w-4xl mx-auto space-y-8 mt-16">
                {[
                  { icon: ClipboardList, title: "Triagem Rápida", description: "Avaliação inicial para entender suas necessidades e direcionar para o melhor suporte." },
                  { icon: UserCheck, title: "Escolha de Profissional", description: "Acesso a psicólogos e psiquiatras especializados no contexto universitário médico." },
                  { icon: Video, title: "Atendimento Online", description: "Flexibilidade para escolher o formato que melhor se adapta à sua rotina." },
                  { icon: Heart, title: "Planos de Autocuidado e Grupos Temáticos", description: "Trilhas personalizadas e grupos de apoio para diferentes necessidades." },
                  { icon: BarChart3, title: "Relatórios Institucionais", description: "Para a instituição: dados agregados e anônimos que orientam ações de prevenção." },
                ].map((item, index, arr) => {
                  const Icon = item.icon;
                  const isLast = index === arr.length - 1;
                  return (
                    <div key={index} className="relative">
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                            <Icon className="w-8 h-8 text-primary" />
                          </div>
                        </div>
                        <Card className="flex-1 hover:shadow-lg transition-all">
                          <CardHeader>
                            <CardTitle className="text-xl">{item.title}</CardTitle>
                            <CardDescription className="text-base">{item.description}</CardDescription>
                          </CardHeader>
                        </Card>
                      </div>
                      {!isLast && <div className="absolute left-8 top-16 w-0.5 h-8 bg-primary/20" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ═══════ MEDCOS: Para Quem É ═══════ */}
          <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-semibold text-center mb-4 tracking-tight">Para Quem É</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
                {[
                  { icon: GraduationCap, title: "Estudantes", description: "Acesso rápido a psicólogos e psiquiatras, trilhas e grupos de apoio.", color: "hsl(271,64%,34%)" },
                  { icon: Users, title: "Docentes", description: "Suporte individual e orientação para manejo de turma e bem-estar.", color: "hsl(330,60%,70%)" },
                  { icon: Building2, title: "Instituições", description: "Visão consolidada por painéis anônimos que apoiam decisões, acolhimento e permanência.", color: "hsl(186,40%,72%)" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card key={item.title} className="border border-border/60 rounded-2xl shadow-sm bg-card text-center">
                      <CardHeader className="pb-2">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-primary/10">
                          <Icon className="w-7 h-7 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ═══════ MEDCOS: Dados ═══════ */}
          <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest mb-4 text-primary">Inteligência de dados</p>
                  <h2 className="text-3xl font-semibold mb-6 tracking-tight">Dados que Transformam Decisões</h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Veja métricas agregadas e anônimas que ajudam sua instituição a tomar decisões baseadas em dados reais:
                  </p>
                  <ul className="space-y-3 mb-8">
                    {["Adesão por turmas e períodos", "Temas mais buscados", "Correlações com calendário acadêmico", "Engajamento em trilhas e grupos"].map((item, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
                          <TrendingUp className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button size="lg" onClick={() => setDashboardModalOpen(true)} className="bg-primary text-white hover:bg-primary/90 font-semibold">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Ver exemplo de painel
                  </Button>
                </div>
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
              </div>
            </div>
          </section>

          {/* ═══════ MEDCOS: Diferenciais ═══════ */}
          <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-semibold text-center mb-4 tracking-tight">Nossos Diferenciais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto mt-16">
                {[
                  { icon: Focus, title: "Foco exclusivo em medicina", description: "Especialização no contexto universitário médico" },
                  { icon: Hospital, title: "Curadoria clínica", description: "Profissionais selecionados e supervisionados" },
                  { icon: Zap, title: "Início rápido", description: "Tempo médio reduzido para primeira sessão" },
                  { icon: AlertTriangle, title: "Fluxos de risco definidos", description: "Protocolos claros para situações críticas" },
                  { icon: Link2, title: "Integração com campanhas", description: "Alinhamento com ações institucionais" },
                  { icon: Lock, title: "LGPD e confidencialidade", description: "Proteção total de dados e privacidade" },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex items-start gap-4 p-5 bg-card rounded-2xl border border-border/60 shadow-sm">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1 text-sm text-foreground">{item.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ═══════ MEDCOS: Equipe ═══════ */}
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
              <p className="text-sm font-semibold uppercase tracking-widest text-center mb-4 text-primary">Equipe</p>
              <h2 className="text-2xl lg:text-3xl font-semibold text-center mb-4 tracking-tight">Nosso Time</h2>
              <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
                Equipe clínica especializada e time de operações dedicados ao público médico
              </p>
              <TeamSection navigate={navigate} tenantSlug={tenantSlug} limit={6} isRedeBemEstar={false} />
              <div className="text-center mt-12">
                <Button variant="outline" size="lg" onClick={() => navigate(buildTenantPath(tenantSlug, '/profissionais'))}>
                  Ver Todos os Profissionais
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>

          {/* ═══════ MEDCOS: FAQ ═══════ */}
          <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 justify-center mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
                    <HelpCircle className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-3xl font-semibold tracking-tight">Perguntas Frequentes</h2>
                </div>
                <p className="text-center text-muted-foreground mb-12">
                  Tire suas dúvidas sobre {getTenantName()}
                </p>
                <Accordion type="single" collapsible>
                  {[
                    { question: "Como funciona a confidencialidade?", answer: "Todos os atendimentos seguem o sigilo profissional previsto nos códigos de ética da Psicologia e Medicina. Dados assistenciais individuais não são compartilhados com a instituição. Apenas relatórios agregados e anônimos são gerados para orientar ações institucionais." },
                    { question: "Como são os relatórios institucionais?", answer: "Os relatórios são sempre agregados e anonimizados, mostrando tendências gerais como temas mais buscados, períodos de maior demanda e correlações com o calendário acadêmico. Nenhum dado individual é identificável nesses relatórios." },
                    { question: "Há cobertura de planos ou bolsas?", answer: "Sim, trabalhamos com diferentes modelos: convênio institucional (custeado pela faculdade), planos de saúde parceiros e programa de bolsas para estudantes em situação de vulnerabilidade. Consulte sua instituição sobre as opções disponíveis." },
                    { question: "Qual o tempo médio para iniciar?", answer: "Após a triagem inicial, o tempo médio para o primeiro atendimento é de 3 a 5 dias úteis. Em casos de urgência identificados na triagem, priorizamos o atendimento em até 24 horas." },
                    { question: "Como faço para agendar?", answer: "Basta clicar em 'Agendar Atendimento' no topo da página, preencher o formulário de triagem inicial e escolher o profissional e horário que melhor se adequam à sua rotina. Você receberá confirmação por e-mail e SMS." },
                    { question: "Como minha instituição pode entrar?", answer: "Entre em contato através do botão 'Sou uma instituição' para agendar uma reunião com nosso time. Faremos uma apresentação personalizada, demonstração da plataforma e discussão sobre modelos de implementação adequados à sua instituição." },
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
        </>
      )}

      <Footer />
      <InstitutionalDashboardModal open={dashboardModalOpen} onOpenChange={setDashboardModalOpen} />
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
          <Card key={index} className="text-center rounded-2xl">
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
          <Card key={professional.id} className="text-center hover:shadow-md transition-shadow rounded-2xl border border-border/60">
            <CardContent className="pt-8">
              <Avatar className={`w-24 h-24 mx-auto mb-4 ring-4 transition-all ${isRedeBemEstar ? 'ring-[hsl(271,64%,34%)]/10' : 'ring-primary/10'}`}>
                <AvatarImage src={photoUrl} alt={professional.display_name} />
                <AvatarFallback className={`text-xl ${isRedeBemEstar ? 'bg-gradient-to-br from-[hsl(271,64%,34%)]/20 to-[hsl(330,60%,70%)]/20' : 'bg-gradient-to-br from-primary/20 to-accent/20'}`}>
                  {getInitials(professional.display_name)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-lg mb-1">{professional.display_name}</h3>
              <p className={`text-sm font-medium mb-3 ${isRedeBemEstar ? 'text-[hsl(271,64%,34%)]' : 'text-primary'}`}>
                {professional.profissao || 'Profissional de Saúde'}
              </p>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                {bio}
              </p>
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
